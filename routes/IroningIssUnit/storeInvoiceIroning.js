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
    const { ironingIssContextUnitData } = req.body;
    let embIssNoText = `I-I-${ironingIssContextUnitData.lastEmbNo}-U${ironingIssContextUnitData.embUnitData[0].embUnitVal}-23-24`;
// Filter values starting with 'EC'
const filteredValues = ironingIssContextUnitData.esVchNoVal.filter(value => value.startsWith('EC'));

// Convert the filtered values to a string
const filteredString = filteredValues.join(',');
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM iron_iss_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM iron_iss_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM iron_iss_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM iron_iss_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM iron_iss_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM iron_iss_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO iron_iss_header (master_id, alter_id, vch_no, estimate_cs_vch_no, vch_date, jobber_id, jobber_name, design_no, lot_no, size, unit_no, narration) VALUES (?,?, ?,?, ?, ?, ?,?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embIssNoText || "NA",
        filteredString || 'NA',
        ironingIssContextUnitData.originalDate || "NA",
        ironingIssContextUnitData.jobberAddress.jobber_id || 'NA',
        ironingIssContextUnitData.jobberName || 'NA',
        JSON.stringify(ironingIssContextUnitData.designNoVal) || 'NA',
        ironingIssContextUnitData.embUnitData[0].lotNo || 'NA',
        ironingIssContextUnitData.embUnitData[0].size || 'NA',
        ironingIssContextUnitData.embUnitData[0].unitNo || 'NA',
        ironingIssContextUnitData.embUnitData[0].narration || 'NA',

      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO iron_iss_destination (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?, ?, ?, ?,?,?,?)";
      if (
        ironingIssContextUnitData.destinationTableData &&
        ironingIssContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < ironingIssContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embIssNoText || 'NA',
            ironingIssContextUnitData.originalDate,
            ironingIssContextUnitData.destinationTableData[i].itemName || 'NA',
            ironingIssContextUnitData.destinationTableData[i].godown || 'NA',
            ironingIssContextUnitData.embUnitData[0].designNo || 'NA',
         
            ironingIssContextUnitData.embUnitData[0].size || 'NA',
            ironingIssContextUnitData.embUnitData[0].lotNo || 'NA',
            ironingIssContextUnitData.destinationTableData[i].qty || 0,
            ironingIssContextUnitData.destinationTableData[i].rate || 0,
            ironingIssContextUnitData.destinationTableData[i].rate * ironingIssContextUnitData.destinationTableData[i].qty || 0,

          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO iron_iss_source (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          ironingIssContextUnitData.sourceTableData &&
          ironingIssContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < ironingIssContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embIssNoText || 'NA',
              ironingIssContextUnitData.originalDate,
              ironingIssContextUnitData.sourceTableData[i].itemName || 'NA',
              ironingIssContextUnitData.sourceTableData[i].itemName || 'NA',
              ironingIssContextUnitData.sourceTableData[i].godown || 'NA',
              ironingIssContextUnitData.sourceTableData[i].type || 'NA',
              ironingIssContextUnitData.embUnitData[0].size || 'NA',
              ironingIssContextUnitData.embUnitData[0].lotNo || 'NA',
              ironingIssContextUnitData.sourceTableData[i].qty || 0,
              ironingIssContextUnitData.sourceTableData[i].rate || 0,
              ironingIssContextUnitData.sourceTableData[i].rate  * ironingIssContextUnitData.sourceTableData[i].qty || 0,
              ironingIssContextUnitData.sourceTableData[i].jwRate || 0,
              ironingIssContextUnitData.sourceTableData[i].qty * ironingIssContextUnitData.sourceTableData[i].jwRate || 0

  
            ]);
          }
        } else {
          console.error("Data is undefined or has an invalid length");
        }

        const updateSplitngHeaderQuery =
  "UPDATE spliting_header SET last_operation = 'IRON' WHERE estimated_cs_vch_no = ?";

  
if (filteredValues && filteredValues.length) {
  for (let i = 0; i < filteredValues.length; i++) {
    await connection.query(updateSplitngHeaderQuery, [
      filteredValues[i],
    ]);
  }
} else {
  console.error("Data is undefined or has an invalid length 3");
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
