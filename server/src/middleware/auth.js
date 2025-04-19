const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

// Development bypass flag - set to true to bypass authentication
const BYPASS_AUTH = true;

/**
 * Middleware to verify JWT token
 * In development mode, authentication is bypassed if BYPASS_AUTH is true
 */
const authenticateToken = (req, res, next) => {
  // In development mode, bypass authentication if the flag is set
  if (BYPASS_AUTH && process.env.NODE_ENV === 'development') {
    logger.info('*** DEV MODE: Authentication bypassed ***');
    // Add a dummy user to the request
    req.user = {
      userId: '00000000-0000-0000-0000-000000000000', 
      email: 'dev@example.com',
      name: 'Development User',
      isAdmin: true
    };
    return next();
  }

  // Normal authentication flow
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: No bearer token provided');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
};
