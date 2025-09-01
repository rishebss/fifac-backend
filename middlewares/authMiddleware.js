import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = { id: userDoc.id, ...userDoc.data() };
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};