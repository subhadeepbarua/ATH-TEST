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
    const { washingRecContextUnitData } = req.body;
    let embRecNoText = `WR-${washingRecContextUnitData.lastEmbRecNo}-U${washingRecContextUnitData.embRecUnitData[0].embRecUnitVal}-23-24`;
    
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM washing_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM washing_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM washing_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM washing_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM washing_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM washing_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO washing_rec_header (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, design_no, unit_no, narration, is_designNo_recived,estimate_cs_vch_no) VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embRecNoText || "NA",
        washingRecContextUnitData.originalDate || "NA",
        washingRecContextUnitData.jobberAddress.jobber_id || 'NA',
        washingRecContextUnitData.embRecUnitData[0].jobberName || 'NA',
        washingRecContextUnitData.embRecUnitData[0].designNo || 'NA',
        washingRecContextUnitData.embRecUnitData[0].unitNo || 'NA',
        washingRecContextUnitData.embRecUnitData[0].narration || 'NA',
        washingRecContextUnitData.embRecUnitData[0].jobWorkStatus || 'NA',
        washingRecContextUnitData.esVchNoVal || 'NA'
      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO washing_rec_source(master_id, alter_id, vch_no, vch_date, item_name, design_no, godown, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?, ?, ?, ?,?,?,?)";
      if (
        washingRecContextUnitData.destinationTableData &&
        washingRecContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < washingRecContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embRecNoText || 'NA',
            washingRecContextUnitData.originalDate,
            washingRecContextUnitData.destinationTableData[i].itemName || 'NA',
            washingRecContextUnitData.embRecUnitData[0].designNo || 'NA',
            washingRecContextUnitData.destinationTableData[i].godown || 'NA',
            washingRecContextUnitData.destinationTableData[i].size || 'NA',
            washingRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
            washingRecContextUnitData.destinationTableData[i].qty || 0,
            washingRecContextUnitData.destinationTableData[i].rate || 0,
            washingRecContextUnitData.destinationTableData[i].rate * washingRecContextUnitData.destinationTableData[i].qty || 0,

          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO washing_rec_destination  (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          washingRecContextUnitData.sourceTableData &&
          washingRecContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < washingRecContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embRecNoText || 'NA',
              washingRecContextUnitData.originalDate,
              washingRecContextUnitData.sourceTableData[i].itemName || 'NA',
              washingRecContextUnitData.embRecUnitData[0].designNo || 'NA',
              washingRecContextUnitData.sourceTableData[i].godown || 'NA',
              washingRecContextUnitData.sourceTableData[i].type || 'NA',
              washingRecContextUnitData.sourceTableData[i].size || 'NA',
              washingRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
              washingRecContextUnitData.sourceTableData[i].qty || 0,
              washingRecContextUnitData.sourceTableData[i].rate + washingRecContextUnitData.sourceTableData[i].jwRate || 0,
              (washingRecContextUnitData.sourceTableData[i].rate + washingRecContextUnitData.sourceTableData[i].jwRate) * washingRecContextUnitData.sourceTableData[i].qty || 0,
              washingRecContextUnitData.sourceTableData[i].jwRate || 0,
              washingRecContextUnitData.sourceTableData[i].jwRate * washingRecContextUnitData.sourceTableData[i].qty || 0

  
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
