import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.userId, email: decoded.email, username: decoded.username, ...decoded };
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};