/**
 * Exam Routes
 * Routes for exam management (admin and teacher)
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateExam, validateId, validatePagination } = require('../middleware/validation');

// Teacher routes - get their own exams
router.get('/my-exams', verifyToken, authorize('teacher'), examController.getTeacherExams);

// Admin and Teacher routes
router.post('/', verifyToken, authorize('admin', 'teacher'), validateExam, examController.createExam);
router.get('/', verifyToken, authorize('admin'), validatePagination, examController.getAllExams);
router.get('/active/list', verifyToken, examController.getActiveExams);
router.get('/:id', verifyToken, validateId, examController.getExamById);
router.put('/:id', verifyToken, authorize('admin', 'teacher'), validateId, validateExam, examController.updateExam);
router.delete('/:id', verifyToken, authorize('admin', 'teacher'), validateId, examController.deleteExam);
router.get('/:id/statistics', verifyToken, authorize('admin', 'teacher'), validateId, examController.getExamStatistics);
router.get('/:id/attempts', verifyToken, authorize('admin', 'teacher'), validateId, validatePagination, examController.getExamAttempts);

module.exports = router;
