// src/routes/admin.js
import express from 'express';
import pool from '../config/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin routes require authentication + admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/admin/weights
router.get('/weights', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM prediction_weights ORDER BY weight_name'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get weights error:', error);
    res.status(500).json({ error: 'Failed to fetch weights' });
  }
});

// PUT /api/admin/weights
router.put('/weights', async (req, res) => {
  try {
    const { weights } = req.body;
    
    // Validate that weights sum to 1.0
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      return res.status(400).json({ error: 'Weights must sum to 100%' });
    }
    
    // Update each weight
    for (const [name, value] of Object.entries(weights)) {
      await pool.query(
        'UPDATE prediction_weights SET weight_value = $1 WHERE weight_name = $2',
        [value, name]
      );
    }
    
    console.log(`✅ Admin ${req.user.username} updated prediction weights`);
    
    res.json({ 
      success: true,
      message: 'Weights updated successfully' 
    });
  } catch (error) {
    console.error('Update weights error:', error);
    res.status(500).json({ error: 'Failed to update weights' });
  }
});

// POST /api/admin/weights/set-default
router.post('/weights/set-default', async (req, res) => {
  try {
    // Copy current weight_value to default_value for all weights
    await pool.query(
      'UPDATE prediction_weights SET default_value = weight_value'
    );
    
    console.log(`✅ Admin ${req.user.username} set current weights as default`);
    
    res.json({ 
      success: true,
      message: 'Current weights saved as default' 
    });
  } catch (error) {
    console.error('Set default weights error:', error);
    res.status(500).json({ error: 'Failed to set default weights' });
  }
});

// POST /api/admin/weights/reset-to-default
router.post('/weights/reset-to-default', async (req, res) => {
  try {
    // Copy default_value to weight_value for all weights
    await pool.query(
      'UPDATE prediction_weights SET weight_value = default_value'
    );
    
    // Get the updated weights to return to frontend
    const result = await pool.query(
      'SELECT * FROM prediction_weights ORDER BY weight_name'
    );
    
    console.log(`✅ Admin ${req.user.username} reset weights to default`);
    
    res.json({ 
      success: true,
      message: 'Weights reset to default values',
      weights: result.rows
    });
  } catch (error) {
    console.error('Reset default weights error:', error);
    res.status(500).json({ error: 'Failed to reset to default weights' });
  }
});

export default router;