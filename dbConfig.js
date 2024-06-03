// dbConfig.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '193.203.184.53',
  user: 'u114727550_artherv',
  password: 'Artherv@321',
  database: 'u114727550_artherv_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
