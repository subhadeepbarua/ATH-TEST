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

    pool.query('SELECT estimate_cs_vch_no FROM Refinishing_iss_header WHERE vch_no = ?', [vchNo], (error, results, fields) => {
        if (error) {
            // Handle error
            console.error("Error executing query:", error);
            res.status(500).send("Internal Server Error");
        } else {
            if (results.length > 0) {
                const estimateCsVchNo = results[0].estimate_cs_vch_no;
                res.json(estimateCsVchNo);
            } else {
                res.status(404).send("No matching record found");
            }
        }
    });
});

module.exports = router;
