// ============================================
// StatMind Sports - SMS Bucks Routes
// API endpoints for virtual currency
// ============================================

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import smsBucksService from '../services/smsBucksService.js';
import membershipService from '../services/membershipService.js';

const router = express.Router();

// ==========================================
// GET /api/sms-bucks/balance
// Get current SMS Bucks balance
// ==========================================
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const balance = await smsBucksService.getBalance(req.user.id);
    res.json({
      success: true,
      ...balance
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// GET /api/sms-bucks/transactions
// Get transaction history
// ==========================================
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await smsBucksService.getTransactionHistory(req.user.id, limit);
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// POST /api/sms-bucks/daily-bonus
// Claim daily login bonus
// ==========================================
router.post('/daily-bonus', requireAuth, async (req, res) => {
  try {
    const result = await smsBucksService.processDailyLoginBonus(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error processing daily bonus:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// GET /api/sms-bucks/membership
// Get membership info
// ==========================================
router.get('/membership', requireAuth, async (req, res) => {
  try {
    const info = await membershipService.getMembershipInfo(req.user.id);
    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    console.error('Error getting membership:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// POST /api/sms-bucks/upgrade/premium
// Upgrade to Premium tier
// ==========================================
router.post('/upgrade/premium', requireAuth, async (req, res) => {
  try {
    const result = await membershipService.upgradeToPremium(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error upgrading to Premium:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// POST /api/sms-bucks/upgrade/vip
// Upgrade to VIP tier
// ==========================================
router.post('/upgrade/vip', requireAuth, async (req, res) => {
  try {
    const result = await membershipService.upgradeToVIP(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error upgrading to VIP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
