/**
 * Question Routes
 * Routes for question management (admin and teacher)
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateQuestion, validateId } = require('../middleware/validation');

// Admin and Teacher routes
router.post('/', verifyToken, authorize('admin', 'teacher'), validateQuestion, questionController.createQuestion);
router.get('/exam/:examId', verifyToken, validateId, questionController.getQuestionsByExam);
router.get('/csv-template', verifyToken, authorize('admin', 'teacher'), questionController.downloadCSVTemplate);
router.post('/bulk-upload', verifyToken, authorize('admin', 'teacher'), questionController.upload.single('file'), questionController.bulkUploadQuestions);
router.get('/:id', verifyToken, validateId, questionController.getQuestionById);
router.put('/:id', verifyToken, authorize('admin', 'teacher'), validateId, validateQuestion, questionController.updateQuestion);
router.delete('/:id', verifyToken, authorize('admin', 'teacher'), validateId, questionController.deleteQuestion);

module.exports = router;
