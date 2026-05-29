/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const logger = require('../config/logger');

/**
 * 404 Not Found handler
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const notFound = (req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.originalUrl
    });
};

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry. Resource already exists.';
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Invalid reference. Related resource not found.';
    }

    if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized access';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack
        })
    });
};

/**
 * Async handler wrapper
 * Wraps async functions to catch errors and pass to error handler
 * @param {Function} fn - Async function
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom error class
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    AppError
};
