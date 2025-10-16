// ============================================
// StatMind Sports - Authentication Middleware
// Protects routes that require login
// ============================================

import authService from '../services/authService.js';

// ==========================================
// REQUIRE AUTHENTICATION
// Use this on routes that need a logged-in user
// ==========================================
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // 2. Verify token
    const decoded = authService.verifyToken(token);
    
    // 3. Get user data
    const user = await authService.getUserById(decoded.userId);
    
    // 4. Attach user to request object
    req.user = user;
    
    // 5. Continue to next middleware/route
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token'
    });
  }
};

// ==========================================
// OPTIONAL AUTHENTICATION
// Attaches user if logged in, but allows access if not
// ==========================================
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = authService.verifyToken(token);
      const user = await authService.getUserById(decoded.userId);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};
