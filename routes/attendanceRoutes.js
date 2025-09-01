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



// GET /api/attendance/student/:studentId - Get attendance for a student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false,
        error: 'Year and month parameters are required.' 
      });
    }
    
    const attendance = await getStudentAttendance(studentId, parseInt(year), parseInt(month));
    
    res.json({ 
      success: true,
      message: 'Attendance retrieved successfully!',
      data: attendance 
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve attendance records.' 
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