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
  let { jobberName, SvchNo, processName } = req.body;

  if (jobberName === "Miscellaneous") {
    jobberName = "N/A";
  }
  let esVchVal;

  try {
    
    if (SvchNo.includes("FR")) {
      const [frResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM fus_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (frResults.length > 0) {
        esVchVal = frResults[0].estimate_cs_vch_no;
      }
    
    } 
    
    else if (SvchNo.includes("ER")) {
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM emb_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    } 
    
    else if (SvchNo.includes("SPLIT")) {
      console.log('called split')
      const [erResults] = await pool.query(
        "SELECT estimated_cs_vch_no FROM spliting_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimated_cs_vch_no;

        console.log('values', esVchVal)
      }

    } 
    
    else if (SvchNo.includes("HR")) {
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM handwork_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    } 
    
    else if (SvchNo.includes("PL")) {
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM pleating_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("PR")) {
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM printing_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("SI")) {
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM stitching_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("SM")) {
     
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM smoking_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("SR")) {
     
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM stitching_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("WR")) {
     
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM washing_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("RE")) {
     
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM Refinishing_rec_header WHERE vch_no = ?",
        [SvchNo]
      );
      if (erResults.length > 0) {
        esVchVal = erResults[0].estimate_cs_vch_no;
      }
    }

    else if (SvchNo.includes("EC")) {
     
        esVchVal = SvchNo;
      
    }

    else if (SvchNo.includes("SFG")) {
      const [erResults] = await pool.query(
        "SELECT estimate_cs_vch_no FROM sfg_header WHERE vch_no = ?",
        [SvchNo]
      );
    
      if (erResults.length > 0) {
        let rawValue = erResults[0].estimate_cs_vch_no;
        try {
          // Parse the value as JSON to remove the [""] formatting
          let parsedValue = JSON.parse(rawValue);
          if (Array.isArray(parsedValue) && parsedValue.length > 0) {
            esVchVal = parsedValue[0];
          } else {
            console.error("Parsed value is not a valid array or is empty");
          }
        } catch (error) {
          console.error("Error parsing estimate_cs_vch_no:", error);
        }
      }
    }
    
    

    const con = await pool.getConnection();

    const [estimatedCsJwDetailResult] = await con.query(
      "SELECT type, amt FROM Estimated_CS_JW_Detail WHERE vch_no = ? AND jobber_name = ? AND is_other_charge = 0 AND jobwork_name LIKE ?",
      [esVchVal, jobberName, `%${processName}%`]
    );
    


    const jwDetails = estimatedCsJwDetailResult.map((row) => ({
      type: row.type,
      amt: row.amt,
    }));

    con.release();
    
    res.json(jwDetails);
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});

module.exports = router;
