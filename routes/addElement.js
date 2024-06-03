const express = require('express')
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

// Endpoint to receive data and insert into MySQL table
router.post('/', (req, res) => {
  const { color, quantity, type } = req.body;

  // Check if any value is empty
  if (!color && !type) {
    return res.status(400).json({ message: 'At least one field (color or type) is required.' });
  }

  let sql = 'INSERT INTO mis_tb ';
  let columns = '';
  let values = '';
  const queryParams = [];

  if (color) {
    columns += 'color';
    values += '?';
    queryParams.push(color);
  }

  if (type) {
    if (color) {
      columns += ', ';
      values += ', ';
    }
    columns += 'type';
    values += '?';
    queryParams.push(type);
  }

  sql += `(${columns}) VALUES (${values})`;

  // Insert data into MySQL table
  pool.query(sql, queryParams, (error, results) => {
    if (error) {
      console.error('Error inserting data:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    res.status(200).json({ message: 'Data inserted successfully.' });
  });
});

module.exports = router;
