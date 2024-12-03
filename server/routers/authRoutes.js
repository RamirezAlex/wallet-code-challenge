// server/routes/authRoutes.js
const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth');
const router = express.Router();

// Signup route
router.post(
  '/signup',
  [
    check('username').not().isEmpty().withMessage('Username is required'),
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  authController.signup
);

// Login route
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  authController.login
);

// Add these new routes to your existing routes
router.get('/nonce/:address', authController.getNonce);
router.post('/verify-wallet', authController.verifyWallet);
router.post('/signup-wallet', [
  check('username').not().isEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Invalid email'),
], authController.signupWallet);

module.exports = router;
