/**
 * Question Controller
 * Handles question CRUD operations and bulk upload
 */

const Question = require('../models/Question');
const Exam = require('../models/Exam');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseQuestionsCSV, validateCSVFile, deleteFile, generateCSVTemplate } = require('../services/csvService');
const logger = require('../config/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for CSV upload
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.csv`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

/**
 * Create single question
 * POST /api/questions
 */
const createQuestion = asyncHandler(async (req, res) => {
    const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order } = req.body;

    // Verify exam exists
    const exam = await Exam.findById(exam_id);
    if (!exam) {
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    // Get next question order if not provided
    const order = question_order || (await Question.getCountByExamId(exam_id)) + 1;

    const questionId = await Question.create({
        exam_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks,
        question_order: order
    });

    logger.info(`Question created for exam ${exam_id}`);

    res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: { questionId }
    });
});

/**
 * Get questions for an exam
 * GET /api/questions/exam/:examId
 */
const getQuestionsByExam = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const includeAnswers = req.user.role === 'admin';

    const questions = await Question.getByExamId(examId, includeAnswers);

    res.json({
        success: true,
        data: questions
    });
});

/**
 * Get single question
 * GET /api/questions/:id
 */
const getQuestionById = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
        return res.status(404).json({
            success: false,
            message: 'Question not found'
        });
    }

    // Hide correct answer if student
    if (req.user.role !== 'admin') {
        delete question.correct_option;
    }

    res.json({
        success: true,
        data: question
    });
});

/**
 * Update question
 * PUT /api/questions/:id
 */
const updateQuestion = asyncHandler(async (req, res) => {
    const { question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
        return res.status(404).json({
            success: false,
            message: 'Question not found'
        });
    }

    await Question.update(req.params.id, {
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks,
        question_order
    });

    logger.info(`Question updated: ${req.params.id}`);

    res.json({
        success: true,
        message: 'Question updated successfully'
    });
});

/**
 * Delete question
 * DELETE /api/questions/:id
 */
const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        return res.status(404).json({
            success: false,
            message: 'Question not found'
        });
    }

    await Question.delete(req.params.id);

    logger.info(`Question deleted: ${req.params.id}`);

    res.json({
        success: true,
        message: 'Question deleted successfully'
    });
});

/**
 * Bulk upload questions via CSV
 * POST /api/questions/bulk-upload
 */
const bulkUploadQuestions = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const { exam_id } = req.body;

    // Verify exam exists
    const exam = await Exam.findById(exam_id);
    if (!exam) {
        deleteFile(req.file.path);
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    try {
        // Parse CSV
        const { questions, errors } = await parseQuestionsCSV(req.file.path);

        if (questions.length === 0) {
            deleteFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'No valid questions found in CSV',
                errors
            });
        }

        // Add exam_id to all questions
        const questionsWithExamId = questions.map(q => ({
            ...q,
            exam_id: parseInt(exam_id)
        }));

        // Insert questions
        await Question.createBulk(questionsWithExamId);

        // Delete uploaded file
        deleteFile(req.file.path);

        logger.info(`Bulk uploaded ${questions.length} questions to exam ${exam_id}`);

        res.json({
            success: true,
            message: `Successfully uploaded ${questions.length} questions`,
            data: {
                uploaded: questions.length,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    } catch (error) {
        deleteFile(req.file.path);
        throw error;
    }
});

/**
 * Download CSV template
 * GET /api/questions/csv-template
 */
const downloadCSVTemplate = asyncHandler(async (req, res) => {
    const template = generateCSVTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=questions_template.csv');
    res.send(template);
});

module.exports = {
    createQuestion,
    getQuestionsByExam,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    bulkUploadQuestions,
    downloadCSVTemplate,
    upload
};
