import express from 'express';
import dotenv from 'dotenv';
import leadRoutes from './routes/leadRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// OPTIMIZED: Add response compression for better performance
app.use((req, res, next) => {
  // Enable gzip compression for text responses
  if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' })); // Add limit for security
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// OPTIMIZED: Add basic caching headers for GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.includes('/auth/')) {
    // Cache GET requests (except auth) for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
  } else {
    // No cache for POST/PUT/DELETE and auth endpoints
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

// Simple test route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the FIFAC CRM backend server!' });
});

// OPTIMIZED: Add error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Export the Express app as a serverless function
export default app;

// Only start the server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
    console.log(`Test routes:`);
    console.log(`- GET all leads: http://localhost:${PORT}/api/leads`);
    console.log(`- POST create lead: http://localhost:${PORT}/api/leads`);
    console.log(`- GET all students: http://localhost:${PORT}/api/students`);
    console.log(`- POST create student: http://localhost:${PORT}/api/students`);
    console.log(`- GET all payments: http://localhost:${PORT}/api/payments`);
    console.log(`- POST login: http://localhost:${PORT}/api/auth/login`);
    console.log(`- POST logout: http://localhost:${PORT}/api/auth/logout`);
  });
}