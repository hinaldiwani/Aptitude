/**
 * Result Routes
 * Routes for viewing and managing results
 */

const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// Student routes - view their own results
router.get('/my-results', verifyToken, authorize('student'), validatePagination, resultController.getMyResults);
router.get('/attempt/:attemptId', verifyToken, validateId, resultController.getResultByAttempt);
router.get('/attempt/:attemptId/details', verifyToken, validateId, resultController.getResultDetails);

// Admin and Teacher routes - view all results
router.get('/student/:studentId', verifyToken, authorize('admin', 'teacher'), validateId, validatePagination, resultController.getStudentResults);
router.get('/exam/:examId', verifyToken, authorize('admin', 'teacher'), validateId, validatePagination, resultController.getExamResults);
router.get('/exam/:examId/leaderboard', verifyToken, validateId, resultController.getExamLeaderboard);
router.get('/exam/:examId/analytics', verifyToken, authorize('admin', 'teacher'), validateId, resultController.getExamAnalytics);
router.get('/exam/:examId/rank/:studentId', verifyToken, validateId, resultController.getStudentRank);

// Admin only - delete results
router.delete('/:id', verifyToken, authorize('admin'), validateId, resultController.deleteResult);

module.exports = router;
