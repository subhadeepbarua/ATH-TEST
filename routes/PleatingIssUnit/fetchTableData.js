const express = require("express");
const router = express.Router();
const mysql2 = require("mysql2");
require('dotenv').config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

router.post("/", (req, res) => {
  const { esVch } = req.body;

  console.log('value',esVch);
  
  pool.getConnection((err, connection) => {
      if (err) {
          console.error("Error getting database connection:", err);
          res.status(500).send("Error fetching data");
          return;
      }

      // Query to fetch last_operation for the provided vch_no values
      const lastOperationQuery = `
          SELECT last_operation
          FROM spliting_header
          WHERE estimated_cs_vch_no = ?
      `;

      // Execute the SQL query
      connection.query(lastOperationQuery, [esVch], (error, results) => {
          if (error) {
              connection.release();
              console.error("Error executing query:", error);
              res.status(500).send("Error fetching data");
              return;
          }

          // Release the connection before sending the response
          connection.release();

          // Extract the last_operation value if it exists
          const lastOperation = results.length > 0 ? results[0].last_operation : null;


          // Check if lastOperation is NULL
          console.log('last lastOperation', lastOperation)


          if (lastOperation === null) {
            const headerQuery = `
                SELECT vch_no
                FROM spliting_header
                WHERE estimated_cs_vch_no = ?
            `;
           
            // Execute the SQL query to fetch vch_no
            connection.query(headerQuery, [esVch], (error, headerResults) => {
                if (error) {
                    console.error("Error executing header query:", error);
                    res.status(500).send("Error fetching data");
                    connection.release();
                    return;
                }

                // If no vch_no found, send empty response
                if (headerResults.length === 0) {
                    res.json([]);
                    connection.release();
                    return;
                }

                // Extract vch_no values from headerResults
                const vchNos = headerResults.map(row => row.vch_no);

                // Query to fetch everything from spliting_source table where vch_no matches fetched vch_no
                const sourceQuery = `
                    SELECT *
                    FROM spliting_destination
                    WHERE vch_no IN (?)
                `;

                // Execute the SQL query to fetch data from spliting_source
                connection.query(sourceQuery, [vchNos], (sourceError, sourceResults) => {
                    // Release the connection
                    connection.release();

                    if (sourceError) {
                        console.error("Error executing source query:", sourceError);
                        res.status(500).send("Error fetching data");
                        return;
                    }

                    // Send the fetched data back to the frontend
                    console.log('last op data hand null', sourceResults)
                    res.json(sourceResults);
                });
            });

        } 
        
        else if (lastOperation === 'FUS') {
         
          const headerQuery = `
          SELECT vch_no
          FROM fus_rec_header
          WHERE estimate_cs_vch_no = ?
      `;
      console.log('vch 3', esVch)
      // Execute the SQL query to fetch vch_no
      connection.query(headerQuery, [esVch], (error, headerResults) => {
          if (error) {
              console.error("Error executing header query:", error);
              res.status(500).send("Error fetching data");
              connection.release();
              return;
          }

          // If no vch_no found, send empty response
          if (headerResults.length === 0) {
              res.json([]);
              connection.release();
              return;
          }

          // Extract vch_no values from headerResults
          const vchNos = headerResults.map(row => row.vch_no);

          // Query to fetch everything from spliting_source table where vch_no matches fetched vch_no
          const sourceQuery = `
              SELECT *
              FROM fus_rec_destination
              WHERE vch_no IN (?)
          `;

          // Execute the SQL query to fetch data from spliting_source
          connection.query(sourceQuery, [vchNos], (sourceError, sourceResults) => {
              // Release the connection
              connection.release();

              if (sourceError) {
                  console.error("Error executing source query:", sourceError);
                  res.status(500).send("Error fetching data");
                  return;
              }

              // Send the fetched data back to the frontend
              console.log('last op data EMB', sourceResults)
              res.json(sourceResults);
          });
      });
        }

        else if (lastOperation === 'EMB') {
         
          const headerQuery = `
          SELECT vch_no
          FROM emb_rec_header
          WHERE estimate_cs_vch_no = ?
      `;
      console.log('vch 3', esVch)
      // Execute the SQL query to fetch vch_no
      connection.query(headerQuery, [esVch], (error, headerResults) => {
          if (error) {
              console.error("Error executing header query:", error);
              res.status(500).send("Error fetching data");
              connection.release();
              return;
          }

          // If no vch_no found, send empty response
          if (headerResults.length === 0) {
              res.json([]);
              connection.release();
              return;
          }

          // Extract vch_no values from headerResults
          const vchNos = headerResults.map(row => row.vch_no);

          // Query to fetch everything from spliting_source table where vch_no matches fetched vch_no
          const sourceQuery = `
              SELECT *
              FROM emb_rec_destination
              WHERE vch_no IN (?)
          `;

          // Execute the SQL query to fetch data from spliting_source
          connection.query(sourceQuery, [vchNos], (sourceError, sourceResults) => {
              // Release the connection
              connection.release();

              if (sourceError) {
                  console.error("Error executing source query:", sourceError);
                  res.status(500).send("Error fetching data");
                  return;
              }

              // Send the fetched data back to the frontend
              console.log('HAND WORK EMB', sourceResults)
              res.json(sourceResults);
          });
      });
        }

        else if (lastOperation === 'PLE') {
         
          const headerQuery = `
          SELECT vch_no
          FROM pleating_rec_header
          WHERE estimate_cs_vch_no = ?
      `;
      console.log('vch 3', esVch)
      // Execute the SQL query to fetch vch_no
      connection.query(headerQuery, [esVch], (error, headerResults) => {
          if (error) {
              console.error("Error executing header query:", error);
              res.status(500).send("Error fetching data");
              connection.release();
              return;
          }

          // If no vch_no found, send empty response
          if (headerResults.length === 0) {
              res.json([]);
              connection.release();
              return;
          }

          // Extract vch_no values from headerResults
          const vchNos = headerResults.map(row => row.vch_no);

          // Query to fetch everything from spliting_source table where vch_no matches fetched vch_no
          const sourceQuery = `
              SELECT *
              FROM pleating_rec_destination
              WHERE vch_no IN (?)
          `;

          // Execute the SQL query to fetch data from spliting_source
          connection.query(sourceQuery, [vchNos], (sourceError, sourceResults) => {
              // Release the connection
              connection.release();

              if (sourceError) {
                  console.error("Error executing source query:", sourceError);
                  res.status(500).send("Error fetching data");
                  return;
              }

              // Send the fetched data back to the frontend
             
              res.json(sourceResults);
          });
      });
        }
        
        else if (lastOperation === 'HND') {
         
          const headerQuery = `
          SELECT vch_no
          FROM handwork_rec_header
          WHERE estimate_cs_vch_no = ?
      `;
      console.log('vch 3', esVch)
      // Execute the SQL query to fetch vch_no
      connection.query(headerQuery, [esVch], (error, headerResults) => {
          if (error) {
              console.error("Error executing header query:", error);
              res.status(500).send("Error fetching data");
              connection.release();
              return;
          }

          // If no vch_no found, send empty response
          if (headerResults.length === 0) {
              res.json([]);
              connection.release();
              return;
          }

          // Extract vch_no values from headerResults
          const vchNos = headerResults.map(row => row.vch_no);

          // Query to fetch everything from spliting_source table where vch_no matches fetched vch_no
          const sourceQuery = `
              SELECT *
              FROM handwork_rec_destination
              WHERE vch_no IN (?)
          `;

          // Execute the SQL query to fetch data from spliting_source
          connection.query(sourceQuery, [vchNos], (sourceError, sourceResults) => {
              // Release the connection
              connection.release();

              if (sourceError) {
                  console.error("Error executing source query:", sourceError);
                  res.status(500).send("Error fetching data");
                  return;
              }

              // Send the fetched data back to the frontend
             
              res.json(sourceResults);
          });
      });
        }

      });
  });
});


  

module.exports = router;
