/**
 * Main Routes Index
 * Combines all API routes
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const examRoutes = require('./examRoutes');
const questionRoutes = require('./questionRoutes');
const examTakeRoutes = require('./examTakeRoutes');
const resultRoutes = require('./resultRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/exams', examRoutes);
router.use('/questions', questionRoutes);
router.use('/exam-take', examTakeRoutes);
router.use('/results', resultRoutes);

// API health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
