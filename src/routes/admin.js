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

export default router;