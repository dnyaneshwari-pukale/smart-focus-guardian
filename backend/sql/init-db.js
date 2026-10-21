/**
 * Database Initialization and Safe Migration Script
 * Runs schema.sql and verifies all required tables and columns.
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

    // Apply safe column additions for existing tables if needed
    await connection.changeUser({ database });

    const ensureColumn = async (table, column, definition) => {
      try {
        const [rows] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [database, table, column]
        );
        if (rows.length === 0) {
          console.log(`Migrating: Adding column ${column} to table ${table}...`);
          await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
      } catch (colErr) {
        console.warn(`Column check warning for ${table}.${column}:`, colErr.message);
      }
    };

    await ensureColumn('devices', 'user_id', 'VARCHAR(64) NULL');
    await ensureColumn('study_sessions', 'user_id', 'VARCHAR(64) NULL');
    await ensureColumn('lamp_commands', 'user_id', 'VARCHAR(64) NULL');

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
