// ============================================
// StatMind Sports - Authentication Service
// Handles user registration, login, and JWT tokens
// ============================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Tokens expire in 7 days
const SALT_ROUNDS = 10;

class AuthService {
  
  // ==========================================
  // REGISTER NEW USER
  // ==========================================
  async registerUser({ username, email, password, displayName }) {
    try {
      // 1. Check if username already exists
      const usernameCheck = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      if (usernameCheck.rows.length > 0) {
        throw new Error('Username already taken');
      }
      
      // 2. Check if email already exists
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (emailCheck.rows.length > 0) {
        throw new Error('Email already registered');
      }
      
      // 3. Hash the password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // 4. Insert new user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, display_name, created_at`,
        [username, email, passwordHash, displayName || username]
      );
      
      const user = result.rows[0];
      
      // 5. Create user stats entry
      await pool.query(
        'INSERT INTO user_stats (user_id) VALUES ($1)',
        [user.id]
      );
      
      // 6. Generate JWT token
      const token = this.generateToken(user);
      
      console.log(`✅ New user registered: ${username}`);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          createdAt: user.created_at
        },
        token
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  // ==========================================
  // LOGIN USER
  // ==========================================
  async loginUser({ email, password }) {
    try {
      // 1. Find user by email
      const result = await pool.query(
        `SELECT id, username, email, password_hash, display_name, avatar_url
         FROM users
         WHERE email = $1 AND is_active = true`,
        [email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }
      
      const user = result.rows[0];
      
      // 2. Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        throw new Error('Invalid email or password');
      }
      
      // 3. Update last_active
      await pool.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      // 4. Generate JWT token
      const token = this.generateToken(user);
      
      console.log(`✅ User logged in: ${user.username}`);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url
        },
        token
      };
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  // ==========================================
  // GENERATE JWT TOKEN
  // ==========================================
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
  
  // ==========================================
  // VERIFY JWT TOKEN
  // ==========================================
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  
  // ==========================================
  // GET USER BY ID
  // ==========================================
  async getUserById(userId) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.bio,
                u.account_tier, u.created_at,
                s.total_parlays, s.total_wins, s.total_losses, s.win_rate,
                s.current_streak, s.best_streak
         FROM users u
         LEFT JOIN user_stats s ON u.id = s.user_id
         WHERE u.id = $1 AND u.is_active = true`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
}

export default new AuthService();
