/**
 * Smart Focus Guardian - Backend Server Entrypoint
 */
require('dotenv').config();
const http = require('http');
const app = require('./app');
const db = require('./config/database');

const PORT = parseInt(process.env.PORT || '5000', 10);
const server = http.createServer(app);

server.listen(PORT, () => {
  const dbStatus = db.getStatus();
  console.log('====================================================');
  console.log('   SMART FOCUS GUARDIAN - IOT FOCUS COMPANION       ');
  console.log('====================================================');
  console.log(`[Server] Application running at:  http://localhost:${PORT}`);
  console.log(`[Server] API Health check:         http://localhost:${PORT}/api/health`);
  console.log(`[Server] Database status:          ${dbStatus.connected ? 'MySQL Connected' : 'In-Memory Fallback Mode'}`);
  if (!dbStatus.connected) {
    console.log('[Notice] MySQL is offline or not yet initialized.');
    console.log('[Notice] Demo mode and API requests will operate in-memory.');
    console.log('[Notice] Run "npm run db:init" once MySQL is running to enable persistence.');
  }
  console.log('====================================================');
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
