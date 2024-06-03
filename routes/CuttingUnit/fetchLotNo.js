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

  const query = `SELECT lot_no, vch_no FROM cutting_header ORDER BY master_id DESC LIMIT 1`;

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (results.length === 0) { 
      res.json({ lot_no: "0001", vch_no_suffix: "0001" });
      return;
    }

    const lastLotNo = results[0]?.lot_no || "";
    const lastVchNo = results[0]?.vch_no || "";

    let newLotNo;
    let newVchNoSuffix;

    if (lastLotNo) {
      // Extract the numeric part from lot_no
      const numericPart = parseInt(lastLotNo.split('-')[1]) + 1;
      // Format it to ensure it has four digits
      newLotNo = numericPart.toString().padStart(4, '0');
    } else {
      // If no lot_no exists, initialize with 0001
      newLotNo = '0001';
    }

    if (lastVchNo) {
      // Extract the numeric part from vch_no
      const vchNumericPart = parseInt(lastVchNo.split('-')[2]) + 1;
      // Format it to ensure it has four digits
      newVchNoSuffix = vchNumericPart.toString().padStart(4, '0');
    } else {
      // If no vch_no exists, initialize with 0001
      newVchNoSuffix = '0001';
    }
   
    res.json({ lot_no: newLotNo, vch_no_suffix: newVchNoSuffix });
  });
});



module.exports = router;
