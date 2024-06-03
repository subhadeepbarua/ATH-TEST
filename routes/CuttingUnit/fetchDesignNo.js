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
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).send("Error fetching data");
      return;
    }
    const sql = `
    SELECT h.*, 
    j.jobwork_name, 
    j.amt, 
    j.is_other_charge,
    j.type,
    j.jobber_name,
    j.jobber_id
FROM   Estimated_CS_header h 
    LEFT JOIN Estimated_CS_JW_Detail j 
           ON h.vch_no = j.vch_no 
WHERE  h.vch_no IN (SELECT vch_no 
                 FROM   Estimated_CS_JW_Detail 
                 WHERE  jobber_name = ?)
    AND (LOWER(j.jobwork_name) LIKE '%cutting%' 
         OR LOWER(j.jobwork_name) = 'freight cost' 
         OR LOWER(j.jobwork_name) = 'freight cost two' 
         OR LOWER(j.jobwork_name) = 'other cost');

      `;

    connection.query(sql, [jobberName], (err, results) => {
      connection.release();

      if (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Error fetching data");
        return;
      }
      const groupedResults = results.reduce((acc, curr) => {
        const {
          jobwork_name,
          amt,
          is_other_charge,
          type,
          jobber_name,
          jobber_id,
          ...rest
        } = curr;
        if (!acc[curr.vch_no]) {
          acc[curr.vch_no] = { ...rest, jobwork_details: [] };
        }
        if (jobwork_name) {
          acc[curr.vch_no].jobwork_details.push({
            jobwork_name,
            amt,
            is_other_charge,
            type,
            jobber_name,
            jobber_id,
          });
        }
        return acc;
      }, {});

      // Fetching job work done from cutting_component table and inserting into groupedResults
      const vchNos = Object.keys(groupedResults);
      if (vchNos.length === 0) {
        // If there are no vchNos, set job_work_done to 0 and send response
        Object.values(groupedResults).forEach(result => result.job_work_done = 0);
        res.json(Object.values(groupedResults));
      } else {
        const query = "SELECT estimate_cs_vch_no, jobwork_bill_made FROM cutting_component WHERE estimate_cs_vch_no IN (?)";
        connection.query(query, [vchNos], (err, rows) => {
          if (err) {
            console.error("Error fetching job work done:", err);
            res.status(500).send("Error fetching data");
            return;
          }
        
          // Mapping job work done to groupedResults
          rows.forEach(row => {
            const { estimate_cs_vch_no, jobwork_bill_made } = row;
            if (groupedResults[estimate_cs_vch_no]) {
              groupedResults[estimate_cs_vch_no].job_work_done = jobwork_bill_made;
            }
          });

        
          res.json(Object.values(groupedResults));
        });
      }
    });
  });
});

module.exports = router;
