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
  const { vchNo, lotNo } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).send("Error fetching data");
      return;
    }

    // Construct the SQL query to fetch data from sfg_destination table
    const fetchDataQuery = `
      SELECT *
      FROM sfg_destination
      WHERE vch_no = ? AND lot_no = ?
    `;

    // Execute the SQL query with the provided vchNo and lotNo
    connection.query(fetchDataQuery, [vchNo, lotNo], (error, results) => {
      connection.release();
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).send("Error fetching data");
        return;
      }

      // Send the fetched data back to the frontend
      console.log('table',results);
      res.json(results);
    });
  });
});

module.exports = router;
