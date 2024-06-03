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
    const { IroningRecContextUnitData } = req.body;

   
    let embRecNoText = `I-R-${IroningRecContextUnitData.lastEmbRecNo}-U${IroningRecContextUnitData.embRecUnitData[0].embRecUnitVal}-23-24`;
    
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM iron_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM iron_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM iron_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM iron_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM iron_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM iron_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO iron_rec_header (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, design_no, unit_no, narration, is_designNo_recived,estimate_cs_vch_no) VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embRecNoText || "NA",
        IroningRecContextUnitData.originalDate || "NA",
        IroningRecContextUnitData.jobberAddress.jobber_id || 'NA',
        IroningRecContextUnitData.embRecUnitData[0].jobberName || 'NA',
        IroningRecContextUnitData.embRecUnitData[0].designNo || 'NA',
        IroningRecContextUnitData.embRecUnitData[0].unitNo || 'NA',
        IroningRecContextUnitData.embRecUnitData[0].narration || 'NA',
        IroningRecContextUnitData.embRecUnitData[0].jobWorkStatus || 'NA',
        IroningRecContextUnitData.esVchNoVal || 'NA'
      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO iron_rec_source(master_id, alter_id, vch_no, vch_date, item_name, design_no, godown, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?, ?, ?, ?,?,?,?)";
      if (
        IroningRecContextUnitData.destinationTableData &&
        IroningRecContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < IroningRecContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embRecNoText || 'NA',
            IroningRecContextUnitData.originalDate,
            IroningRecContextUnitData.destinationTableData[i].itemName || 'NA',
            IroningRecContextUnitData.embRecUnitData[0].designNo || 'NA',
            IroningRecContextUnitData.destinationTableData[i].godown || 'NA',
            IroningRecContextUnitData.destinationTableData[i].size || 'NA',
            IroningRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
            IroningRecContextUnitData.destinationTableData[i].qty || 0,
            IroningRecContextUnitData.destinationTableData[i].rate || 0,
            IroningRecContextUnitData.destinationTableData[i].rate * IroningRecContextUnitData.destinationTableData[i].qty || 0,

          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO iron_rec_destination  (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          IroningRecContextUnitData.sourceTableData &&
          IroningRecContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < IroningRecContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embRecNoText || 'NA',
              IroningRecContextUnitData.originalDate,
              IroningRecContextUnitData.sourceTableData[i].itemName || 'NA',
              IroningRecContextUnitData.embRecUnitData[0].designNo || 'NA',
              IroningRecContextUnitData.sourceTableData[i].godown || 'NA',
              IroningRecContextUnitData.sourceTableData[i].type || 'NA',
              IroningRecContextUnitData.sourceTableData[i].size || 'NA',
              IroningRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
              IroningRecContextUnitData.sourceTableData[i].qty || 0,
              IroningRecContextUnitData.sourceTableData[i].rate + IroningRecContextUnitData.sourceTableData[i].jwRate || 0,
              (IroningRecContextUnitData.sourceTableData[i].rate + IroningRecContextUnitData.sourceTableData[i].jwRate) * IroningRecContextUnitData.sourceTableData[i].qty || 0,
              IroningRecContextUnitData.sourceTableData[i].jwRate || 0,
              IroningRecContextUnitData.sourceTableData[i].jwRate * IroningRecContextUnitData.sourceTableData[i].qty || 0

  
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
