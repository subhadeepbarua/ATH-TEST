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
    const { embRecContextUnitData } = req.body;
    let embRecNoText = `ER-${embRecContextUnitData.lastEmbRecNo}-U${embRecContextUnitData.embRecUnitData[0].embRecUnitVal}-23-24`;
    const unitNoVal = `EMBROIDERY REC-0${embRecContextUnitData.embRecUnitData[0].unitNo || 1}`;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM emb_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM emb_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM emb_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM emb_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM emb_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM emb_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO emb_rec_header (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, design_no,design_id, unit_no, narration, is_designNo_recived,estimate_cs_vch_no) VALUES (?,?, ?,?,?, ?, ?, ?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embRecNoText || "NA",
        embRecContextUnitData.originalDate || "NA",
        embRecContextUnitData.jobberAddress.jobber_id || 'NA',
        embRecContextUnitData.embRecUnitData[0].jobberName || 'NA',
        embRecContextUnitData.embRecUnitData[0].designNo || 'NA',
        embRecContextUnitData.designIdVal || 'NA',
        unitNoVal  || 'NA',
        embRecContextUnitData.embRecUnitData[0].narration || 'NA',
        embRecContextUnitData.embRecUnitData[0].jobWorkStatus || 'NA',
        embRecContextUnitData.esVchNoVal || 'NA'
      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO emb_rec_source(master_id, alter_id, vch_no, vch_date, item_name, design_no,design_id, godown, size,lot_no,quantity,rate, amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
      if (
        embRecContextUnitData.destinationTableData &&
        embRecContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < embRecContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embRecNoText || 'NA',
            embRecContextUnitData.originalDate,
            embRecContextUnitData.destinationTableData[i].itemName || 'NA',
            embRecContextUnitData.embRecUnitData[0].designNo || 'NA',
            embRecContextUnitData.designIdVal || 'NA',
            embRecContextUnitData.destinationTableData[i].godown || 'NA',
            embRecContextUnitData.destinationTableData[i].size || 'NA',
            embRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
            embRecContextUnitData.destinationTableData[i].qty || 0,
            embRecContextUnitData.destinationTableData[i].rate || 0,
            embRecContextUnitData.destinationTableData[i].rate * embRecContextUnitData.destinationTableData[i].qty || 0,
           
          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO emb_rec_destination (master_id, alter_id, vch_no, vch_date, item_name, design_no,design_id, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          embRecContextUnitData.sourceTableData &&
          embRecContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < embRecContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embRecNoText || 'NA',
              embRecContextUnitData.originalDate,
              embRecContextUnitData.sourceTableData[i].itemName || 'NA',
              embRecContextUnitData.embRecUnitData[0].designNo || 'NA',
              embRecContextUnitData.designIdVal || 'NA',
              embRecContextUnitData.sourceTableData[i].godown || 'NA',
              embRecContextUnitData.sourceTableData[i].type || 'NA',
              embRecContextUnitData.sourceTableData[i].size || 'NA',
              embRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
              embRecContextUnitData.sourceTableData[i].qty || 0,
              embRecContextUnitData.sourceTableData[i].rate +  embRecContextUnitData.sourceTableData[i].jwRate || 0,
              (embRecContextUnitData.sourceTableData[i].rate +  embRecContextUnitData.sourceTableData[i].jwRate) * embRecContextUnitData.sourceTableData[i].qty || 0,
              embRecContextUnitData.sourceTableData[i].jwRate || 0,
              embRecContextUnitData.sourceTableData[i].jwRate * embRecContextUnitData.sourceTableData[i].qty || 0

  
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
