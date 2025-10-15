// src/routes/admin.js
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const router = express.Router();

// Simple session storage (in-memory for now)
const sessions = new Map();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken || !sessions.has(sessionToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user from database
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session token
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions.set(sessionToken, { username, loginTime: Date.now() });
    
    // Clean old sessions (older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [token, session] of sessions.entries()) {
      if (session.loginTime < oneDayAgo) {
        sessions.delete(token);
      }
    }
    
    // Update last_login
    await pool.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE username = $1',
      [username]
    );
    
    res.json({ 
      success: true, 
      token: sessionToken,
      username: user.username 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/weights
router.get('/weights', requireAuth, async (req, res) => {
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
router.put('/weights', requireAuth, async (req, res) => {
  try {
    const { weights } = req.body;
    
    // Validate weights sum to 1.0 (100%)
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    
    if (Math.abs(total - 1.0) > 0.001) {
      return res.status(400).json({ 
        error: 'Weights must sum to 100%',
        currentTotal: (total * 100).toFixed(1)
      });
    }
    
    // Update each weight
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const [name, value] of Object.entries(weights)) {
        await client.query(
          'UPDATE prediction_weights SET weight_value = $1, updated_at = CURRENT_TIMESTAMP WHERE weight_name = $2',
          [value, name]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Weights updated successfully',
        weights 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update weights error:', error);
    res.status(500).json({ error: 'Failed to update weights' });
  }
});

export default router;
