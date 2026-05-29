/**
 * Exam Taking Routes
 * Routes for students to take exams
 */

const express = require('express');
const router = express.Router();
const examTakeController = require('../controllers/examTakeController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateAnswer, validatePagination } = require('../middleware/validation');
const { examSubmitLimiter } = require('../middleware/security');

// Student routes for taking exams
router.post('/start', verifyToken, authorize('student'), examTakeController.startExam);
router.get('/attempt/:attemptId', verifyToken, authorize('student'), examTakeController.getAttemptDetails);
router.post('/save-answer', verifyToken, authorize('student'), examSubmitLimiter, validateAnswer, examTakeController.saveAnswer);
router.post('/submit/:attemptId', verifyToken, authorize('student'), examTakeController.submitExam);
router.get('/result/:attemptId', verifyToken, examTakeController.getExamResult);
router.get('/history', verifyToken, authorize('student'), validatePagination, examTakeController.getExamHistory);

module.exports = router;
