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
  const { month, process } = req.body;
 
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).send("Error fetching data");
      return;
    }

    const query = `
      SELECT design_no 
      FROM fus_rec_header 
      WHERE MONTH(vch_date) = ?
    `;

    connection.query(query, [month], (error, results) => {
      connection.release();

      if (error) {
        console.error("Error executing query:", error);
        res.status(500).send("Error fetching data");
        return;
      }
      console.log('month wise results', results)
      res.json(results);
    });
  });
});

module.exports = router;



  

module.exports = router;
