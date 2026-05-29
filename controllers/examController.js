/**
 * Exam Controller
 * Handles exam CRUD operations and exam management
 */

const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Create new exam
 * POST /api/exams
 */
const createExam = asyncHandler(async (req, res) => {
    const { title, description, duration, total_marks, passing_marks, start_time, end_time } = req.body;

    const examId = await Exam.create({
        title,
        description,
        duration,
        total_marks,
        passing_marks,
        start_time,
        end_time,
        created_by: req.user.id
    });

    logger.info(`Exam created: ${title} by user ${req.user.id}`);

    res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        data: { examId }
    });
});

/**
 * Get all exams
 * GET /api/exams
 */
const getAllExams = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === 'true';
    }

    const result = await Exam.getAll(page, limit, filters);

    res.json({
        success: true,
        data: result.exams,
        pagination: result.pagination
    });
});

/**
 * Get exam by ID
 * GET /api/exams/:id
 */
const getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    res.json({
        success: true,
        data: exam
    });
});

/**
 * Update exam
 * PUT /api/exams/:id
 */
const updateExam = asyncHandler(async (req, res) => {
    const { title, description, duration, total_marks, passing_marks, start_time, end_time, is_active } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    await Exam.update(req.params.id, {
        title,
        description,
        duration,
        total_marks,
        passing_marks,
        start_time,
        end_time,
        is_active
    });

    logger.info(`Exam updated: ${req.params.id} by user ${req.user.id}`);

    res.json({
        success: true,
        message: 'Exam updated successfully'
    });
});

/**
 * Delete exam
 * DELETE /api/exams/:id
 */
const deleteExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    await Exam.delete(req.params.id);

    logger.info(`Exam deleted: ${req.params.id} by user ${req.user.id}`);

    res.json({
        success: true,
        message: 'Exam deleted successfully'
    });
});

/**
 * Get active exams (for students)
 * GET /api/exams/active/list
 */
const getActiveExams = asyncHandler(async (req, res) => {
    const student = await Student.findByUserId(req.user.id);

    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found'
        });
    }

    const exams = await Exam.getAvailableForStudent(student.id);

    res.json({
        success: true,
        data: exams
    });
});

/**
 * Get exam statistics
 * GET /api/exams/:id/statistics
 */
const getExamStatistics = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    const stats = await Exam.getStatistics(req.params.id);

    res.json({
        success: true,
        data: stats
    });
});

/**
 * Get exam attempts
 * GET /api/exams/:id/attempts
 */
const getExamAttempts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await ExamAttempt.getByExamId(req.params.id, page, limit);

    res.json({
        success: true,
        data: result.attempts,
        pagination: result.pagination
    });
});

/**
 * Get teacher's own exams
 * GET /api/exams/my-exams
 */
const getTeacherExams = asyncHandler(async (req, res) => {
    const Teacher = require('../models/Teacher');

    // Get teacher's exams with statistics
    const exams = await Teacher.getExams(req.user.id);

    res.json({
        success: true,
        data: exams
    });
});

module.exports = {
    createExam,
    getAllExams,
    getTeacherExams,
    getExamById,
    updateExam,
    deleteExam,
    getActiveExams,
    getExamStatistics,
    getExamAttempts
};
