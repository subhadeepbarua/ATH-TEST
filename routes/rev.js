const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2/promise"); // Import mysql2/promise to use async/await
const app = express();
const PORT = 6001;

app.use(bodyParser.json());
app.use(cors());

// Create a pool for MySQL connections
const pool = mysql.createPool({
  host: "193.203.184.53",
  user: "u114727550_artherv",
  password: "Artherv@321",
  database: "u114727550_artherv_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// POST route to handle incoming data from the React component
// POST route to handle incoming data from the React component
app.post("/receive-data", async (req, res) => {
  try {
   // const {selectedUnit, selectedDate, }
    const {selectedDate, selectedUnit, costSheetNo} = req.body.accountingVoucherData
    const { selectedValue, itemCode, itemSize, quantity } = req.body.productPanelData;
    const { overHeadCost, totalCostPerUnit } = req.body.billingData;
    const { rowsData, accessoriesData, packingMaterialData } = req.body.materialData;
    const {rowsDataJob} = req.body.billingData

   
    // Function to transform and add the group information
    const transformAndAddGroup = (data, group) => {
      return data.map(item => ({
        material: item.rawMaterials || item.accessories || item.packingMaterial,
        group,
        type: item.type,
        color: item.color,
        width: item.width,
        tolorance: item.tolorance,
        rate: item.rate,
        qty: item.qty,
        amt: item.amount
      }));
    };

    // Transform and add group information for each array
    const transformedRowsData = transformAndAddGroup(rowsData, 'Raw Material');
    const transformedAccessoriesData = transformAndAddGroup(accessoriesData, 'Accessories');
    const transformedPackingMaterialData = transformAndAddGroup(packingMaterialData, 'Packaging Material');

    // Combine all transformed arrays into one
    const combinedData = [...transformedRowsData, ...transformedAccessoriesData, ...transformedPackingMaterialData]
    
    
    const master_id = Math.floor(10000 + Math.random() * 90000);
    // Validate required data (optional but recommended)
    if (!selectedValue || !itemCode || !itemSize || !quantity) {
      return res.status(400).send({ error: "Missing required data" });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
     
      const insertHeaderQuery = "INSERT INTO Estimated_CS_header (master_id, vch_no, vch_date, design_no, code, size, total_quantity, overhead_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      await connection.query(insertHeaderQuery, [master_id, costSheetNo, selectedDate, selectedValue, itemCode, itemSize, quantity, overHeadCost]);

   
      const insertDetailQuery = "INSERT INTO Estimated_CS_Item_Detail (master_id, vch_no, vch_date,raw_material, group_type, type, color, width, tolorance, rate, qty, amt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      for (const data of combinedData) {
        await connection.query(insertDetailQuery, [master_id, costSheetNo, selectedDate, data.material, data.group, data.type, data.color, data.width, data.tolorance, data.rate, data.qty, data.amt]);
      }

      const insertJobWorkQuery = "INSERT INTO Estimated_CS_JW_Detail (master_id, vch_no, vch_date,jobber_name, jobwork_name, type, amt) VALUES (?, ?, ?, ?, ?, ?, ?)";
      for (const data of rowsDataJob) {
        await connection.query(insertJobWorkQuery, [master_id, costSheetNo, selectedDate,data.jobWork, data.jobberName, data.jobType, data.amount]);
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

  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
