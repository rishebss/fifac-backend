import express from 'express';
import dotenv from 'dotenv';
import leadRoutes from './routes/leadRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);

// Simple test route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the FIFAC CRM backend server!' });
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
    console.log(`- POST login: http://localhost:${PORT}/api/auth/login`);
    console.log(`- POST logout: http://localhost:${PORT}/api/auth/logout`);
  });
}