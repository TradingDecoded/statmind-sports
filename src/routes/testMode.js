// ============================================
// StatMind Sports - Test Mode Routes
// Allows free upgrades for testing purposes
// ============================================

import express from 'express';
import pool from '../config/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// ==========================================
// CHECK IF TEST MODE IS ENABLED
// ==========================================
const isTestModeEnabled = () => {
    return process.env.TEST_MODE_ENABLED === 'true';
};

// ==========================================
// POST /api/test-mode/upgrade
// Instantly upgrade user to premium/vip for testing
// NO PAYMENT REQUIRED
// ==========================================
router.post('/upgrade', requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        // Check if test mode is enabled
        if (!isTestModeEnabled()) {
            return res.status(403).json({
                success: false,
                error: 'Test mode is not currently enabled'
            });
        }

        const { tier } = req.body;
        const userId = req.user.id;

        // Validate tier
        if (!['premium', 'vip'].includes(tier)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier. Must be premium or vip'
            });
        }

        await client.query('BEGIN');

        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1); // 30 days

        // Determine SMS Bucks based on tier
        const smsBucks = tier === 'premium' ? 500 : 1000;

        // Update user to premium/vip AND mark as test account
        await client.query(
            `UPDATE users 
   SET membership_tier = $1,
       account_tier = $1,
       subscription_start_date = $2,
       subscription_end_date = $3,
       is_test_account = TRUE,
       sms_bucks = sms_bucks + $4
   WHERE id = $5`,
            [tier, now, endDate, smsBucks, userId]
        );

        // Record SMS Bucks transaction
        await client.query(
            `INSERT INTO sms_bucks_transactions 
       (user_id, amount, transaction_type, balance_after, description)
       VALUES ($1, $2, 'test_mode_upgrade', 
               (SELECT sms_bucks FROM users WHERE id = $1),
               $3)`,
            [userId, smsBucks, `Test mode ${tier} upgrade - ${smsBucks} SMS Bucks granted`]
        );

        await client.query('COMMIT');

        console.log(`✅ TEST MODE: User ${userId} upgraded to ${tier} (test account)`);

        res.json({
            success: true,
            message: `Successfully upgraded to ${tier.toUpperCase()} (Test Mode)`,
            tier,
            smsBucks,
            subscriptionEnd: endDate,
            isTestAccount: true
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Test mode upgrade error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process test upgrade'
        });
    } finally {
        client.release();
    }
});

// ==========================================
// GET /api/test-mode/status
// Check if test mode is enabled
// ==========================================
router.get('/status', (req, res) => {
    res.json({
        success: true,
        enabled: isTestModeEnabled()
    });
});

// ==========================================
// GET /api/test-mode/accounts (ADMIN ONLY)
// Get list of all test accounts
// ==========================================
router.get('/accounts', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
  id,
  username,
  email,
  membership_tier,
  sms_bucks,
  subscription_start_date,
  subscription_end_date,
  created_at,
  last_active
       FROM users
       WHERE is_test_account = TRUE
       ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            accounts: result.rows
        });

    } catch (error) {
        console.error('Get test accounts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch test accounts'
        });
    }
});

// ==========================================
// DELETE /api/test-mode/accounts (ADMIN ONLY)
// Delete ALL test accounts with one click
// ==========================================
router.delete('/accounts', requireAuth, requireAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get count of test accounts before deletion
        const countResult = await client.query(
            'SELECT COUNT(*) as count FROM users WHERE is_test_account = TRUE'
        );
        const testAccountCount = parseInt(countResult.rows[0].count);

        if (testAccountCount === 0) {
            await client.query('ROLLBACK');
            return res.json({
                success: true,
                message: 'No test accounts found to delete',
                deletedCount: 0
            });
        }

        // Delete all test accounts (CASCADE will handle related data)
        await client.query('DELETE FROM users WHERE is_test_account = TRUE');

        await client.query('COMMIT');

        console.log(`🗑️ DELETED ${testAccountCount} test accounts`);

        res.json({
            success: true,
            message: `Successfully deleted ${testAccountCount} test account(s)`,
            deletedCount: testAccountCount
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete test accounts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete test accounts'
        });
    } finally {
        client.release();
    }
});

export default router;