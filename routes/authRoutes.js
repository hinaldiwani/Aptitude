/**
 * Authentication Routes
 * Routes for user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateStudentProfile } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

// Public routes
router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);

// Protected routes
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, validateStudentProfile, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
