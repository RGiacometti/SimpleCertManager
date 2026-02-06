const express = require('express');
const { getPocketBase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const pb = getPocketBase();
    
    // Authenticate with PocketBase
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    res.json({
      success: true,
      data: {
        token: pb.authStore.token,
        user: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name,
          avatar: authData.record.avatar
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    pb.authStore.clear();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    // Get current user from auth store
    const user = pb.authStore.model;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        created: user.created,
        updated: user.updated
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    // Refresh the auth token
    await pb.collection('users').authRefresh();
    
    res.json({
      success: true,
      data: {
        token: pb.authStore.token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private
 */
router.get('/verify', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
