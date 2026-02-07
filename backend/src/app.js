require('dotenv').config();
const express = require('express');
const { PORT, NODE_ENV } = require('./config/constants');
const { configureServer } = require('./config/server');
const { initializeDatabase } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Configure server middleware
configureServer(app);

// Import routes
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const certificateRoutes = require('./routes/certificates');
const caRoutes = require('./routes/ca');
const intermediateCAsRoutes = require('./routes/intermediateCAs');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SimpleCertManager API is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ca', caRoutes);
app.use('/api/intermediate-cas', intermediateCAsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SimpleCertManager API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      requests: '/api/requests',
      certificates: '/api/certificates',
      ca: '/api/ca',
      'intermediate-cas': '/api/intermediate-cas',
      reports: '/api/reports',
      audit: '/api/audit'
    },
    documentation: 'See plans/ca-management-app-plan.md for API documentation'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize database connection
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
      console.error('Failed to connect to PocketBase. Please ensure PocketBase is running.');
      process.exit(1);
    }
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         SimpleCertManager Backend API                 ║
║                                                       ║
║  Environment: ${NODE_ENV.padEnd(38)}║
║  Port:        ${PORT.toString().padEnd(38)}║
║  Status:      Running                                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
      console.log(`API available at: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
