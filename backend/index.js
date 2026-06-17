import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import experienceRoutes from './routes/experienceRoutes.js';
import mockRoutes from './routes/mockRoutes.js';
import pool from './config/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors({
  origin: '*', // Allow all origins for development; we can restrict this in production
  credentials: true
}));
app.use(express.json());

// Verify Database Connection on startup
const testDbConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection verified. Timestamp from DB:', res.rows[0].now);
  } catch (err) {
    console.error('CRITICAL: Database connection failed during server startup:', err.message);
    console.error('Please verify that your PostgreSQL service is running and that the credentials in your backend/.env file are correct.');
  }
};

testDbConnection();

// Basic API Healthcheck route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PlaceMentor AI API server is running smoothly.',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/mock-interviews', mockRoutes);

// Catch-all 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler caught error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
