const express = require('express');
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
    const { selectedDate, selectedUnit, selecteditem_id } = req.body.accountingVoucherData;
    const { selectedValue, itemCode, itemSize, quantity, masterId } = req.body.productPanelData;
    const { overHeadCost, totalCostPerUnit, freightCost, freightCostTwo, otherCost , otherCostTypeValue,freightTypeValue,freightTypeValueTwo } = req.body.billingData;
    const { rowsData, accessoriesData, packingMaterialData,totalAmount } = req.body.materialData;
    const { rowsDataJob } = req.body.billingData;
    const naration = req.body.narationData;

    var f1=0, f2=0, oc = 0;
    var is_other_charge = 0;
    let rowGap = rowsDataJob.some(data => !data.jobberName || !data.jobWork) ? 0 : rowsDataJob.length;
   
   
    if (freightCost > 0 || freightCostTwo > 0 || otherCost > 0) {
      is_other_charge = 1;
    }

    switch(true) {
      case (freightCost > 0) :
        f1 = 1;
        if(freightCostTwo > 0) {
          f2 = 2;
          if(otherCost > 0) oc = 3;
        }
        break;
      case freightCostTwo > 0 && !freightCost > 0:
        f2 = 1;
        if(otherCost>0) oc = 2;
        break;
      case otherCost > 0 && !freightCost > 0:
        if(freightCostTwo > 0) oc = 2;
        else oc = 1;
        break;
    }

    
    // Function to transform and add the group information
    const transformAndAddGroup = (data, group) => {
      return data.map((item) => ({
        material: item.rawMaterials || item.accessories || item.packingMaterial,
        group,
        itemId: item.itemId,
        type: item.type,
        unit: item.unit,
        color: item.color,
        width: item.width,
        tolorance: item.tolorance,
        rate: item.rate,
        qty: item.qty,
        amt: item.amount,
      }));
    };

    // Filter arrays where the respective key is not empty
    const filteredRowsData = rowsData.filter((item) => item.rawMaterials);
    const filteredAccessoriesData = accessoriesData.filter((item) => item.accessories);
    const filteredPackingMaterialData = packingMaterialData.filter((item) => item.packingMaterial);

    // Transform and add group information for each array
    const transformedRowsData = transformAndAddGroup(filteredRowsData, "Raw Material");
    const transformedAccessoriesData = transformAndAddGroup(filteredAccessoriesData, "Accessories");
    const transformedPackingMaterialData = transformAndAddGroup(filteredPackingMaterialData, "Packaging Material");

    // Combine all transformed arrays into one
    const combinedData = [
      ...transformedRowsData,
      ...transformedAccessoriesData,
      ...transformedPackingMaterialData,
    ];

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Fetch the last master_id value
      const getLastMasterIdheaderQuery = "SELECT master_id FROM Estimated_CS_header ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdheaderResult] = await connection.query(getLastMasterIdheaderQuery);
      const lastMasterIdheader = (lastMasterIdheaderResult[0]?.master_id || 0);
      
      const getLastMasterIdJwQuery = "SELECT master_id FROM Estimated_CS_JW_Detail ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdJwResult] = await connection.query(getLastMasterIdJwQuery);
      const lastMasterIdJw = (lastMasterIdJwResult[0]?.master_id || 0);
      
      const getLastMasterIdItemQuery = "SELECT master_id FROM Estimated_CS_Item_Detail ORDER BY master_id DESC LIMIT 1";
      const [lastMasterIdItemResult] = await connection.query(getLastMasterIdItemQuery);
      const lastMasterIdItem = (lastMasterIdItemResult[0]?.master_id || 0);
      
      const getLastalterIdheaderQuery = "SELECT alter_id FROM Estimated_CS_header ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdheaderResult] = await connection.query(getLastalterIdheaderQuery);
      const lastalterIdheader = (lastalterIdheaderResult[0]?.alter_id || 0);
      
      const getLastalterIdJwQuery = "SELECT alter_id FROM Estimated_CS_JW_Detail ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdJwResult] = await connection.query(getLastalterIdJwQuery);
      const lastalterIdJw = (lastalterIdJwResult[0]?.alter_id || 0);
      
      const getLastalterIdItemQuery = "SELECT alter_id FROM Estimated_CS_Item_Detail ORDER BY master_id DESC LIMIT 1";
      const [lastalterIdItemResult] = await connection.query(getLastalterIdItemQuery);
      const lastalterIdItem = (lastalterIdItemResult[0]?.alter_id || 0);

      const getLastVchNoQuery = "SELECT vch_no FROM Estimated_CS_header ORDER BY master_id DESC LIMIT 1";
      const [lastVchNoResult] = await connection.query(getLastVchNoQuery);
      let lastVchNo = lastVchNoResult[0]?.vch_no || "EC-23-24-0000";

      
  
      // Extract the numeric part after 'EC-23-24-'
      const lastVchNoNumericPart = parseInt(lastVchNo.split('EC-23-24-')[1]);
  
      // Increment the numeric part and format it back
      const newLastDigits = (lastVchNoNumericPart + 1).toString().padStart(4, '0');
      const tem_vch = `EC-23-24-${newLastDigits}`;
      // Insert header data
      const insertHeaderQuery = "INSERT INTO Estimated_CS_header (master_id, alter_id, vch_no, vch_date,unit_no, design_no,design_id, code, size, total_quantity, overhead_cost, total_cost_unit, Narration, last_Operation) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader+1,
        tem_vch,
        selectedDate || "N/A",
        selecteditem_id || "N/A",
        selectedValue || "N/A",
        masterId,
        itemCode || "N/A",
        itemSize || "N/A",
        quantity || 0,
        overHeadCost || 0,
        totalCostPerUnit || 0,
        naration || "N/A",
        0,
      ]);

      // Insert detail data
      const insertDetailQuery = "INSERT INTO Estimated_CS_Item_Detail (master_id, alter_id, vch_no, vch_date,item_id, raw_material,item_unit, group_type, type, color, width, tolorance, rate, qty, amt,grand_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      for (let i = 0; i < combinedData.length; i++) {
        await connection.query(insertDetailQuery, [
          lastMasterIdItem + i + 1 || 0,
          lastalterIdItem + i + 1,
          tem_vch,
          selectedDate || "N/A",
          combinedData[i].itemId,
          combinedData[i].material || "N/A",
          combinedData[i].unit || 'N/A',
          combinedData[i].group || "N/A",
          combinedData[i].type || "N/A",
          combinedData[i].color || "N/A",
          combinedData[i].width || "N/A",
          combinedData[i].tolorance || "N/A",
          combinedData[i].rate || 0,
          combinedData[i].qty || 0,
          combinedData[i].amt || 0,
          totalAmount || 'N/A'
        ]);
      }

      // Insert job work data
      const insertJobWorkQuery = "INSERT INTO Estimated_CS_JW_Detail (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, jobwork_name, jobwork_name_id, type, amt, is_other_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      for (let i = 0; i < rowsDataJob.length; i++) {
        // Check if jobberName and jobWork are not empty
          await connection.query(insertJobWorkQuery, [
            lastMasterIdJw + i + 1 || 0,
            lastalterIdJw + i + 1,
            tem_vch,
            selectedDate || "N/A",
            rowsDataJob[i].jobberNameId || 'N/A',
            rowsDataJob[i].jobberName || "N/A",
            rowsDataJob[i].jobWork || "N/A",
            rowsDataJob[i].jobworkNameId,
            rowsDataJob[i].jobType || "N/A",
            rowsDataJob[i].amount || 0,
            0,
          ]);
        
      }
      

      if(freightCost > 0){
        const insertJobWorkQuery = "INSERT INTO Estimated_CS_JW_Detail (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, jobwork_name, jobwork_name_id, type, amt, is_other_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
     
        await connection.query(insertJobWorkQuery, [
          lastMasterIdJw + rowGap + f1 || 0,
          lastalterIdJw + rowGap + f1 || 0,
          tem_vch,
          selectedDate || "N/A",
          'N/A',
          "N/A",
          "freight Cost",
          "N/A",
          freightTypeValue || "N/A",
          freightCost || 0,
          1,
        ]);
      
      }

      if(freightCostTwo > 0){
        const insertJobWorkQuery = "INSERT INTO Estimated_CS_JW_Detail (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, jobwork_name, jobwork_name_id, type, amt, is_other_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      
        await connection.query(insertJobWorkQuery, [
          lastMasterIdJw + rowGap + f2  || 0,
          lastalterIdJw + rowGap + f2 || 0,
          tem_vch,
          selectedDate || "N/A",
          'N/A',
          "N/A",
          "freight Cost Two",
          'N/A',
          freightTypeValueTwo || "N/A",
          freightCostTwo || 0,
          1,
        ]);
      
      }

      if(otherCost > 0){
        const insertJobWorkQuery = "INSERT INTO Estimated_CS_JW_Detail (master_id, alter_id, vch_no, vch_date, jobber_id, jobber_name, jobwork_name, jobwork_name_id, type, amt, is_other_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
       
        await connection.query(insertJobWorkQuery, [
          lastMasterIdJw + rowGap + oc || 0,
          lastalterIdJw + rowGap + oc || 0,
          tem_vch,
          selectedDate || "N/A",
          'N/A',
          "N/A",
          "Other Cost",
          'N/A',
          otherCostTypeValue || "N/A",
          otherCost || 0,
          1,
        ]);
      
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
