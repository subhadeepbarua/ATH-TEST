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
    const { hwRecContextUnitData } = req.body;
    let embRecNoText = `HR-${hwRecContextUnitData.lastEmbRecNo}-U${hwRecContextUnitData.embRecUnitData[0].embRecUnitVal}-23-24`;
    
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM handwork_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM handwork_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM handwork_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM handwork_rec_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM handwork_rec_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM handwork_rec_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO handwork_rec_header (master_id, alter_id, vch_no, vch_date,estimate_cs_vch_no, jobber_id, jobber_name, design_no, unit_no, narration, is_designNo_recived) VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embRecNoText || "NA",
        hwRecContextUnitData.originalDate || "NA",
        hwRecContextUnitData.esVchNoVal || 'NA',
        hwRecContextUnitData.jobberAddress.jobber_id || 'NA',
        hwRecContextUnitData.embRecUnitData[0].jobberName || 'NA',
        hwRecContextUnitData.embRecUnitData[0].designNo || 'NA',
        hwRecContextUnitData.embRecUnitData[0].unitNo || 'NA',
        hwRecContextUnitData.embRecUnitData[0].narration || 'NA',
        hwRecContextUnitData.embRecUnitData[0].jobWorkStatus || 'NA',
       
      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO handwork_rec_source(master_id, alter_id, vch_no, vch_date, item_name, design_no, godown,type, size,lot_no,quantity,rate, amt, jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      if (
        hwRecContextUnitData.destinationTableData &&
        hwRecContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < hwRecContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embRecNoText || 'NA',
            hwRecContextUnitData.originalDate,
            hwRecContextUnitData.destinationTableData[i].itemName || 'NA',
            hwRecContextUnitData.embRecUnitData[0].designNo || 'NA',
            hwRecContextUnitData.destinationTableData[i].godown || 'NA',
            hwRecContextUnitData.sourceTableData[i].type || 'NA',
            hwRecContextUnitData.destinationTableData[i].size || 'NA',
            hwRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
            hwRecContextUnitData.destinationTableData[i].qty || 0,
            (hwRecContextUnitData.destinationTableData[i].rate + hwRecContextUnitData.sourceTableData[i].jwRate )|| 0,
            (hwRecContextUnitData.sourceTableData[i].rate + hwRecContextUnitData.sourceTableData[i].jwRate) * hwRecContextUnitData.sourceTableData[i].qty || 0,
            // hwRecContextUnitData.sourceTableData[i].rate + hwRecContextUnitData.sourceTableData[i].jwRate || 0,
            hwRecContextUnitData.sourceTableData[i].jwRate || 0,
            // hwRecContextUnitData.destinationTableData[i].rate * hwRecContextUnitData.destinationTableData[i].qty || 0,
            hwRecContextUnitData.sourceTableData[i].jwRate * hwRecContextUnitData.sourceTableData[i].qty || 0
          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO handwork_rec_destination  (master_id, alter_id, vch_no, vch_date, item_name,godown, design_no, size,lot_no,quantity,rate, amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          hwRecContextUnitData.sourceTableData &&
          hwRecContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < hwRecContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embRecNoText || 'NA',
              hwRecContextUnitData.originalDate,
              hwRecContextUnitData.sourceTableData[i].itemName || 'NA',
              hwRecContextUnitData.sourceTableData[i].godown || 'NA',
              hwRecContextUnitData.embRecUnitData[0].designNo || 'NA',
              hwRecContextUnitData.sourceTableData[i].size || 'NA',
              hwRecContextUnitData.embRecUnitData[0].lotNo || 'NA',
              hwRecContextUnitData.sourceTableData[i].qty || 0,
              hwRecContextUnitData.destinationTableData[i].rate || 0,
              (hwRecContextUnitData.sourceTableData[i].rate + hwRecContextUnitData.sourceTableData[i].jwRate) * hwRecContextUnitData.sourceTableData[i].qty || 0,
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
