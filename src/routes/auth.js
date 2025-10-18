// ============================================
// StatMind Sports - Authentication Routes
// API endpoints for user registration and login
// ============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import pool from '../config/database.js';

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

// ==========================================
// PUT /api/auth/update-profile
// Update user profile (display name, bio)
// ==========================================
router.put('/update-profile', requireAuth, async (req, res) => {
  try {
    const { display_name, bio } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE users 
       SET display_name = $1, bio = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, email, display_name, bio`,
      [display_name, bio, userId]
    );

    console.log(`✅ Profile updated for user: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// ==========================================
// PUT /api/auth/change-password
// Change user password
// ==========================================
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await authService.verifyPassword(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await authService.hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    console.log(`✅ Password changed for user: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

export default router;
