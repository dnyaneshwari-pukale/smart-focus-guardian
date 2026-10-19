/**
 * Health Controller
 * Reports server uptime, database connection state, and runtime diagnostics.
 */
const db = require('../config/database');

function getHealth(req, res) {
  const dbStatus = db.getStatus();

  res.json({
    status: 'ok',
    project: 'Smart Focus Guardian',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      mode: dbStatus.mode,
      host: dbStatus.host,
      database: dbStatus.database,
      notice: dbStatus.connected 
        ? 'Connected to MySQL pool.' 
        : 'Running in in-memory development mode. Start MySQL and run "npm run db:init" for persistent storage.'
    }
  });
}

module.exports = { getHealth };
