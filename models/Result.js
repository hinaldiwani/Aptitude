/**
 * Result Model
 * Handles all database operations related to exam results
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Result {
    /**
     * Find result by ID
     * @param {number} id - Result ID
     * @returns {Promise<Object|null>} Result object or null
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT r.*, e.title as exam_title, s.full_name, s.roll_number
                FROM results r
                JOIN exams e ON r.exam_id = e.id
                JOIN students s ON r.student_id = s.id
                WHERE r.id = ?
            `;
            const results = await db.query(sql, [id]);
            return results[0] || null;
        } catch (error) {
            logger.error('Error in Result.findById:', error);
            throw error;
        }
    }

    /**
     * Find result by attempt ID
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<Object|null>} Result object or null
     */
    static async findByAttemptId(attemptId) {
        try {
            const sql = `
                SELECT r.*, e.title as exam_title, s.full_name, s.roll_number
                FROM results r
                JOIN exams e ON r.exam_id = e.id
                JOIN students s ON r.student_id = s.id
                WHERE r.attempt_id = ?
            `;
            const results = await db.query(sql, [attemptId]);
            return results[0] || null;
        } catch (error) {
            logger.error('Error in Result.findByAttemptId:', error);
            throw error;
        }
    }

    /**
     * Create new result
     * @param {Object} resultData - Result data
     * @returns {Promise<number>} New result ID
     */
    static async create(resultData) {
        try {
            const {
                attempt_id, exam_id, student_id, total_questions, attempted_questions,
                correct_answers, wrong_answers, marks_obtained, total_marks, percentage, result_status
            } = resultData;

            const sql = `
                INSERT INTO results (
                    attempt_id, exam_id, student_id, total_questions, attempted_questions,
                    correct_answers, wrong_answers, marks_obtained, total_marks, percentage, result_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await db.query(sql, [
                attempt_id, exam_id, student_id, total_questions, attempted_questions,
                correct_answers, wrong_answers, marks_obtained, total_marks, percentage, result_status
            ]);

            logger.info(`Result created for attempt ${attempt_id}`);
            return result.insertId;
        } catch (error) {
            logger.error('Error in Result.create:', error);
            throw error;
        }
    }

    /**
     * Get all results for a student
     * @param {number} studentId - Student ID
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Results and pagination info
     */
    static async getByStudentId(studentId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const countSql = 'SELECT COUNT(*) as total FROM results WHERE student_id = ?';
            const dataSql = `
                SELECT r.*, e.title as exam_title, e.total_marks as exam_total_marks
                FROM results r
                JOIN exams e ON r.exam_id = e.id
                WHERE r.student_id = ?
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql, [studentId]);
            const results = await db.query(dataSql, [studentId, limit, offset]);

            return {
                results,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Result.getByStudentId:', error);
            throw error;
        }
    }

    /**
     * Get all results for an exam
     * @param {number} examId - Exam ID
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Results and pagination info
     */
    static async getByExamId(examId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const countSql = 'SELECT COUNT(*) as total FROM results WHERE exam_id = ?';
            const dataSql = `
                SELECT r.*, s.full_name, s.roll_number, s.department
                FROM results r
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ?
                ORDER BY r.percentage DESC, r.created_at ASC
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql, [examId]);
            const results = await db.query(dataSql, [examId, limit, offset]);

            return {
                results,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Result.getByExamId:', error);
            throw error;
        }
    }

    /**
     * Calculate and update rankings for an exam
     * @param {number} examId - Exam ID
     * @returns {Promise<boolean>} Success status
     */
    static async calculateRankings(examId) {
        try {
            const sql = 'CALL calculate_rankings(?)';
            await db.query(sql, [examId]);
            logger.info(`Rankings calculated for exam ${examId}`);
            return true;
        } catch (error) {
            logger.error('Error in Result.calculateRankings:', error);
            throw error;
        }
    }

    /**
     * Get exam leaderboard
     * @param {number} examId - Exam ID
     * @param {number} limit - Number of top results
     * @returns {Promise<Array>} Top results
     */
    static async getLeaderboard(examId, limit = 10) {
        try {
            const sql = `
                SELECT r.*, s.full_name, s.roll_number, s.department
                FROM results r
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ?
                ORDER BY r.rank ASC
                LIMIT ?
            `;
            return await db.query(sql, [examId, limit]);
        } catch (error) {
            logger.error('Error in Result.getLeaderboard:', error);
            throw error;
        }
    }

    /**
     * Get student rank in exam
     * @param {number} examId - Exam ID
     * @param {number} studentId - Student ID
     * @returns {Promise<number|null>} Rank or null
     */
    static async getStudentRank(examId, studentId) {
        try {
            const sql = `
                SELECT rank FROM results 
                WHERE exam_id = ? AND student_id = ?
            `;
            const [result] = await db.query(sql, [examId, studentId]);
            return result ? result.rank : null;
        } catch (error) {
            logger.error('Error in Result.getStudentRank:', error);
            throw error;
        }
    }

    /**
     * Get exam analytics
     * @param {number} examId - Exam ID
     * @returns {Promise<Object>} Analytics data
     */
    static async getExamAnalytics(examId) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_attempts,
                    AVG(percentage) as average_percentage,
                    MAX(percentage) as highest_percentage,
                    MIN(percentage) as lowest_percentage,
                    AVG(marks_obtained) as average_marks,
                    COUNT(CASE WHEN result_status = 'pass' THEN 1 END) as pass_count,
                    COUNT(CASE WHEN result_status = 'fail' THEN 1 END) as fail_count,
                    (COUNT(CASE WHEN result_status = 'pass' THEN 1 END) * 100.0 / COUNT(*)) as pass_percentage
                FROM results
                WHERE exam_id = ?
            `;
            const [analytics] = await db.query(sql, [examId]);
            return analytics || null;
        } catch (error) {
            logger.error('Error in Result.getExamAnalytics:', error);
            throw error;
        }
    }

    /**
     * Delete result
     * @param {number} id - Result ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        try {
            const sql = 'DELETE FROM results WHERE id = ?';
            await db.query(sql, [id]);
            return true;
        } catch (error) {
            logger.error('Error in Result.delete:', error);
            throw error;
        }
    }
}

module.exports = Result;
