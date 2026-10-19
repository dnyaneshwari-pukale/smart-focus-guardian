/**
 * Database Initialization Script
 * Runs schema.sql against the configured MySQL server.
 * Usage: npm run db:init
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
  console.log('--- Smart Focus Guardian Database Initialization ---');
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'smart_focus_guardian';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without specifying database first to allow database creation
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('Connected to MySQL server.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Executing schema definitions from ${schemaPath}...`);
    await connection.query(sql);

    console.log(`Database "${database}" and all tables initialized successfully!`);
  } catch (err) {
    console.error('Database initialization failed:');
    if (err.code === 'ECONNREFUSED') {
      console.error(`Cannot connect to MySQL server at ${host}:${port}. Please verify that MySQL is installed and running.`);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`Access denied for user "${user}". Please check your DB_PASSWORD in .env file.`);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
