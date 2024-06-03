const express = require('express')
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


router.get('/',(req, res)=> {
    pool.getConnection((err, connection) => {
        if (err) {
          console.error('Error getting database connection:', err);
          res.status(500).send('Error fetching data');
          return;
        }
        connection.query('SELECT * FROM jobwork_tb', (err, results) => {
            connection.release();

            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Error fetching data');
                return;
            }
           
            res.json(results);
        });
    })
})

module.exports = router;