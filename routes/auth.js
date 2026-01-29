const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Login with Google
 *     tags: [Authentication]
 *     description: Redirects to Google OAuth login
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Callback URL for Google OAuth
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    session: true 
  }),
  (req, res) => {
    // Successful authentication
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: req.user._id,
        displayName: req.user.displayName,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });
  }
);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 */
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * @swagger
 * /auth/current:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Current user information
 */
router.get('/current', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      displayName: req.user.displayName,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role
    }
  });
});

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: Authentication failure
 *     tags: [Authentication]
 */
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'Authentication failed'
  });
});

module.exports = router;