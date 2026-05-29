/**
 * Student Model
 * Handles all database operations related to students
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Student {
    /**
     * Find student by ID
     * @param {number} id - Student ID
     * @returns {Promise<Object|null>} Student object or null
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT s.*, u.email, u.role 
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = ?
            `;
            const students = await db.query(sql, [id]);
            return students[0] || null;
        } catch (error) {
            logger.error('Error in Student.findById:', error);
            throw error;
        }
    }

    /**
     * Find student by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Object|null>} Student object or null
     */
    static async findByUserId(userId) {
        try {
            const sql = `
                SELECT s.*, u.email, u.role 
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.user_id = ?
            `;
            const students = await db.query(sql, [userId]);
            return students[0] || null;
        } catch (error) {
            logger.error('Error in Student.findByUserId:', error);
            throw error;
        }
    }

    /**
     * Find student by roll number
     * @param {string} rollNumber - Roll number
     * @returns {Promise<Object|null>} Student object or null
     */
    static async findByRollNumber(rollNumber) {
        try {
            const sql = 'SELECT * FROM students WHERE roll_number = ?';
            const students = await db.query(sql, [rollNumber]);
            return students[0] || null;
        } catch (error) {
            logger.error('Error in Student.findByRollNumber:', error);
            throw error;
        }
    }

    /**
     * Create new student
     * @param {Object} studentData - Student data
     * @returns {Promise<number>} New student ID
     */
    static async create(studentData) {
        try {
            const { user_id, full_name, roll_number, department, semester, phone } = studentData;

            const sql = `
                INSERT INTO students (user_id, full_name, roll_number, department, semester, phone)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const result = await db.query(sql, [user_id, full_name, roll_number, department, semester, phone]);

            logger.info(`Student created: ${roll_number}`);
            return result.insertId;
        } catch (error) {
            logger.error('Error in Student.create:', error);
            throw error;
        }
    }

    /**
     * Update student
     * @param {number} id - Student ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    static async update(id, updates) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (key !== 'id' && key !== 'user_id') {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });

            values.push(id);

            const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(sql, values);

            return true;
        } catch (error) {
            logger.error('Error in Student.update:', error);
            throw error;
        }
    }

    /**
     * Get all students with pagination
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Students and pagination info
     */
    static async getAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const whereClauses = [];
            const params = [];

            if (filters.department) {
                whereClauses.push('s.department = ?');
                params.push(filters.department);
            }

            if (filters.semester) {
                whereClauses.push('s.semester = ?');
                params.push(filters.semester);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            const countSql = `SELECT COUNT(*) as total FROM students s ${whereClause}`;
            const dataSql = `
                SELECT s.*, u.email
                FROM students s
                JOIN users u ON s.user_id = u.id
                ${whereClause}
                ORDER BY s.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql, params);
            const students = await db.query(dataSql, [...params, limit, offset]);

            return {
                students,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Student.getAll:', error);
            throw error;
        }
    }

    /**
     * Delete student
     * @param {number} id - Student ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        try {
            const sql = 'DELETE FROM students WHERE id = ?';
            await db.query(sql, [id]);
            logger.info(`Student deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error('Error in Student.delete:', error);
            throw error;
        }
    }
}

module.exports = Student;
