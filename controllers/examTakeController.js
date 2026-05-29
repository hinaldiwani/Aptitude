/**
 * Exam Taking Controller
 * Handles exam attempts, answer submission, and exam completion
 */

const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const Answer = require('../models/Answer');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { getClientIP } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Start exam
 * POST /api/exam-take/start
 */
const startExam = asyncHandler(async (req, res) => {
    const { exam_id } = req.body;

    // Get student
    const student = await Student.findByUserId(req.user.id);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found'
        });
    }

    // Verify exam exists and is active
    const exam = await Exam.findById(exam_id);
    if (!exam) {
        return res.status(404).json({
            success: false,
            message: 'Exam not found'
        });
    }

    const isActive = await Exam.isActive(exam_id);
    if (!isActive) {
        return res.status(400).json({
            success: false,
            message: 'Exam is not currently active'
        });
    }

    // Check if student has already attempted this exam
    const existingAttempt = await ExamAttempt.findByExamAndStudent(exam_id, student.id);
    if (existingAttempt) {
        return res.status(400).json({
            success: false,
            message: 'You have already attempted this exam'
        });
    }

    // Get questions (without answers)
    const questions = await Question.getByExamId(exam_id, false);
    if (questions.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No questions available for this exam'
        });
    }

    // Create exam attempt
    const attemptId = await ExamAttempt.create({
        exam_id,
        student_id: student.id,
        start_time: new Date(),
        ip_address: getClientIP(req)
    });

    logger.info(`Exam started: Student ${student.id}, Exam ${exam_id}, Attempt ${attemptId}`);

    res.json({
        success: true,
        message: 'Exam started successfully',
        data: {
            attemptId,
            exam: {
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                total_marks: exam.total_marks,
                question_count: questions.length
            },
            questions
        }
    });
});

/**
 * Get exam attempt details
 * GET /api/exam-take/attempt/:attemptId
 */
const getAttemptDetails = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
        return res.status(404).json({
            success: false,
            message: 'Exam attempt not found'
        });
    }

    // Verify student owns this attempt
    const student = await Student.findByUserId(req.user.id);
    if (attempt.student_id !== student.id) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access to exam attempt'
        });
    }

    // Check if already submitted
    if (attempt.is_submitted) {
        return res.status(400).json({
            success: false,
            message: 'Exam already submitted'
        });
    }

    // Get remaining time
    const remainingTime = await ExamAttempt.getRemainingTime(attemptId);

    // Get questions
    const questions = await Question.getByExamId(attempt.exam_id, false);

    // Get answered questions
    const answeredIds = await Answer.getAnsweredQuestionIds(attemptId);

    res.json({
        success: true,
        data: {
            attempt,
            questions,
            answeredQuestions: answeredIds,
            remainingTime
        }
    });
});

/**
 * Save answer (auto-save)
 * POST /api/exam-take/save-answer
 */
const saveAnswer = asyncHandler(async (req, res) => {
    const { attempt_id, question_id, selected_option } = req.body;

    // Verify attempt exists and belongs to student
    const attempt = await ExamAttempt.findById(attempt_id);
    if (!attempt) {
        return res.status(404).json({
            success: false,
            message: 'Exam attempt not found'
        });
    }

    const student = await Student.findByUserId(req.user.id);
    if (attempt.student_id !== student.id) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access to exam attempt'
        });
    }

    // Check if attempt is still valid
    if (attempt.is_submitted) {
        return res.status(400).json({
            success: false,
            message: 'Exam already submitted'
        });
    }

    const isValid = await ExamAttempt.isValid(attempt_id);
    if (!isValid) {
        // Auto-submit if time expired
        await submitExam({ params: { attemptId: attempt_id }, user: req.user }, res);
        return;
    }

    // Save answer
    await Answer.saveAnswer({
        attempt_id,
        question_id,
        selected_option
    });

    res.json({
        success: true,
        message: 'Answer saved successfully'
    });
});

/**
 * Submit exam
 * POST /api/exam-take/submit/:attemptId
 */
const submitExam = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;

    // Get attempt
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
        return res.status(404).json({
            success: false,
            message: 'Exam attempt not found'
        });
    }

    // Verify student owns this attempt
    const student = await Student.findByUserId(req.user.id);
    if (attempt.student_id !== student.id) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access to exam attempt'
        });
    }

    // Check if already submitted
    if (attempt.is_submitted) {
        return res.status(400).json({
            success: false,
            message: 'Exam already submitted'
        });
    }

    // Mark attempt as submitted
    await ExamAttempt.submit(attemptId);

    // Evaluate answers
    const evaluation = await Answer.evaluateAnswers(attemptId);

    // Get exam details
    const exam = await Exam.findById(attempt.exam_id);

    // Calculate result
    const percentage = ((evaluation.marks_obtained / exam.total_marks) * 100).toFixed(2);
    const resultStatus = evaluation.marks_obtained >= exam.passing_marks ? 'pass' : 'fail';

    // Create result
    const resultId = await Result.create({
        attempt_id: attemptId,
        exam_id: attempt.exam_id,
        student_id: student.id,
        total_questions: evaluation.total_questions,
        attempted_questions: evaluation.attempted_questions,
        correct_answers: evaluation.correct_answers,
        wrong_answers: evaluation.wrong_answers,
        marks_obtained: evaluation.marks_obtained,
        total_marks: exam.total_marks,
        percentage: parseFloat(percentage),
        result_status: resultStatus
    });

    // Calculate rankings
    await Result.calculateRankings(attempt.exam_id);

    // Get final result with rank
    const finalResult = await Result.findById(resultId);

    logger.info(`Exam submitted: Attempt ${attemptId}, Result ${resultId}`);

    res.json({
        success: true,
        message: 'Exam submitted successfully',
        data: finalResult
    });
});

/**
 * Get exam result
 * GET /api/exam-take/result/:attemptId
 */
const getExamResult = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;

    const result = await Result.findByAttemptId(attemptId);
    if (!result) {
        return res.status(404).json({
            success: false,
            message: 'Result not found'
        });
    }

    // Verify student owns this result
    const student = await Student.findByUserId(req.user.id);
    if (result.student_id !== student.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access to result'
        });
    }

    // Get detailed answers (with correct/incorrect marking)
    const answers = await Answer.getByAttemptId(attemptId);

    res.json({
        success: true,
        data: {
            result,
            answers
        }
    });
});

/**
 * Get student's exam history
 * GET /api/exam-take/history
 */
const getExamHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const student = await Student.findByUserId(req.user.id);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found'
        });
    }

    const attempts = await ExamAttempt.getByStudentId(student.id, page, limit);

    res.json({
        success: true,
        data: attempts.attempts,
        pagination: attempts.pagination
    });
});

module.exports = {
    startExam,
    getAttemptDetails,
    saveAnswer,
    submitExam,
    getExamResult,
    getExamHistory
};
