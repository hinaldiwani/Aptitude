/**
 * Exam Model
 * Handles all database operations related to exams
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Exam {
    /**
     * Find exam by ID
     * @param {number} id - Exam ID
     * @returns {Promise<Object|null>} Exam object or null
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT e.*, 
                    COUNT(q.id) as question_count,
                    u.email as created_by_email
                FROM exams e
                LEFT JOIN questions q ON e.id = q.exam_id
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.id = ?
                GROUP BY e.id
            `;
            const exams = await db.query(sql, [id]);
            return exams[0] || null;
        } catch (error) {
            logger.error('Error in Exam.findById:', error);
            throw error;
        }
    }

    /**
     * Create new exam
     * @param {Object} examData - Exam data
     * @returns {Promise<number>} New exam ID
     */
    static async create(examData) {
        try {
            const { title, description, duration, total_marks, passing_marks, start_time, end_time, created_by } = examData;

            const sql = `
                INSERT INTO exams (title, description, duration, total_marks, passing_marks, start_time, end_time, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await db.query(sql, [
                title, description, duration, total_marks, passing_marks, start_time, end_time, created_by
            ]);

            logger.info(`Exam created: ${title}`);
            return result.insertId;
        } catch (error) {
            logger.error('Error in Exam.create:', error);
            throw error;
        }
    }

    /**
     * Update exam
     * @param {number} id - Exam ID
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

            const sql = `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(sql, values);

            return true;
        } catch (error) {
            logger.error('Error in Exam.update:', error);
            throw error;
        }
    }

    /**
     * Delete exam
     * @param {number} id - Exam ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        try {
            const sql = 'DELETE FROM exams WHERE id = ?';
            await db.query(sql, [id]);
            logger.info(`Exam deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error('Error in Exam.delete:', error);
            throw error;
        }
    }

    /**
     * Get all exams with pagination
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Exams and pagination info
     */
    static async getAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const whereClauses = [];
            const params = [];

            if (filters.is_active !== undefined) {
                whereClauses.push('e.is_active = ?');
                params.push(filters.is_active);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            const countSql = `SELECT COUNT(*) as total FROM exams e ${whereClause}`;
            const dataSql = `
                SELECT e.*, 
                    COUNT(q.id) as question_count,
                    u.email as created_by_email
                FROM exams e
                LEFT JOIN questions q ON e.id = q.exam_id
                LEFT JOIN users u ON e.created_by = u.id
                ${whereClause}
                GROUP BY e.id
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql, params);
            const exams = await db.query(dataSql, [...params, limit, offset]);

            return {
                exams,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Exam.getAll:', error);
            throw error;
        }
    }

    /**
     * Get active exams (currently available)
     * @returns {Promise<Array>} Active exams
     */
    static async getActiveExams() {
        try {
            const sql = `
                SELECT e.*, 
                    COUNT(q.id) as question_count
                FROM exams e
                LEFT JOIN questions q ON e.id = q.exam_id
                WHERE e.is_active = TRUE 
                    AND e.start_time <= NOW() 
                    AND e.end_time >= NOW()
                GROUP BY e.id
                ORDER BY e.start_time ASC
            `;
            return await db.query(sql);
        } catch (error) {
            logger.error('Error in Exam.getActiveExams:', error);
            throw error;
        }
    }

    /**
     * Get available exams for student (not attempted)
     * @param {number} studentId - Student ID
     * @returns {Promise<Array>} Available exams
     */
    static async getAvailableForStudent(studentId) {
        try {
            const sql = `
                SELECT e.*, 
                    COUNT(q.id) as question_count
                FROM exams e
                LEFT JOIN questions q ON e.id = q.exam_id
                LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.student_id = ?
                WHERE e.is_active = TRUE 
                    AND e.start_time <= NOW() 
                    AND e.end_time >= NOW()
                    AND ea.id IS NULL
                GROUP BY e.id
                ORDER BY e.start_time ASC
            `;
            return await db.query(sql, [studentId]);
        } catch (error) {
            logger.error('Error in Exam.getAvailableForStudent:', error);
            throw error;
        }
    }

    /**
     * Check if exam is active
     * @param {number} examId - Exam ID
     * @returns {Promise<boolean>} Active status
     */
    static async isActive(examId) {
        try {
            const sql = `
                SELECT id FROM exams
                WHERE id = ? 
                    AND is_active = TRUE 
                    AND start_time <= NOW() 
                    AND end_time >= NOW()
            `;
            const result = await db.query(sql, [examId]);
            return result.length > 0;
        } catch (error) {
            logger.error('Error in Exam.isActive:', error);
            throw error;
        }
    }

    /**
     * Get exam statistics
     * @param {number} examId - Exam ID
     * @returns {Promise<Object>} Exam statistics
     */
    static async getStatistics(examId) {
        try {
            const sql = `
                SELECT 
                    COUNT(DISTINCT ea.student_id) as total_attempts,
                    AVG(r.percentage) as average_percentage,
                    MAX(r.percentage) as highest_percentage,
                    MIN(r.percentage) as lowest_percentage,
                    COUNT(CASE WHEN r.result_status = 'pass' THEN 1 END) as passed_count,
                    COUNT(CASE WHEN r.result_status = 'fail' THEN 1 END) as failed_count
                FROM exam_attempts ea
                LEFT JOIN results r ON ea.id = r.attempt_id
                WHERE ea.exam_id = ? AND ea.is_submitted = TRUE
            `;
            const [stats] = await db.query(sql, [examId]);
            return stats || null;
        } catch (error) {
            logger.error('Error in Exam.getStatistics:', error);
            throw error;
        }
    }
}

module.exports = Exam;
