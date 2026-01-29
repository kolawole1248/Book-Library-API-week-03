// middleware/auth.js
const jwt = require('jsonwebtoken');

// Simple demo authentication middleware
exports.isAuthenticated = (req, res, next) => {
  try {
    // Check for demo user header
    const demoUserId = req.headers['x-demo-user'];
    
    if (demoUserId) {
      req.user = { _id: demoUserId };
      return next();
    }
    
    // If no auth required in dev mode, continue
    if (process.env.NODE_ENV === 'development' && 
        process.env.REQUIRE_AUTH === 'false') {
      return next();
    }
    
    // Check for JWT token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide authentication token or x-demo-user header'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

// Optional authentication (for routes that work with or without auth)
exports.optionalAuth = (req, res, next) => {
  const demoUserId = req.headers['x-demo-user'];
  const token = req.headers.authorization?.split(' ')[1];
  
  if (demoUserId) {
    req.user = { _id: demoUserId };
  } else if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }
  
  next();
};