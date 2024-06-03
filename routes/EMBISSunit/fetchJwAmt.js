const express = require("express");
const router = express.Router();
const mysql2 = require("mysql2/promise");
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

router.post("/", async (req, res) => {
  let { jobberName, SvchNo } = req.body;

  if (jobberName === 'Miscellaneous') {
    jobberName = 'N/A';
  }
  let esVchVal;

  try {
    if (SvchNo.includes('FR')) {
      const [frResults] = await pool.query('SELECT estimate_cs_vch_no FROM fus_rec_header WHERE vch_no = ?', [SvchNo]);
      if (frResults.length > 0) {
        esVchVal = frResults[0].estimate_cs_vch_no;
      }
    } else if (SvchNo.includes('ER')) {
      const [erResults] = await pool.query('SELECT estimate_cs_vch_no FROM emb_rec_header WHERE vch_no = ?', [SvchNo]);
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }
    else if (SvchNo.includes('SPLIT')) {
      const [erResults] = await pool.query('SELECT estimated_cs_vch_no FROM spliting_header WHERE vch_no = ?', [SvchNo]);
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimated_cs_vch_no;
      }
    }

    else if (SvchNo.includes('HR')) {
      const [erResults] = await pool.query('SELECT estimate_cs_vch_no FROM handwork_rec_header WHERE vch_no = ?', [SvchNo]);
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes('PR')) {
      const [erResults] = await pool.query('SELECT estimate_cs_vch_no FROM pleating_rec_header WHERE vch_no = ?', [SvchNo]);
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

   
  
    const con = await pool.getConnection();

    const [estimatedCsJwDetailResult] = await con.query("SELECT type, amt FROM Estimated_CS_JW_Detail WHERE vch_no = ? AND jobber_name = ? AND is_other_charge = 0", [esVchVal, jobberName]);

    const jwDetails = estimatedCsJwDetailResult.map(row => ({ type: row.type, amt: row.amt }));

    con.release();

    res.json(jwDetails);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

module.exports = router;


