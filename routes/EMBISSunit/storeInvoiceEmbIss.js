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
    const { embIssUnitData } = req.body;
    let embIssNoText = `EI-${embIssUnitData.lastEmbNo}-U${embIssUnitData.embUnitData[0].embUnitVal}-23-24`;
// Filter values starting with 'EC'
const filteredValues = embIssUnitData.esVchNoVal.filter(value => value.startsWith('EC'));
const unitNoVal = `EMBROIDERY ISS-0${embIssUnitData.embUnitData[0].unitNo || 1}`;
// Convert the filtered values to a string
const filteredString = filteredValues.join(',');
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM emb_iss_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM emb_iss_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM emb_iss_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;


      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM emb_iss_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;


      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM emb_iss_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM emb_iss_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO emb_iss_header (master_id, alter_id, vch_no, estimate_cs_vch_no, vch_date, jobber_id, jobber_name, design_no,design_id, lot_no, size, unit_no, narration) VALUES (?,?, ?,?,?, ?, ?, ?,?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        embIssNoText || "NA",
        filteredString || 'NA',
        embIssUnitData.originalDate || "NA",
        embIssUnitData.jobberAddress.jobber_id || 'NA',
        embIssUnitData.jobberName || 'NA',
        embIssUnitData.embUnitData[0].designNo || 'NA',
        embIssUnitData.designIdVal || 'NA',
        embIssUnitData.embUnitData[0].lotNo || 'NA',
        embIssUnitData.embUnitData[0].size || 'NA',
        unitNoVal || 'NA',
        embIssUnitData.embUnitData[0].narration || 'NA',

      ]);

      
      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO emb_iss_destination (master_id, alter_id, vch_no, vch_date, item_name, design_no,design_id, godown, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?,?, ?, ?, ?,?,?,?)";
      if (
        embIssUnitData.destinationTableData &&
        embIssUnitData.destinationTableData.length
      ) {
        for (let i = 0; i < embIssUnitData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            embIssNoText || 'NA',
            embIssUnitData.originalDate,
            embIssUnitData.destinationTableData[i].itemName || 'NA',
            JSON.stringify(embIssUnitData.designNoVal) || 'NA',
            JSON.stringify(embIssUnitData.designIdVal) || 'NA',
            embIssUnitData.destinationTableData[i].godown || 'NA',
            embIssUnitData.embUnitData[0].size || 'NA',
            embIssUnitData.embUnitData[0].lotNo || 'NA',
            embIssUnitData.destinationTableData[i].qty || 0,
            embIssUnitData.destinationTableData[i].rate || 0,
            embIssUnitData.destinationTableData[i].rate * embIssUnitData.destinationTableData[i].qty || 0,

          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO emb_iss_source  (master_id, alter_id, vch_no, vch_date, item_name, design_no,design_id, godown,type, size,lot_no,quantity,rate, amt,jw_rate, jw_amt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        if (
          embIssUnitData.sourceTableData &&
          embIssUnitData.sourceTableData.length
        ) {
          for (let i = 0; i < embIssUnitData.sourceTableData.length; i++) {
            await connection.query(insertSourceQuery, [
              lastMasterIdsource + 1 + i || 0,
              lastalterIdSource + 1 + i || 0,
              embIssNoText || 'NA',
              embIssUnitData.originalDate,
              embIssUnitData.sourceTableData[i].itemName || 'NA',
              embIssUnitData.embUnitData[0].designNo || 'NA',
              JSON.stringify(embIssUnitData.designIdVal) || 'NA',
              embIssUnitData.sourceTableData[i].godown || 'NA',
              embIssUnitData.sourceTableData[i].type || 'NA',
              embIssUnitData.embUnitData[0].size || 'NA',
              embIssUnitData.embUnitData[0].lotNo || 'NA',
              embIssUnitData.sourceTableData[i].qty || 0,
              embIssUnitData.sourceTableData[i].rate || 0,
              embIssUnitData.sourceTableData[i].rate * embIssUnitData.sourceTableData[i].qty || 0,
              embIssUnitData.sourceTableData[i].jwRate || 0,
              embIssUnitData.sourceTableData[i].qty * embIssUnitData.sourceTableData[i].jwRate || 0

  
            ]);
          }
        } else {
          console.error("Data is undefined or has an invalid length");
        }

  const updateSplitngHeaderQuery =
  "UPDATE spliting_header SET last_operation = 'EMB' WHERE estimated_cs_vch_no = ?";

if (filteredValues && filteredValues.length) {
  for (let i = 0; i < filteredValues.length; i++) {
    await connection.query(updateSplitngHeaderQuery, [
      filteredValues[i],
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
  -    connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error storing data:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

module.exports = router;
