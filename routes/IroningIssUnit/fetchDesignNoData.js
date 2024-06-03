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
  const { vchNo } = req.body;

  // Extract design_no values from vchNo array
  const designNos = vchNo.map(item => item.design_no);

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).send("Error fetching data");
      return;
    }

    // Construct the WHERE clause using LIKE for each design_no
    const likeClauses = designNos.map(designNo => `design_no LIKE '%${designNo}%'`).join(' OR ');
    const checkDesignNoQuery = `
      SELECT design_no, lot_no, estimate_cs_vch_no, vch_no
      FROM sfg_header
      WHERE ${likeClauses}
    `;

    // Execute the SQL query
    connection.query(checkDesignNoQuery, (error, results) => {
      connection.release();
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).send("Error fetching data");
        return;
      }

      // Process the results to create the desired format
      const existingDesignNos = results.flatMap(row => {
        const designNos = JSON.parse(row.design_no);
        const lotNos = JSON.parse(row.lot_no);
        const estimateCsVchNos = JSON.parse(row.estimate_cs_vch_no);
        const vchNo = row.vch_no;

        return designNos.map((designNo, index) => ({
          design_no: designNo,
          lot_no: lotNos[index],
          estimate_cs_vch_no: estimateCsVchNos[index],
          vch_no: vchNo
        }));
      });

      // Send the formatted data back to the frontend
      console.log(existingDesignNos);
      res.json(existingDesignNos);
    });
  });
});

module.exports = router;
