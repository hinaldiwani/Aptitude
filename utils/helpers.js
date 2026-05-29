/**
 * Helper Utilities
 * Common utility functions used across the application
 */

const crypto = require('crypto');

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Format date to MySQL datetime format
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatDateForMySQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Calculate percentage
 * @param {number} obtained - Obtained marks
 * @param {number} total - Total marks
 * @returns {number} Percentage (2 decimal places)
 */
const calculatePercentage = (obtained, total) => {
    if (total === 0) return 0;
    return parseFloat(((obtained / total) * 100).toFixed(2));
};

/**
 * Check if exam is currently active
 * @param {Object} exam - Exam object with start_time and end_time
 * @returns {boolean} Active status
 */
const isExamActive = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    return now >= startTime && now <= endTime && exam.is_active;
};

/**
 * Get time remaining in seconds
 * @param {Date} endTime - End time
 * @returns {number} Remaining seconds
 */
const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    return Math.max(0, Math.floor(diff / 1000));
};

/**
 * Shuffle array (for randomizing questions/options)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Sanitize filename
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

/**
 * Get client IP address
 * @param {Object} req - Request object
 * @returns {string} IP address
 */
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;
};

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Valid status
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Generate pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const generatePagination = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

module.exports = {
    generateRandomString,
    formatDateForMySQL,
    calculatePercentage,
    isExamActive,
    getTimeRemaining,
    shuffleArray,
    sanitizeFilename,
    getClientIP,
    formatTime,
    isValidEmail,
    generatePagination,
    sleep,
    deepClone
};
