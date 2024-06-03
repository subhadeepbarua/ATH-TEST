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
  const { lotNoVal } = req.body;
  
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).send("Error fetching data");
      return;
    }
    
    const sql = `
      SELECT jobber_tb.jobber_name, jobber_tb.address_1, jobber_tb.address_2, jobber_tb.address_3
      FROM cutting_header
      INNER JOIN jobber_tb ON cutting_header.jobber_name = jobber_tb.jobber_name
      WHERE cutting_header.lot_no = ?
    `;
    connection.query(sql, [lotNoVal], (queryErr, results) => {
      // Release the connection
      connection.release();

      if (queryErr) {
        console.error("Error executing query:", queryErr);
        res.status(500).send("Error fetching data");
        return;
      }

      // Send the fetched data as the response
      
      res.json(results);
    });
  });
});


  

module.exports = router;
