/**
 * Teacher Model
 * Handles teacher-specific database operations
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Teacher {
    /**
     * Create a new teacher profile
     * @param {Object} teacherData - Teacher information
     * @returns {Promise<Object>} Created teacher
     */
    static async create(teacherData) {
        const { user_id, full_name, employee_id, department, subject, phone } = teacherData;

        const sql = `
            INSERT INTO teachers (user_id, full_name, employee_id, department, subject, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        try {
            const result = await db.query(sql, [user_id, full_name, employee_id, department, subject, phone]);
            logger.info(`Teacher profile created for user_id: ${user_id}`);
            return await this.findById(result.insertId);
        } catch (error) {
            logger.error('Error creating teacher profile:', error);
            throw error;
        }
    }

    /**
     * Find teacher by ID
     * @param {number} id - Teacher ID
     * @returns {Promise<Object>} Teacher data
     */
    static async findById(id) {
        const sql = 'SELECT * FROM teachers WHERE id = ?';
        const teachers = await db.query(sql, [id]);
        return teachers[0] || null;
    }

    /**
     * Find teacher by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Teacher data
     */
    static async findByUserId(userId) {
        const sql = `
            SELECT t.*, u.email, u.role 
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id = ?
        `;
        const teachers = await db.query(sql, [userId]);
        return teachers[0] || null;
    }

    /**
     * Find teacher by employee ID
     * @param {string} employeeId - Employee ID
     * @returns {Promise<Object>} Teacher data
     */
    static async findByEmployeeId(employeeId) {
        const sql = 'SELECT * FROM teachers WHERE employee_id = ?';
        const teachers = await db.query(sql, [employeeId]);
        return teachers[0] || null;
    }

    /**
     * Get all teachers
     * @param {Object} options - Pagination options
     * @returns {Promise<Array>} List of teachers
     */
    static async getAll(options = {}) {
        const { page = 1, limit = 10, department } = options;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT t.*, u.email, u.is_active
            FROM teachers t
            JOIN users u ON t.user_id = u.id
        `;

        const params = [];

        if (department) {
            sql += ' WHERE t.department = ?';
            params.push(department);
        }

        sql += ' ORDER BY t.full_name LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await db.query(sql, params);
    }

    /**
     * Update teacher profile
     * @param {number} id - Teacher ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated teacher
     */
    static async update(id, updates) {
        const allowedFields = ['full_name', 'employee_id', 'department', 'subject', 'phone'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);
        const sql = `UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`;

        try {
            await db.query(sql, values);
            logger.info(`Teacher profile updated: ${id}`);
            return await this.findById(id);
        } catch (error) {
            logger.error('Error updating teacher profile:', error);
            throw error;
        }
    }

    /**
     * Get teacher statistics
     * @param {number} userId - User ID of teacher
     * @returns {Promise<Object>} Teacher statistics
     */
    static async getStatistics(userId) {
        const sql = `
            SELECT 
                COUNT(DISTINCT e.id) as total_exams,
                COUNT(DISTINCT q.id) as total_questions,
                COUNT(DISTINCT ea.id) as total_attempts,
                COUNT(DISTINCT CASE WHEN ea.status = 'completed' THEN ea.id END) as completed_attempts
            FROM users u
            LEFT JOIN exams e ON u.id = e.created_by
            LEFT JOIN questions q ON e.id = q.exam_id
            LEFT JOIN exam_attempts ea ON e.id = ea.exam_id
            WHERE u.id = ?
        `;

        const results = await db.query(sql, [userId]);
        return results[0] || { total_exams: 0, total_questions: 0, total_attempts: 0, completed_attempts: 0 };
    }

    /**
     * Get teacher's exams
     * @param {number} userId - User ID of teacher
     * @returns {Promise<Array>} List of exams
     */
    static async getExams(userId) {
        const sql = `
            SELECT 
                e.*,
                COUNT(DISTINCT q.id) as question_count,
                COUNT(DISTINCT ea.id) as attempt_count
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            LEFT JOIN exam_attempts ea ON e.id = ea.exam_id
            WHERE e.created_by = ?
            GROUP BY e.id
            ORDER BY e.created_at DESC
        `;

        return await db.query(sql, [userId]);
    }

    /**
     * Delete teacher
     * @param {number} id - Teacher ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const sql = 'DELETE FROM teachers WHERE id = ?';

        try {
            await db.query(sql, [id]);
            logger.info(`Teacher deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error('Error deleting teacher:', error);
            throw error;
        }
    }
}

module.exports = Teacher;
