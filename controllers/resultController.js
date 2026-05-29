/**
 * Result Controller
 * Handles result viewing and analytics
 */

const Result = require('../models/Result');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Get student results
 * GET /api/results/student/:studentId
 */
const getStudentResults = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Verify access (student can only view their own results)
    if (req.user.role === 'student') {
        const student = await Student.findByUserId(req.user.id);
        if (student.id !== parseInt(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to student results'
            });
        }
    }

    const results = await Result.getByStudentId(studentId, page, limit);

    res.json({
        success: true,
        data: results.results,
        pagination: results.pagination
    });
});

/**
 * Get exam results (all students)
 * GET /api/results/exam/:examId
 */
const getExamResults = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const results = await Result.getByExamId(examId, page, limit);

    res.json({
        success: true,
        data: results.results,
        pagination: results.pagination
    });
});

/**
 * Get exam leaderboard
 * GET /api/results/exam/:examId/leaderboard
 */
const getExamLeaderboard = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await Result.getLeaderboard(examId, limit);

    res.json({
        success: true,
        data: leaderboard
    });
});

/**
 * Get exam analytics
 * GET /api/results/exam/:examId/analytics
 */
const getExamAnalytics = asyncHandler(async (req, res) => {
    const { examId } = req.params;

    const analytics = await Result.getExamAnalytics(examId);

    res.json({
        success: true,
        data: analytics
    });
});

/**
 * Get student rank in exam
 * GET /api/results/exam/:examId/rank/:studentId
 */
const getStudentRank = asyncHandler(async (req, res) => {
    const { examId, studentId } = req.params;

    // Verify access
    if (req.user.role === 'student') {
        const student = await Student.findByUserId(req.user.id);
        if (student.id !== parseInt(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }
    }

    const rank = await Result.getStudentRank(examId, studentId);

    if (rank === null) {
        return res.status(404).json({
            success: false,
            message: 'Result not found'
        });
    }

    res.json({
        success: true,
        data: { rank }
    });
});

/**
 * Get my results (current student)
 * GET /api/results/my-results
 */
const getMyResults = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const student = await Student.findByUserId(req.user.id);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found'
        });
    }

    const results = await Result.getByStudentId(student.id, page, limit);

    res.json({
        success: true,
        data: results.results,
        pagination: results.pagination
    });
});

/**
 * Delete result
 * DELETE /api/results/:id
 */
const deleteResult = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Result.findById(id);
    if (!result) {
        return res.status(404).json({
            success: false,
            message: 'Result not found'
        });
    }

    await Result.delete(id);

    logger.info(`Result deleted: ${id} by user ${req.user.id}`);

    res.json({
        success: true,
        message: 'Result deleted successfully'
    });
});

/**
 * Get result by attempt ID
 * GET /api/results/attempt/:attemptId
 */
const getResultByAttempt = asyncHandler(async (req, res) => {
    const attemptId = parseInt(req.params.attemptId);

    const result = await Result.findByAttemptId(attemptId);

    if (!result) {
        return res.status(404).json({
            success: false,
            message: 'Result not found'
        });
    }

    // Check if user has permission to view this result
    if (req.user.role === 'student') {
        const attempt = await ExamAttempt.findById(attemptId);
        if (attempt.student_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    }

    res.json({
        success: true,
        data: result
    });
});

/**
 * Get detailed result with answers
 * GET /api/results/attempt/:attemptId/details
 */
const getResultDetails = asyncHandler(async (req, res) => {
    const attemptId = parseInt(req.params.attemptId);

    // Check if user has permission
    if (req.user.role === 'student') {
        const attempt = await ExamAttempt.findById(attemptId);
        if (attempt.student_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    }

    const details = await Result.getDetailedResult(attemptId);

    if (!details || details.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Result details not found'
        });
    }

    res.json({
        success: true,
        data: details
    });
});

module.exports = {
    getStudentResults,
    getExamResults,
    getExamLeaderboard,
    getExamAnalytics,
    getStudentRank,
    getMyResults,
    getResultByAttempt,
    getResultDetails,
    deleteResult
};
