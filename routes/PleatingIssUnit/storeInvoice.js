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
    const { pleatingIssContextUnitData } = req.body;
    let embIssNoText = `PL-I-${pleatingIssContextUnitData.lastEmbNo}-U${pleatingIssContextUnitData.embUnitData[0].embUnitVal}-23-24`;
// Filter values starting with 
const filteredValues = pleatingIssContextUnitData.esVchNoVal.filter(value => value.startsWith('EC'));

// Convert the filtered values to a string
const filteredString = filteredValues.join(',');
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM pleating_iss_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM pleating_iss_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM pleating_iss_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM pleating_iss_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM pleating_iss_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM pleating_iss_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO pleating_iss_header (master_id, alter_id, vch_no, estimate_cs_vch_no, vch_date, jobber_id, jobber_name, design_no, lot_no, size, unit_no, narration) VALUES (?,?, ?,?, ?, ?, ?,?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embIssNoText || "NA",
        filteredString || 'NA',
        pleatingIssContextUnitData.originalDate || "NA",
        pleatingIssContextUnitData.jobberAddress.jobber_id || 'NA',
        pleatingIssContextUnitData.jobberName || 'NA',
        pleatingIssContextUnitData.embUnitData[0].designNo || 'NA',
        pleatingIssContextUnitData.embUnitData[0].lotNo || 'NA',
        pleatingIssContextUnitData.embUnitData[0].size || 'NA',
        pleatingIssContextUnitData.embUnitData[0].unitNo || 'NA',
        pleatingIssContextUnitData.embUnitData[0].narration || 'NA',

      ]);

      
      // Insert destination data
      const insertDestinationQuery =
      "INSERT INTO pleating_iss_destination (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?, ?, ?, ?,?,?,?)";
      if (
        pleatingIssContextUnitData.destinationTableData &&
        pleatingIssContextUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < pleatingIssContextUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embIssNoText || 'NA',
            pleatingIssContextUnitData.originalDate,
            pleatingIssContextUnitData.destinationTableData[i].itemName || 'NA',
            pleatingIssContextUnitData.embUnitData[0].designNo || 'NA',
            pleatingIssContextUnitData.destinationTableData[i].godown || 'NA',
            pleatingIssContextUnitData.embUnitData[0].size || 'NA',
            pleatingIssContextUnitData.embUnitData[0].lotNo || 'NA',
            pleatingIssContextUnitData.destinationTableData[i].qty || 0,
            pleatingIssContextUnitData.destinationTableData[i].rate || 0,
            pleatingIssContextUnitData.destinationTableData[i].rate * pleatingIssContextUnitData.destinationTableData[i].qty || 0,

          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO pleating_iss_source  (master_id, alter_id, vch_no, vch_date, item_name, design_no, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          pleatingIssContextUnitData.sourceTableData &&
          pleatingIssContextUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < pleatingIssContextUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embIssNoText || 'NA',
              pleatingIssContextUnitData.originalDate,
              pleatingIssContextUnitData.sourceTableData[i].itemName || 'NA',
              pleatingIssContextUnitData.embUnitData[0].designNo || 'NA',
              pleatingIssContextUnitData.sourceTableData[i].godown || 'NA',
              pleatingIssContextUnitData.sourceTableData[i].type || 'NA',
              pleatingIssContextUnitData.embUnitData[0].size || 'NA',
              pleatingIssContextUnitData.embUnitData[0].lotNo || 'NA',
              pleatingIssContextUnitData.sourceTableData[i].qty || 0,
              pleatingIssContextUnitData.sourceTableData[i].rate || 0,
              (pleatingIssContextUnitData.sourceTableData[i].rate ) * pleatingIssContextUnitData.sourceTableData[i].qty || 0,
              pleatingIssContextUnitData.sourceTableData[i].jwRate || 0,
              pleatingIssContextUnitData.sourceTableData[i].qty * pleatingIssContextUnitData.sourceTableData[i].jwRate || 0
            ]);
          }
        } else {
          console.error("Data is undefined or has an invalid length");
        }

        const updateSplitngHeaderQuery =
  "UPDATE spliting_header SET last_operation = 'PLE' WHERE estimated_cs_vch_no = ?";

  
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
