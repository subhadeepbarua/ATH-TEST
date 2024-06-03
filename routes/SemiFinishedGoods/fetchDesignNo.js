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

router.get('/', async (req, res) => {
  try {
    const connection = await pool.promise().getConnection();

    const [splitingResults] = await connection.query('SELECT design_no, lot_no, estimated_cs_vch_no, last_operation FROM spliting_header WHERE design_no != "N/A"');

    const results = await Promise.all(splitingResults.map(async row => {
      let additionalData = [];
      let vch_no_query = '';
      let destination_query = '';

      switch (row.last_operation) {
        case null :
          vch_no_query = 'SELECT vch_no FROM spliting_header WHERE estimated_cs_vch_no = ?';
          destination_query = 'SELECT * FROM spliting_destination WHERE vch_no = ?';
          break;

        case 'EMB':
          vch_no_query = 'SELECT vch_no FROM emb_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM emb_rec_destination WHERE vch_no = ?';
          break;
        case 'FUS':
          vch_no_query = 'SELECT vch_no FROM fus_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM fus_rec_destination WHERE vch_no = ?';
          break;
        case 'HND':
          vch_no_query = 'SELECT vch_no FROM handwork_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM handwork_rec_destination WHERE vch_no = ?';
          break;

        case 'PRT':
          vch_no_query = 'SELECT vch_no FROM printing_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM printing_rec_destination WHERE vch_no = ?';
          break;

        case 'STICH':
          vch_no_query = 'SELECT vch_no FROM stitching_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM stitching_rec_destination WHERE vch_no = ?';
          break;

        case 'SMOKING':
          vch_no_query = 'SELECT vch_no FROM smoking_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM smoking_rec_destination WHERE vch_no = ?';
          break;

        case 'REFINISH':
          vch_no_query = 'SELECT vch_no FROM Refinishing_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM Refinishing_rec_destination WHERE vch_no = ?';
          break;

        case 'PLE':
          vch_no_query = 'SELECT vch_no FROM pleating_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM pleating_rec_destination WHERE vch_no = ?';
          break;

        case 'WASH':
          vch_no_query = 'SELECT vch_no FROM washing_rec_header WHERE estimate_cs_vch_no = ?';
          destination_query = 'SELECT * FROM washing_rec_destination WHERE vch_no = ?';
          break;
      }

      if (vch_no_query && destination_query) {
        const [vch_no_result] = await connection.query(vch_no_query, [row.estimated_cs_vch_no]);

        if (vch_no_result.length > 0) {
          const vch_no = vch_no_result[0].vch_no;
          const [destination_result] = await connection.query(destination_query, [vch_no]);
          additionalData = destination_result;
        }
      }

      return {
        ...row,
        additionalData
      };
    }));

    connection.release();
   
    res.json(results);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data');
  }
});

module.exports = router;
