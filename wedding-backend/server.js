import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedInitialAdmin } from './src/services/seedAdmin.js';

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Seed default admins if none exist
    await seedInitialAdmin();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` Wedding Backend API Server Running `);
      console.log(` Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Endpoints:`);
      console.log(`  - POST /api/rsvp (Public RSVP)`);
      console.log(`  - POST /api/blessings (Public Blessing)`);
      console.log(`  - POST /api/admin/login (Admin Auth)`);
      console.log(`  - GET  /api/admin/statistics (Admin Stats)`);
      console.log(`  - GET  /api/health (Health Check)`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log('[Server] MongoDB disconnected cleanly.');
        } catch (e) {
          console.error('[Server] Error during MongoDB disconnect:', e);
        }
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Server] Unhandled Promise Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('[Server] Uncaught Exception:', err);
    });

  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
