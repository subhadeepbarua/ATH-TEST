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

router.post('/', (req, res) => {
    const { jobberName } = req.body;
   
    // SQL query to fetch address data based on jobber_name
    const query = `SELECT jobber_id, address_1, address_2, address_3 FROM jobber_tb WHERE jobber_name = ?`;

    pool.query(query, [jobberName], (error, results) => {
        if (error) {
            console.error("Error executing query:", error);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
        
        // If there are no results, return empty data or handle as needed
        if (results.length === 0) {
            res.status(404).json({ message: "No data found for the provided jobber_name" });
            return;
        }

        // Send the address data back to the client
        const addressData = results[0];
       
        res.json(addressData);
    });
});

module.exports = router;
