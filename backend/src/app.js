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

// API Routes will be added here
// TODO: Add routes in Phase 2

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
