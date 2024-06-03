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
  const { data } = req.body;


  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting database connection:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    const sql = `
    SELECT 
        e.*,
        i.unit
    FROM 
        Estimated_CS_Item_Detail e
    LEFT JOIN 
        grp_items_tb i ON e.item_id = i.item_id
    WHERE 
        e.vch_no = ? AND e.group_type = ?;
    `;

    connection.query(sql, [data, 'Raw Material'], (err, results) => {
      connection.release();

      if (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Error fetching data');
        return;
      }

      // Log the results for debugging
      console.log('Query results:', results);

      // Check and log the specific issue with the 'unit' field
      results.forEach((result, index) => {
        console.log(`Result ${index}:`, result);
        if (result.unit === null) {
          console.warn(`Warning: 'unit' is null for result ${index}`, result);
        }
      });

      res.json(results);
    });
  });
});

module.exports = router;
