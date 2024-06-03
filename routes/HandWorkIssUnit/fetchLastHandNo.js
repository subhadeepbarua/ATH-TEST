const express = require('express');
const router = express.Router();
const mysql2 = require('mysql2');
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

router.get('/', (req, res) => {
    const query = `SELECT vch_no FROM handwork_iss_header ORDER BY master_id DESC LIMIT 1`;
  
    pool.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      let lastVchNumber = results.length > 0 ? results[0].vch_no : null;
  
      // If no previous vch_no exists, initialize with '0001'
      if (!lastVchNumber) {
        res.json("0001");
        return;
      }
  
      // Extract the number part from the last vch_no
      const lastVchNoSuffix = lastVchNumber.split('-')[1];
  
      // Increment the extracted number part and format it with leading zeros
      const newVchNoSuffix = (parseInt(lastVchNoSuffix) + 1).toString().padStart(3, '0');
      
      res.json(newVchNoSuffix);
    });
  });
  



module.exports = router;
