/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

const User = require('../models/User');
const Student = require('../models/Student');
const { generateToken } = require('../utils/jwtService');
const { getClientIP } = require('../utils/helpers');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
    const { email, password, role, full_name, roll_number, department, semester, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
        });
    }

    // Check if roll number already exists (for students)
    if (role === 'student' && roll_number) {
        const existingStudent = await Student.findByRollNumber(roll_number);
        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: 'Roll number already exists'
            });
        }
    }

    // Create user
    const userId = await User.create({ email, password, role: role || 'student' });

    // Create student profile if role is student
    if (role === 'student' || !role) {
        await Student.create({
            user_id: userId,
            full_name,
            roll_number,
            department,
            semester,
            phone
        });
    }

    // Generate JWT token
    const token = generateToken({ id: userId, email, role: role || 'student' });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            userId,
            email,
            role: role || 'student',
            token
        }
    });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ip = getClientIP(req);

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
        logger.warn(`Login attempt with invalid email: ${email} from IP: ${ip}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Check if account is locked
    if (User.isAccountLocked(user)) {
        const lockTime = new Date(user.lock_until).toLocaleString();
        return res.status(423).json({
            success: false,
            message: `Account is locked until ${lockTime}. Too many failed login attempts.`
        });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
        // Increment login attempts
        await User.incrementLoginAttempts(user.id);

        // Check if should lock account
        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5);
        if (user.login_attempts + 1 >= maxAttempts) {
            const lockTime = parseInt(process.env.LOCK_TIME || 15);
            await User.lockAccount(user.id, lockTime);
            logger.warn(`Account locked due to failed attempts: ${email}`);
        }

        logger.warn(`Failed login attempt: ${email} from IP: ${ip}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Check if account is active
    if (!user.is_active) {
        return res.status(403).json({
            success: false,
            message: 'Account is inactive. Please contact administrator.'
        });
    }

    // Reset login attempts on successful login
    await User.resetLoginAttempts(user.id);

    // Get student details if student
    let studentDetails = null;
    if (user.role === 'student') {
        studentDetails = await Student.findByUserId(user.id);
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Set token in cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    logger.info(`User logged in: ${email}`);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            student: studentDetails,
            token
        }
    });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token');

    logger.info(`User logged out: ${req.user?.email || 'Unknown'}`);

    res.json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    let studentDetails = null;
    let teacherDetails = null;
    let statistics = null;

    if (user.role === 'student') {
        studentDetails = await Student.findByUserId(user.id);
    } else if (user.role === 'teacher') {
        const Teacher = require('../models/Teacher');
        teacherDetails = await Teacher.findByUserId(user.id);
        statistics = await Teacher.getStatistics(user.id);
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            student_profile: studentDetails,
            teacher_profile: teacherDetails,
            statistics: statistics
        }
    });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { full_name, roll_number, department, semester, phone } = req.body;

    // Get student by user ID
    const student = await Student.findByUserId(req.user.id);

    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found'
        });
    }

    // Update student profile
    await Student.update(student.id, {
        full_name,
        roll_number,
        department,
        semester,
        phone
    });

    // Get updated student details
    const updatedStudent = await Student.findById(student.id);

    logger.info(`Profile updated: ${req.user.email}`);

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedStudent
    });
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.user.id);

    // Verify current password
    const isPasswordValid = await User.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Hash and update new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || 10));

    await User.update(user.id, { password: hashedPassword });

    logger.info(`Password changed: ${req.user.email}`);

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword
};
