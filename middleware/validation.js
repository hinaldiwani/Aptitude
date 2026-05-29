/**
 * Validation Middleware
 * Input validation using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }

    next();
};

/**
 * User registration validation
 */
const validateRegistration = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
        .optional()
        .isIn(['admin', 'student'])
        .withMessage('Role must be admin or student'),
    body('full_name')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Full name must be between 2 and 255 characters'),
    handleValidationErrors
];

/**
 * User login validation
 */
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Exam creation validation
 */
const validateExam = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Exam title is required')
        .isLength({ max: 255 })
        .withMessage('Title must not exceed 255 characters'),
    body('description')
        .optional()
        .trim(),
    body('duration')
        .isInt({ min: 1, max: 300 })
        .withMessage('Duration must be between 1 and 300 minutes'),
    body('total_marks')
        .isInt({ min: 1 })
        .withMessage('Total marks must be a positive integer'),
    body('passing_marks')
        .isInt({ min: 0 })
        .withMessage('Passing marks must be a non-negative integer')
        .custom((value, { req }) => {
            if (value > req.body.total_marks) {
                throw new Error('Passing marks cannot exceed total marks');
            }
            return true;
        }),
    body('start_time')
        .isISO8601()
        .withMessage('Valid start time is required')
        .toDate(),
    body('end_time')
        .isISO8601()
        .withMessage('Valid end time is required')
        .toDate()
        .custom((value, { req }) => {
            if (value <= req.body.start_time) {
                throw new Error('End time must be after start time');
            }
            return true;
        }),
    handleValidationErrors
];

/**
 * Question creation validation
 */
const validateQuestion = [
    body('exam_id')
        .isInt({ min: 1 })
        .withMessage('Valid exam ID is required'),
    body('question_text')
        .trim()
        .notEmpty()
        .withMessage('Question text is required'),
    body('option_a')
        .trim()
        .notEmpty()
        .withMessage('Option A is required'),
    body('option_b')
        .trim()
        .notEmpty()
        .withMessage('Option B is required'),
    body('option_c')
        .trim()
        .notEmpty()
        .withMessage('Option C is required'),
    body('option_d')
        .trim()
        .notEmpty()
        .withMessage('Option D is required'),
    body('correct_option')
        .isIn(['A', 'B', 'C', 'D'])
        .withMessage('Correct option must be A, B, C, or D'),
    body('marks')
        .isInt({ min: 1 })
        .withMessage('Marks must be a positive integer'),
    body('question_order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Question order must be a non-negative integer'),
    handleValidationErrors
];

/**
 * Answer submission validation
 */
const validateAnswer = [
    body('attempt_id')
        .isInt({ min: 1 })
        .withMessage('Valid attempt ID is required'),
    body('question_id')
        .isInt({ min: 1 })
        .withMessage('Valid question ID is required'),
    body('selected_option')
        .isIn(['A', 'B', 'C', 'D'])
        .withMessage('Selected option must be A, B, C, or D'),
    handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID is required'),
    handleValidationErrors
];

/**
 * Pagination query validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    handleValidationErrors
];

/**
 * Student profile validation
 */
const validateStudentProfile = [
    body('full_name')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Full name must be between 2 and 255 characters'),
    body('roll_number')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Roll number must not exceed 50 characters'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Department must not exceed 100 characters'),
    body('semester')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('Semester must be between 1 and 12'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone must be a valid 10-digit number'),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateExam,
    validateQuestion,
    validateAnswer,
    validateId,
    validatePagination,
    validateStudentProfile,
    handleValidationErrors
};
