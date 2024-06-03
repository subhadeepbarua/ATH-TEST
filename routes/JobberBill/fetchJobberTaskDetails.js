const express = require("express");
const router = express.Router();
const mysql2 = require("mysql2");
require('dotenv').config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

router.post("/", (req, res) => {
  const { jobberName } = req.body;

  if (!jobberName) {
    res.status(400).send("jobberName is required");
    return;
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).send("Error connecting to the database");
      return;
    }

    // Fetch `vch_no`, `design_no`, `actual_qty`, and `estimate_cs_vch_no` from each table
    const fetchDataQuery = `
      SELECT 'emb_rec_header' AS table_name, vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM emb_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'fus_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM fus_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'handwork_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM handwork_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'washing_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM washing_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'Refinishing_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM Refinishing_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'printing_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM printing_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'pleating_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM pleating_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'iron_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM iron_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'stitching_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM stitching_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'smoking_rec_header', vch_no, design_no, NULL AS actual_qty, estimate_cs_vch_no FROM smoking_rec_header WHERE jobber_name = ?
      UNION ALL
      SELECT 'cutting_header', vch_no, design_no, actual_qty, estimate_cs_vch_no FROM cutting_header WHERE jobber_name = ?
    `;

    connection.query(fetchDataQuery, Array(11).fill(jobberName), (error, results) => {
      if (error) {
        connection.release();
        console.error("Error executing query:", error);
        res.status(500).send("Error fetching data");
        return;
      }

      const vchNos = results.map(row => row.vch_no);
      const estimateCsVchNos = results.map(row => row.estimate_cs_vch_no);
      const tableNames = [
        'emb_rec_destination',
        'fus_rec_destination',
        'handwork_rec_source',
        'washing_rec_destination',
        'Refinishing_rec_destination',
        'printing_rec_destination',
        'pleating_rec_destination',
        'iron_rec_destination',
        'stitching_rec_destination',
        'smoking_rec_destination'
      ];

      if (vchNos.length === 0) {
        connection.release();
        res.json(results);
        return;
      }

      // Function to fetch sum of `jw_amt` for a single table
      const fetchSumForTable = (tableName, vchNos) => {
        return new Promise((resolve, reject) => {
          const fetchSumQuery = `
            SELECT vch_no, SUM(jw_amt) AS total_jw_amt
            FROM ${tableName}
            WHERE vch_no IN (?)
            GROUP BY vch_no
          `;
          connection.query(fetchSumQuery, [vchNos], (sumError, sumResults) => {
            if (sumError) {
              return reject(sumError);
            }
            resolve(sumResults);
          });
        });
      };

      // Fetch sum of `jw_amt` for all tables except cutting tables
      const fetchSumPromises = tableNames.map(tableName => fetchSumForTable(tableName, vchNos));

      // Add special case for cutting tables
      const fetchCuttingSum = new Promise((resolve, reject) => {
        const fetchCuttingQuery = `
          SELECT c.vch_no, (cut.actual_qty * c.cutting_charges) AS total_jw_amt
          FROM cutting_header AS cut
          JOIN cutting_component AS c ON cut.vch_no = c.vch_no
          WHERE cut.vch_no IN (?)
        `;

        connection.query(fetchCuttingQuery, [vchNos], (cuttingError, cuttingResults) => {
          if (cuttingError) {
            return reject(cuttingError);
          }
          resolve(cuttingResults);
        });
      });

      fetchSumPromises.push(fetchCuttingSum);

      // Fetch `jobwork_name` from `Estimated_CS_JW_Detail` table
      const fetchJobworkName = (estimateCsVchNos, jobberName) => {
        return new Promise((resolve, reject) => {
          const fetchJobworkQuery = `
            SELECT vch_no, jobwork_name
            FROM Estimated_CS_JW_Detail
            WHERE vch_no IN (?)
              AND jobber_name = ?
          `;
          connection.query(fetchJobworkQuery, [estimateCsVchNos, jobberName], (jobworkError, jobworkResults) => {
            if (jobworkError) {
              return reject(jobworkError);
            }
            resolve(jobworkResults);
          });
        });
      };

      fetchJobworkName(estimateCsVchNos, jobberName)
        .then(jobworkResults => {
          const jobworkMap = jobworkResults.reduce((acc, row) => {
            acc[row.vch_no] = row.jobwork_name;
            return acc;
          }, {});

          Promise.all(fetchSumPromises)
            .then(sumResultsArray => {
              const combinedSumResults = [].concat(...sumResultsArray);

              // Combine the original results with the sum results and jobwork names
              const combinedResults = results.map(row => {
                const sumRow = combinedSumResults.find(sum => sum.vch_no === row.vch_no);
                const jobworkName = jobworkMap[row.estimate_cs_vch_no];
                return {
                  vch_no: row.vch_no,
                  design_no: row.design_no,
                  total_jw_amt: sumRow ? sumRow.total_jw_amt : 0,
                  jobwork_name: jobworkName || ''
                };
              });

              // Send the combined data back to the frontend
              console.log('task details', combinedResults);
              res.json(combinedResults);
            })
            .catch(sumError => {
              console.error("Error executing sum queries:", sumError);
              res.status(500).send("Error fetching sum data");
            })
            .finally(() => {
              connection.release();
            });
        })
        .catch(jobworkError => {
          console.error("Error fetching jobwork names:", jobworkError);
          res.status(500).send("Error fetching jobwork names");
          connection.release();
        });
    });
  });
});



module.exports = router;
