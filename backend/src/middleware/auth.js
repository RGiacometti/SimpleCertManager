const { pb } = require('../config/database');
const { AppError } = require('./errorHandler');

/**
 * Authentication middleware
 * Verifies that the request has a valid PocketBase auth token
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Set the auth token in PocketBase
    pb.authStore.save(token, null);
    
    // Verify token by fetching user data
    try {
      const authData = await pb.collection('users').authRefresh();
      
      if (!authData || !authData.record) {
        throw new AppError('Invalid or expired token', 401);
      }
      
      // Attach user to request
      req.user = authData.record;
      req.userId = authData.record.id;
      
      next();
    } catch (pbError) {
      // Token is invalid or expired
      pb.authStore.clear();
      throw new AppError('Invalid or expired token', 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      pb.authStore.save(token);
      
      if (pb.authStore.isValid) {
        req.user = pb.authStore.model;
        req.userId = pb.authStore.model?.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Get client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
}

module.exports = {
  authenticate,
  optionalAuth,
  getClientIp
};
