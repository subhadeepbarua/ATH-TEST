const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');

const router = express.Router();
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// Search endpoint
router.post('/', async (req, res) => {
    try {
        // Trim whitespace from the search value
        const { vchSearchValue } = req.body;
        const trimmedVchSearchValue = vchSearchValue.trim();
        console.log('Trimmed search value:', trimmedVchSearchValue);

        // Array to hold the results from different tables
        const searchResults = [];

        // Tables to search
        const tables = ['spliting_create_item', 'spliting_destination', 'spliting_header', 'spliting_source'];

        // Loop through tables to perform search
        for (const table of tables) {
            // Query to search for the value in the current table
            const query = `SELECT * FROM ${table} WHERE vch_no = ?`;

            // Execute the query
            const connection = await pool.getConnection();
            const [results] = await connection.execute(query, [trimmedVchSearchValue]);
            connection.release();

            // Add results along with table and column names to searchResults array
            results.forEach((row) => {
                searchResults.push({
                    tableName: table,
                    data: row
                });
            });
        }
        res.json(searchResults);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
