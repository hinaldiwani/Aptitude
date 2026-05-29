/**
 * Authentication Middleware
 * Verifies JWT tokens and manages user authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Verify JWT token from cookie or header
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const verifyToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        logger.error('Error in verifyToken middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error in authentication.'
        });
    }
};

/**
 * Check if user has required role
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role
                };
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    verifyToken,
    authorize,
    optionalAuth
};
