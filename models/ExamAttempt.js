/**
 * ExamAttempt Model
 * Handles all database operations related to exam attempts
 */

const db = require('../config/database');
const logger = require('../config/logger');

class ExamAttempt {
    /**
     * Find attempt by ID
     * @param {number} id - Attempt ID
     * @returns {Promise<Object|null>} Attempt object or null
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT ea.*, e.title as exam_title, e.duration, s.full_name
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                JOIN students s ON ea.student_id = s.id
                WHERE ea.id = ?
            `;
            const attempts = await db.query(sql, [id]);
            return attempts[0] || null;
        } catch (error) {
            logger.error('Error in ExamAttempt.findById:', error);
            throw error;
        }
    }

    /**
     * Check if student has already attempted exam
     * @param {number} examId - Exam ID
     * @param {number} studentId - Student ID
     * @returns {Promise<Object|null>} Attempt object or null
     */
    static async findByExamAndStudent(examId, studentId) {
        try {
            const sql = `
                SELECT * FROM exam_attempts 
                WHERE exam_id = ? AND student_id = ?
            `;
            const attempts = await db.query(sql, [examId, studentId]);
            return attempts[0] || null;
        } catch (error) {
            logger.error('Error in ExamAttempt.findByExamAndStudent:', error);
            throw error;
        }
    }

    /**
     * Create new exam attempt
     * @param {Object} attemptData - Attempt data
     * @returns {Promise<number>} New attempt ID
     */
    static async create(attemptData) {
        try {
            const { exam_id, student_id, start_time, ip_address } = attemptData;

            const sql = `
                INSERT INTO exam_attempts (exam_id, student_id, start_time, ip_address)
                VALUES (?, ?, ?, ?)
            `;

            const result = await db.query(sql, [exam_id, student_id, start_time, ip_address]);

            logger.info(`Exam attempt started: Student ${student_id}, Exam ${exam_id}`);
            return result.insertId;
        } catch (error) {
            logger.error('Error in ExamAttempt.create:', error);
            throw error;
        }
    }

    /**
     * Update attempt
     * @param {number} id - Attempt ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    static async update(id, updates) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });

            values.push(id);

            const sql = `UPDATE exam_attempts SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(sql, values);

            return true;
        } catch (error) {
            logger.error('Error in ExamAttempt.update:', error);
            throw error;
        }
    }

    /**
     * Submit exam attempt
     * @param {number} id - Attempt ID
     * @returns {Promise<boolean>} Success status
     */
    static async submit(id) {
        try {
            const sql = `
                UPDATE exam_attempts 
                SET is_submitted = TRUE, end_time = NOW() 
                WHERE id = ?
            `;
            await db.query(sql, [id]);
            logger.info(`Exam attempt submitted: ${id}`);
            return true;
        } catch (error) {
            logger.error('Error in ExamAttempt.submit:', error);
            throw error;
        }
    }

    /**
     * Get all attempts for a student
     * @param {number} studentId - Student ID
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Attempts and pagination info
     */
    static async getByStudentId(studentId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const countSql = 'SELECT COUNT(*) as total FROM exam_attempts WHERE student_id = ?';
            const dataSql = `
                SELECT ea.*, e.title as exam_title
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                WHERE ea.student_id = ?
                ORDER BY ea.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql, [studentId]);
            const attempts = await db.query(dataSql, [studentId, limit, offset]);

            return {
                attempts,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in ExamAttempt.getByStudentId:', error);
            throw error;
        }
    }

    /**
     * Get all attempts for an exam
     * @param {number} examId - Exam ID
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Attempts and pagination info
     */
    static async getByExamId(examId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const countSql = 'SELECT COUNT(*) as total FROM exam_attempts WHERE exam_id = ?';
            const dataSql = `
                SELECT ea.*, s.full_name, s.roll_number
                FROM exam_attempts ea
                JOIN students s ON ea.student_id = s.id
                WHERE ea.exam_id = ?
                ORDER BY ea.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql, [examId]);
            const attempts = await db.query(dataSql, [examId, limit, offset]);

            return {
                attempts,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in ExamAttempt.getByExamId:', error);
            throw error;
        }
    }

    /**
     * Check if attempt is still valid (within time limit)
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<boolean>} Valid status
     */
    static async isValid(attemptId) {
        try {
            const sql = `
                SELECT ea.start_time, e.duration
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                WHERE ea.id = ? AND ea.is_submitted = FALSE
            `;
            const [attempt] = await db.query(sql, [attemptId]);

            if (!attempt) return false;

            const startTime = new Date(attempt.start_time);
            const endTime = new Date(startTime.getTime() + attempt.duration * 60000);
            const now = new Date();

            return now < endTime;
        } catch (error) {
            logger.error('Error in ExamAttempt.isValid:', error);
            throw error;
        }
    }

    /**
     * Get remaining time for attempt
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<number>} Remaining seconds
     */
    static async getRemainingTime(attemptId) {
        try {
            const sql = `
                SELECT ea.start_time, e.duration
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                WHERE ea.id = ?
            `;
            const [attempt] = await db.query(sql, [attemptId]);

            if (!attempt) return 0;

            const startTime = new Date(attempt.start_time);
            const endTime = new Date(startTime.getTime() + attempt.duration * 60000);
            const now = new Date();

            const remainingMs = endTime - now;
            return Math.max(0, Math.floor(remainingMs / 1000));
        } catch (error) {
            logger.error('Error in ExamAttempt.getRemainingTime:', error);
            throw error;
        }
    }
}

module.exports = ExamAttempt;
