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

router.get("/", (req, res) => {
  // Construct the SQL query
  const sqlQuery = `
    SELECT vch_no
    FROM Estimated_CS_JW_Detail
    WHERE jobber_name = 'N/A'
    AND jobwork_name LIKE '%stitch%';
  `;

  // Execute the query
  pool.query(sqlQuery, (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Extract vch_no values from the results
    const vchNos = results.map((row) => row.vch_no);

    // Send the vch_no array to the frontend
    res.json(vchNos);
  });
});

module.exports = router;
