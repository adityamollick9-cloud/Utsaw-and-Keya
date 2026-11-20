import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rsvpRoutes from './routes/rsvpRoutes.js';
import blessingRoutes from './routes/blessingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy (for Render, Heroku, Nginx rate-limiting)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS Configuration
const allowedOrigins = [
  ...(process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',').map(s => s.trim().replace(/\/+$/, '')) : []),
  ...(process.env.DASHBOARD_ORIGIN ? process.env.DASHBOARD_ORIGIN.split(',').map(s => s.trim().replace(/\/+$/, '')) : []),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-side, local file://)
      if (!origin || origin === 'null') return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsing with safe size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/blessings', blessingRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;

