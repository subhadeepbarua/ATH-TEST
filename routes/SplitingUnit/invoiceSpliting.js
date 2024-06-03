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
    const { splitingCompData } = req.body;
    const {designIdData} = req.body;
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const listLength = splitingCompData.destinationTableData.length;

// Create an array with the same length as splitingCompData.destinationTableData.length
const calValues = new Array(listLength);
const splitUnit = `SPLIT-${splitingCompData.splitUnitNo}`;

// Calculate and assign values to calValues array
for (let i = 0; i < listLength; i++) {
  const item = splitingCompData.destinationTableData[i];
  let calculatedValue = (
    Number(item.rate) +
    (Number(splitingCompData.cuttingFreightVal?.cutting_charges ?? 0) *
      Number(splitingCompData.actualQty)) /
      listLength
  ).toFixed(2);

  // Adjust calculated value based on type
  if (item.type.toLowerCase() === "top") {
    calculatedValue = (
      (Number(calculatedValue) + (Number(splitingCompData.headerData[0]?.freight_one_val || 0) * Number(splitingCompData.actualQty))) /
      Number(splitingCompData.actualQty)
    ).toFixed(2);
  } else if (item.type.toLowerCase() === "pant") {
    calculatedValue = (
      (Number(calculatedValue) + (Number(splitingCompData.headerData[0]?.freight_two_val || 0) * Number(splitingCompData.actualQty))) /
      Number(splitingCompData.actualQty)
    ).toFixed(2);
  } else {
    calculatedValue = (Number(calculatedValue) / Number(splitingCompData.actualQty)).toFixed(2);
  }

  calValues[i] = calculatedValue;
}





    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery =
        "SELECT master_id FROM spliting_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(
        getLastMasterIdheaderQuery
      );
      const lastMasterIdheader = lastMasterIdheaderResult[0]?.master_id || 0;

      const getLastMasterIdcreateQuery =
        "SELECT master_id FROM spliting_create_item ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdcreateResult] = await connection.query(
        getLastMasterIdcreateQuery
      );
      const lastMasterIdcreate = lastMasterIdcreateResult[0]?.master_id || 0;

      const getLastMasterIddestinationQuery =
        "SELECT master_id FROM spliting_destination ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIddestinationResult] = await connection.query(
        getLastMasterIddestinationQuery
      );
      const lastMasterIddestination =
        lastMasterIddestinationResult[0]?.master_id || 0;

      const getLastMasterIdsourceQuery =
        "SELECT master_id FROM spliting_source ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdsourceResult] = await connection.query(
        getLastMasterIdsourceQuery
      );
      const lastMasterIdsource = lastMasterIdsourceResult[0]?.master_id || 0;

      const getLastalterIdheaderQuery =
        "SELECT alter_id FROM spliting_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(
        getLastalterIdheaderQuery
      );
      const lastalterIdheader = lastalterIdheaderResult[0]?.alter_id || 0;

      const getLastalterIdcreateQuery =
        "SELECT alter_id FROM spliting_create_item ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdcreateResult] = await connection.query(
        getLastalterIdcreateQuery
      );
      const lastalterIdcreate = lastalterIdcreateResult[0]?.alter_id || 0;

      const getLastalterIdDestinationQuery =
        "SELECT alter_id FROM spliting_destination ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdDestinationResult] = await connection.query(
        getLastalterIdDestinationQuery
      );
      const lastalterIdDestination =
        lastalterIdDestinationResult[0]?.alter_id || 0;

      const getLastalterIdSourceQuery =
        "SELECT alter_id FROM spliting_source ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdSourceResult] = await connection.query(
        getLastalterIdSourceQuery
      );
      const lastalterIdSource = lastalterIdSourceResult[0]?.alter_id || 0;

      // Insert header data
      const insertHeaderQuery =
        "INSERT INTO spliting_header (master_id, alter_id, vch_no, vch_date, estimated_cs_vch_no, cutting_vch_no, design_no,design_id ,lot_no, size, unit_no, narration) VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?)";
     
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader + 1 || 0,
        splitingCompData.splitNoText || "NA",
        splitingCompData.originalDate || "NA",
        splitingCompData.destinationData[0].estimate_cs_vch_no || "NA",
        splitingCompData.destinationData[0].vch_no || "NA",
        splitingCompData.splitingValues[0].designNo || "NA",
        designIdData || "NA",
        splitingCompData.destinationData[0].lot_no || "NA",
        splitingCompData.splitingValues[0].actualSize || "NA",
        splitUnit || "NA",
        splitingCompData.narration || "NA",
      ]);

      // Insert create item data
      const insertCreateItemQuery =
        "INSERT INTO spliting_create_item (master_id, alter_id, vch_no, vch_date, item_name, alias, under_grp, unit ,size) VALUES (?,?, ?,?, ?, ?, ?, ?, ?)";
      if (
        splitingCompData.destinationTableData &&
        splitingCompData.destinationTableData.length
      ) {
        for (let i = 0; i < splitingCompData.destinationTableData.length; i++) {
          await connection.query(insertCreateItemQuery, [
            lastMasterIdcreate + 1 + i || 0,
            lastalterIdcreate + 1 + i || 0,
            splitingCompData.splitNoText,
            splitingCompData.originalDate,
            splitingCompData.destinationTableData[i].itemName || "NA",
            splitingCompData.destinationTableData[i].alise || "NA",
            splitingCompData.destinationTableData[i].under || "NA",
            splitingCompData.destinationTableData[i].units || "MTR",
            splitingCompData.destinationTableData[i].size || "NA",
          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert destination data
      const insertDestinationQuery =
        "INSERT INTO spliting_destination (master_id, alter_id, vch_no, vch_date, item_name, godown, design_no,type, size,lot_no,quantity,rate, amt) VALUES (?,?, ?,?, ?, ?, ?, ?, ?,?,?,?,?)";
      if (
        splitingCompData.destinationTableData &&
        splitingCompData.destinationTableData.length
      ) {
        for (let i = 0; i < splitingCompData.destinationTableData.length; i++) {
          await connection.query(insertDestinationQuery, [
            lastMasterIddestination + 1 + i || 0,
            lastalterIdDestination + 1 + i || 0,
            splitingCompData.splitNoText,
            splitingCompData.originalDate,
            splitingCompData.destinationTableData[i].itemName || "NA",
            splitingCompData.destinationTableData[i].godown || "NA",
            splitingCompData.splitingValues[0].designNo || "NA",
            splitingCompData.destinationTableData[i].type || "NA",
            splitingCompData.splitingValues[0].actualSize || "NA",
            splitingCompData.destinationData[0].lot_no || "NA",
            splitingCompData.actualQty || 0,

            calValues[i] || 0,

            
            calValues[i]*splitingCompData.actualQty || 0,
          ]);
        }
      } else {
        console.error("Data is undefined or has an invalid length");
      }

      // Insert source data
      const insertSourceQuery =
        "INSERT INTO spliting_source  (master_id, alter_id, vch_no, vch_date,amt, item_name, godown, design_no,size,lot_no,quantity,rate ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
      await connection.query(insertSourceQuery, [
        lastMasterIdsource + 1 || 0,
        lastalterIdSource + 1 || 0,
        splitingCompData.splitNoText,
        splitingCompData.originalDate,
        splitingCompData.totalRate * splitingCompData.actualQty || 0,
        splitingCompData.splitingValues[0].designNo || "NA",
        splitingCompData.destinationData[0].godown || "NA",
        splitingCompData.splitingValues[0].designNo || "NA",
        splitingCompData.splitingValues[0].actualSize || "NA",
        splitingCompData.destinationData[0].lot_no || "NA",
        splitingCompData.actualQty || 0,
        splitingCompData.totalRate || "NA",
      ]);

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
