import express from 'express';
import { getPayments, getPaymentById, getPaymentsByStudentId, getPaymentsByDateRange } from '../models/paymentModels.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/payments - Get all payments (ordered by latest first)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const payments = await getPayments();
    res.json({ 
      success: true,
      message: 'Payments retrieved successfully!',
      data: payments 
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve payments from the database.' 
    });
  }
});

// GET /api/payments/:id - Get a single payment by ID
router.get('/:id', authenticateToken, async (req, res) => {    
    try {
        const payment = await getPaymentById(req.params.id);
        
        if (!payment) {
        return res.status(404).json({ 
            success: false,
            error: 'Payment not found.' 
        });
        }
        
        res.json({ 
        success: true,
        message: 'Payment retrieved successfully!',
        data: payment 
        });
    } catch (error) {
        console.error('Error getting payment:', error);
        res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve the payment.' 
        });
    }
}); 

// GET /api/payments/student/:studentId - Get payments by student ID
router.get('/student/:studentId', authenticateToken, async (req, res) => {
    try {
        const payments = await getPaymentsByStudentId(req.params.studentId);
        
        res.json({ 
        success: true,
        message: 'Student payments retrieved successfully!',
        data: payments 
        });
    } catch (error) {
        console.error('Error getting student payments:', error);
        res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve student payments.' 
        });
    }
});

// GET /api/payments/date-range - Get payments by date range
router.get('/date-range', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate required query parameters
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false,
                error: 'Start date and end date are required query parameters.' 
            });
        }
        
        const payments = await getPaymentsByDateRange(startDate, endDate);
        
        res.json({ 
        success: true,
        message: 'Payments for date range retrieved successfully!',
        data: payments 
        });
    } catch (error) {
        console.error('Error getting payments by date range:', error);
        res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve payments for the date range.' 
        });
    }
});

export default router;

