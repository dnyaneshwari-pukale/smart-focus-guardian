/**
 * Express Application Setup
 * Configures middleware, API routes, static frontend delivery, and error handling.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const lampRoutes = require('./routes/lampRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Middleware imports
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { optionalUserAuth } = require('./middleware/auth');

const app = express();

// Security & Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-token']
};
app.use(cors(corsOptions));

// Parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Development request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Apply rate limiting to API routes
app.use('/api', generalLimiter);

// Optional user auth parser for all API routes
app.use('/api', optionalUserAuth);

// Mount API Endpoints
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', sensorRoutes);
app.use('/api', lampRoutes);
app.use('/api', sessionRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', settingsRoutes);

// Serve frontend static assets from the project root
const frontendPath = path.resolve(__dirname, '..');
app.use(express.static(frontendPath));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Root fallback to index.html for frontend navigation
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
