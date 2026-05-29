/**
 * Security Middleware
 * Implements security features like rate limiting, helmet, CORS
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('../config/logger');

/**
 * Rate limiter for general API requests
 */
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || 100), // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many login attempts from this IP, please try again after 15 minutes.'
        });
    }
});

/**
 * Rate limiter for exam submissions
 */
const examSubmitLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Max 30 requests per minute (for auto-save)
    message: {
        success: false,
        message: 'Too many submission requests, please slow down.'
    }
});

/**
 * CORS configuration
 */
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
});

/**
 * Prevent parameter pollution
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const preventParameterPollution = (req, res, next) => {
    // Check for duplicate parameters in query
    const queryKeys = Object.keys(req.query);
    const duplicates = queryKeys.filter((key, index) => queryKeys.indexOf(key) !== index);

    if (duplicates.length > 0) {
        logger.warn(`Parameter pollution attempt detected: ${duplicates.join(', ')}`);
        return res.status(400).json({
            success: false,
            message: 'Invalid request parameters detected'
        });
    }

    next();
};

/**
 * Log suspicious activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const logSuspiciousActivity = (req, res, next) => {
    // Check for common attack patterns
    const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,  // XSS attempts
        /(\$\{|\$\()/gi,                 // Template injection
        /(union|select|insert|update|delete|drop|create|alter)/gi, // SQL injection
        /../gi                           // Path traversal
    ];

    const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(checkString)) {
            logger.warn(`Suspicious activity detected from IP ${req.ip}: ${req.path}`, {
                body: req.body,
                query: req.query,
                headers: req.headers
            });
            break;
        }
    }

    next();
};

/**
 * Prevent exam cheating - detect multiple tabs
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const preventCheating = (req, res, next) => {
    // This is a placeholder - actual implementation would use
    // session storage or Redis to track active exam sessions
    // and detect if same user is accessing from multiple locations
    next();
};

/**
 * Sanitize user input
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Remove null bytes and trim
                req.body[key] = req.body[key].replace(/\0/g, '').trim();
            }
        });
    }

    // Sanitize query
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].replace(/\0/g, '').trim();
            }
        });
    }

    next();
};

module.exports = {
    apiLimiter,
    authLimiter,
    examSubmitLimiter,
    corsOptions,
    helmetConfig,
    preventParameterPollution,
    logSuspiciousActivity,
    preventCheating,
    sanitizeInput,
    cors: cors(corsOptions),
    helmet: helmetConfig
};
