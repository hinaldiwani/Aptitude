/**
 * JWT Service
 * Handles JWT token generation and verification
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload {id, email, role}
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
    try {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );
    } catch (error) {
        logger.error('Error generating JWT token:', error);
        throw error;
    }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        logger.error('Error verifying JWT token:', error);
        throw error;
    }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error('Error decoding JWT token:', error);
        throw error;
    }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
    try {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    } catch (error) {
        logger.error('Error generating refresh token:', error);
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    generateRefreshToken
};
