const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
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

router.post("/", async (req, res) => {
  try {
    const { pleatingRecContextUnitData } = req.body;
    let embRecNoText = `PL-R-${pleatingRecContextUnitData.lastEmbRecNo}-23-24`;
    
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM pleating_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM pleating_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM pleating_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM pleating_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM pleating_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM pleating_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO pleating_rec_header (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, design_no, unit_no, narration, is_designNo_recived,estimate_cs_vch_no) VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embRecNoText || "NA",
        pleatingRecContextUnitData.originalDate || "NA",
        pleatingRecContextUnitData.jobberAddress.jobber_id || 'NA',
        pleatingRecContextUnitData.embRecUnitData[0].jobberName || 'NA',
        pleatingRecContextUnitData.embRecUnitData[0].designNo || 'NA',
        pleatingRecContextUnitData.embRecUnitData[0].unitNo || 'NA',
        pleatingRecContextUnitData.embRecUnitData[0].narration || 'NA',
        pleatingRecContextUnitData.embRecUnitData[0].jobWorkStatus || 'NA',
        pleatingRecContextUnitData.esVchNoVal || 'NA'
      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO pleating_rec_source(master_id, alter_id, vch_no, vch_date, item_name, design_no, godown, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?, ?, ?, ?,?,?,?)";
      if (
        pleatingRecContextUnitData.destinationTableData &&
        pleatingRecContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < pleatingRecContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embRecNoText || 'NA',
            pleatingRecContextUnitData.originalDate,
            pleatingRecContextUnitData.destinationTableData[i].itemName || 'NA',
            pleatingRecContextUnitData.embRecUnitData[0].designNo || 'NA',
            pleatingRecContextUnitData.destinationTableData[i].godown || 'NA',
            pleatingRecContextUnitData.destinationTableData[i].size || 'NA',
            pleatingRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
            pleatingRecContextUnitData.destinationTableData[i].qty || 0,
            pleatingRecContextUnitData.destinationTableData[i].rate || 0,
            pleatingRecContextUnitData.destinationTableData[i].rate * pleatingRecContextUnitData.destinationTableData[i].qty || 0,

          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO pleating_rec_destination  (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          pleatingRecContextUnitData.sourceTableData &&
          pleatingRecContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < pleatingRecContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embRecNoText || 'NA',
              pleatingRecContextUnitData.originalDate,
              pleatingRecContextUnitData.sourceTableData[i].itemName || 'NA',
              pleatingRecContextUnitData.embRecUnitData[0].designNo || 'NA',
              pleatingRecContextUnitData.sourceTableData[i].godown || 'NA',
              pleatingRecContextUnitData.sourceTableData[i].type || 'NA',
              pleatingRecContextUnitData.sourceTableData[i].size || 'NA',
              pleatingRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
              pleatingRecContextUnitData.sourceTableData[i].qty || 0,
              pleatingRecContextUnitData.sourceTableData[i].rate + pleatingRecContextUnitData.sourceTableData[i].jwRate || 0,
              (pleatingRecContextUnitData.sourceTableData[i].rate + pleatingRecContextUnitData.sourceTableData[i].jwRate) * pleatingRecContextUnitData.sourceTableData[i].qty || 0,
              pleatingRecContextUnitData.sourceTableData[i].jwRate || 0,
              pleatingRecContextUnitData.sourceTableData[i].jwRate * pleatingRecContextUnitData.sourceTableData[i].qty || 0

  
            ]);
          }
        } else {
          console.error("Data is undefined or has an invalid length");
        }

      // Commit transaction
      await connection.commit();

      // Release connection
      connection.release();

      res.status(200).send("Data stored successfully");
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error storing data:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

module.exports = router;
