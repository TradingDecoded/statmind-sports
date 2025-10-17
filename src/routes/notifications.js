// ============================================
// StatMind Sports - Notifications Routes
// API endpoints for user notifications
// ============================================

import express from 'express';
import notificationService from '../services/notificationService.js';
import emailService from '../services/emailService.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const router = express.Router();

// ==========================================
// GET /api/notifications
// Get user's notifications
// ==========================================
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const notifications = await notificationService.getUserNotifications(userId, limit);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// ==========================================
// GET /api/notifications/unread-count
// Get count of unread notifications
// ==========================================
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

// ==========================================
// PUT /api/notifications/:id/read
// Mark a notification as read
// ==========================================
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    await notificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// ==========================================
// PUT /api/notifications/mark-all-read
// Mark all notifications as read
// ==========================================
router.put('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all as read'
    });
  }
});

// ==========================================
// POST /api/notifications/test-email
// Test email configuration (temporary endpoint)
// ==========================================
router.post('/test-email', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Create a fake parlay for testing
    const testParlay = {
      id: 999,
      parlay_name: 'Test Parlay',
      leg_count: 3,
      legs_hit: 3,
      combined_ai_probability: 0.65,
      risk_level: 'Medium',
      is_hit: true
    };
    
    // Import email service at the top if not already imported
    const emailService = (await import('../services/emailService.js')).default;
    
    // Send test win email
    const emailSent = await emailService.sendParlayWinEmail(user, testParlay);
    
    res.json({
      success: true,
      message: 'Test email sent!',
      emailSent,
      sentTo: user.email
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
