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
    const {designNoData} = req.body;
   const {originalDate,cuttingUnitNo} = req.body.cuttingUnitData;
   const {jobberName,jobberId,godown,unitNo,cuttingCharge, designNo,estimatedQty, actualQty, lotNo, estimated_vch_no, size, otherCost,otherCostType, freightCostType, freightCost,freightCostTwoType, freightCostTwo} = req.body.manufactureCalData;
   const { consumptionUnitData } = req.body;
   const {jobWork, naration} = req.body.narationData

   const {allocationToPri, cuttingCharges, effectiveCost, effectiveRate, freightCharges, totalAdlCost,componentCost} = req.body.billingUnitData;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {

            //Fetch the last master_id value
            const getLastMasterIdheaderQuery = "SELECT master_id FROM cutting_header ORDER BY master_id DESC LIMIT 1";
            const [lastMasterIdheaderResult] = await connection.query(getLastMasterIdheaderQuery);
            const lastMasterIdheader = (lastMasterIdheaderResult[0]?.master_id || 0);
            
            const getLastMasterIdcompQuery = "SELECT master_id FROM cutting_component ORDER BY master_id DESC LIMIT 1";
            const [lastMasterIdcompResult] = await connection.query(getLastMasterIdcompQuery);
            const lastMasterIdcomp = (lastMasterIdcompResult[0]?.master_id || 0);
            
            const getLastMasterIdItemQuery = "SELECT master_id FROM cutting_item_detail ORDER BY master_id DESC LIMIT 1";
            const [lastMasterIdItemResult] = await connection.query(getLastMasterIdItemQuery);
            const lastMasterIdItem = (lastMasterIdItemResult[0]?.master_id || 0);
            
            const getLastalterIdheaderQuery = "SELECT alter_id FROM cutting_header ORDER BY master_id DESC LIMIT 1";
            const [lastalterIdheaderResult] = await connection.query(getLastalterIdheaderQuery);
            const lastalterIdheader = (lastalterIdheaderResult[0]?.alter_id || 0);
            
            const getLastalterIdcompQuery = "SELECT alter_id FROM cutting_component ORDER BY master_id DESC LIMIT 1";
            const [lastalterIdcompResult] = await connection.query(getLastalterIdcompQuery);
            const lastalterIdcomp = (lastalterIdcompResult[0]?.alter_id || 0);
            
            const getLastalterIdItemQuery = "SELECT alter_id FROM cutting_item_detail ORDER BY master_id DESC LIMIT 1";
            const [lastalterIdItemResult] = await connection.query(getLastalterIdItemQuery);
            const lastalterIdItem = (lastalterIdItemResult[0]?.alter_id || 0);

            const getLastVchNoQuery = "SELECT vch_no FROM cutting_header ORDER BY master_id DESC LIMIT 1";
      const [lastVchNoResult] = await connection.query(getLastVchNoQuery);
      let lastVchNo = lastVchNoResult[0]?.vch_no || "C-U1-0000-23-24";

      // Extract the numeric part after 'C-23-24-'
      const lastVchNoNumericPart = parseInt(lastVchNo.split('C-U1-')[1]);
  
      // Increment the numeric part and format it back
      const newLastDigits = (lastVchNoNumericPart + 1).toString().padStart(4, '0');
      const tem_vch = `C-U${cuttingUnitNo}-${newLastDigits}-23-24`;
     
      console.log('vch no',tem_vch)
      // Insert header data
      const insertHeaderQuery = "INSERT INTO cutting_header (master_id, alter_id, vch_no, estimate_cs_vch_no, vch_date,unit_no,jobber_id,jobber_name,design_id,design_no,estimated_qty, actual_qty, lot_no, size,other_cost_type, other_cost_val, freight_one_type, freight_one_val, freight_two_type, freight_two_val, godown, Narration) VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?)";
      await connection.query(insertHeaderQuery, [
        lastMasterIdheader + 1 || 0,
        lastalterIdheader+1 || 0,
        tem_vch,
        estimated_vch_no,
        originalDate || "N/A",
        unitNo || 'N/A',
        jobberId || 'N/A',
        jobberName || 'N/A',
        designNoData || 'N/A',
        designNo || "N/A",
        estimatedQty || "N/A",
        actualQty || 0,
        lotNo || 'N/A',
        size || 'N/A',
        otherCostType || 'N/A',
        otherCost || 'N/A',
        freightCostType || 'N/A',
        freightCost || 'N/A',
        freightCostTwoType || 'N/A',
        freightCostTwo|| 'N/A',
        godown || 'N/A',
        naration || "N/A",
      ]);

      // Insert detail data
      const insertDetailQuery = "INSERT INTO cutting_component (master_id, alter_id, vch_no, estimate_cs_vch_no, vch_date,cost_of_components,cutting_charges,freight_on_purchse, additnal_cost_val, total_additnal_cost, effective_cost, rate_per_item, jobwork_bill_made) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      await connection.query(insertDetailQuery, [
        lastMasterIdcomp + 1 || 0,
        lastalterIdcomp+1 || 0,
        tem_vch,
        estimated_vch_no,
        originalDate || "N/A",
        componentCost,
        cuttingCharge|| 0,
        freightCost + freightCostTwo || 0,
        totalAdlCost,
        totalAdlCost || 'N/A',
        effectiveCost || "N/A",
        effectiveRate || 0,
        jobWork|| 0,
      ]);


const insertRowItem = "INSERT INTO cutting_item_detail (master_id, alter_id, vch_no, estimate_cs_vch_no, vch_date,item_name, godown, type, size, lot_no, tolerance, qty, rate, amt) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
if (consumptionUnitData && consumptionUnitData.length) { 
    for (let i = 0; i < consumptionUnitData.length; i++) {
        await connection.query(insertRowItem, [
            lastMasterIdItem + i + 1 || 0,
            lastalterIdItem + i + 1,
            tem_vch,
            estimated_vch_no || 'N/A',
            originalDate || "N/A",
            consumptionUnitData[i].raw_material || 'N/A',
            consumptionUnitData[i].godown || "N/A",
            consumptionUnitData[i].type || "N/A",
            size || 'N/A',
            lotNo || "N/A",
            consumptionUnitData[i].tolorance || 'N/A',
            (consumptionUnitData[i].qty * actualQty ) || 'N/A',
            consumptionUnitData[i].rate|| 'N/A',
            (consumptionUnitData[i].qty * actualQty * consumptionUnitData[i].rate) || 'N/A',
            

        ]);
    }
} else {
    console.error("consumptionUnitData is undefined or has an invalid length");
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
