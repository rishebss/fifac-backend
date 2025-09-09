import express from 'express';
import { 
  getStudentAttendance, 
  markAttendance, 
  deleteAttendance,
  deleteMonthlyAttendance,
  getAttendanceSummary
} from '../models/attendanceModels.js';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
const attendanceCollection = db.collection('attendance');

// GET /api/attendance - General attendance query with flexible parameters
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📡 Received attendance request:', req.query);
    const { studentId, startDate, endDate, year, month } = req.query;
    
    if (!studentId) {
      console.log('❌ Missing studentId parameter');
      return res.status(400).json({ 
        success: false,
        error: 'Student ID is required.' 
      });
    }
    
    let attendance;
    
    if (year && month) {
      // Use year/month format
      console.log('📅 Using year/month format:', { year: parseInt(year), month: parseInt(month) });
      attendance = await getStudentAttendance(studentId, parseInt(year), parseInt(month));
    } else if (startDate && endDate) {
      // Use date range format - convert to year/month for existing function
      const start = new Date(startDate);
      const year = start.getFullYear();
      const month = start.getMonth() + 1;
      console.log('📅 Using startDate/endDate format, converted to:', { year, month });
      attendance = await getStudentAttendance(studentId, year, month);
    } else {
      console.log('❌ Missing required date parameters');
      return res.status(400).json({ 
        success: false,
        error: 'Either (year and month) or (startDate and endDate) parameters are required.' 
      });
    }
    
    console.log('✅ Retrieved attendance records:', attendance.length);
    res.json({ 
      success: true,
      message: 'Attendance retrieved successfully!',
      data: attendance 
    });
  } catch (error) {
    console.error('❌ Error getting attendance:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve attendance records.',
      details: error.message // Add more details for debugging
    });
  }
});



// GET /api/attendance/student/:studentId - Get attendance for a student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, month } = req.query;
    
    console.log(`📡 Getting attendance for student ${studentId}, year: ${year}, month: ${month}`);
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false,
        error: 'Year and month parameters are required.' 
      });
    }
    
    const attendance = await getStudentAttendance(studentId, parseInt(year), parseInt(month));
    
    console.log(`✅ Successfully retrieved ${attendance.length} attendance records`);
    res.json({ 
      success: true,
      message: 'Attendance retrieved successfully!',
      data: attendance 
    });
  } catch (error) {
    console.error('❌ Error getting attendance for student:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve attendance records.',
      details: error.message
    });
  }
});

// POST /api/attendance - Mark attendance
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { studentId, date, status, notes } = req.body;
    
    if (!studentId || !date || !status) {
      return res.status(400).json({ 
        success: false,
        error: 'Student ID, date, and status are required fields.' 
      });
    }
    
    const attendanceRecord = await markAttendance({
      studentId,
      date: new Date(date).toISOString(),
      status,
      notes: notes || ''
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Attendance marked',
      data: attendanceRecord 
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark attendance.' 
    });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await deleteAttendance(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Attendance record not found.' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Attendance record deleted successfully!' 
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete attendance record.' 
    });
  }
});

// DELETE /api/attendance/student/:studentId/month - Delete monthly attendance
router.delete('/student/:studentId/month', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false,
        error: 'Year and month parameters are required.' 
      });
    }
    
    const result = await deleteMonthlyAttendance(studentId, parseInt(year), parseInt(month));
    
    res.json({ 
      success: true,
      message: `Deleted ${result.deletedCount} attendance records for the specified month.`,
      data: result 
    });
  } catch (error) {
    console.error('Error deleting monthly attendance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete monthly attendance records.' 
    });
  }
});

// GET /api/attendance/student/:studentId/summary - Get attendance summary
router.get('/student/:studentId/summary', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false,
        error: 'Year and month parameters are required.' 
      });
    }
    
    const summary = await getAttendanceSummary(studentId, parseInt(year), parseInt(month));
    
    res.json({ 
      success: true,
      message: 'Attendance summary retrieved successfully!',
      data: summary 
    });
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve attendance summary.' 
    });
  }
});

export default router;