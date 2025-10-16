// ============================================
// StatMind Sports - Authentication Routes
// API endpoints for user registration and login
// ============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// POST /api/auth/register
// Register a new user
// ==========================================
router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ max: 100 })
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { username, email, password, displayName } = req.body;
      
      // Register user
      const result = await authService.registerUser({
        username,
        email,
        password,
        displayName
      });
      
      res.status(201).json(result);
      
    } catch (error) {
      console.error('Registration route error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ==========================================
// POST /api/auth/login
// Login existing user
// ==========================================
router.post('/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { email, password } = req.body;
      
      // Login user
      const result = await authService.loginUser({ email, password });
      
      res.json(result);
      
    } catch (error) {
      console.error('Login route error:', error);
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ==========================================
// GET /api/auth/me
// Get current user profile (requires authentication)
// ==========================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// ==========================================
// POST /api/auth/logout
// Logout (client-side token removal, but we log it)
// ==========================================
router.post('/logout', requireAuth, async (req, res) => {
  try {
    console.log(`✅ User logged out: ${req.user.username}`);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router;
