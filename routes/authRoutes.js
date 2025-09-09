import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// POST /api/auth/login - Environment-based authentication
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check against environment variables
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: 'admin', 
          username: username,
          isAdmin: true 
        },
        process.env.JWT_SECRET,
        { expiresIn: '3h' }
      );

      // Return success response
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: { 
            id: 'admin', 
            username: username, 
            isAdmin: true 
          },
          token
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/verify - Verify token (simplified)
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For environment-based auth, we don't need to check database
    // JWT validation is sufficient
    res.json({
      success: true,
      message: 'Token is valid',
      data: { 
        user: { 
          id: decoded.userId, 
          username: decoded.username, 
          isAdmin: decoded.isAdmin || false 
        } 
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    // Since we're using JWT tokens (stateless), we don't need to invalidate the token on the server
    // The frontend will handle removing the token from localStorage
    // In a production environment, you might want to implement token blacklisting
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;