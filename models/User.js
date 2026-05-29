/**
 * User Model
 * Handles all database operations related to users
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

class User {
    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} User object or null
     */
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM users WHERE id = ?';
            const users = await db.query(sql, [id]);
            return users[0] || null;
        } catch (error) {
            logger.error('Error in User.findById:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByEmail(email) {
        try {
            const sql = 'SELECT * FROM users WHERE email = ?';
            const users = await db.query(sql, [email]);
            return users[0] || null;
        } catch (error) {
            logger.error('Error in User.findByEmail:', error);
            throw error;
        }
    }

    /**
     * Create new user
     * @param {Object} userData - User data {email, password, role}
     * @returns {Promise<number>} New user ID
     */
    static async create(userData) {
        try {
            const { email, password, role } = userData;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

            const sql = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
            const result = await db.query(sql, [email, hashedPassword, role]);

            logger.info(`User created: ${email}`);
            return result.insertId;
        } catch (error) {
            logger.error('Error in User.create:', error);
            throw error;
        }
    }

    /**
     * Update user
     * @param {number} id - User ID
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

            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(sql, values);

            return true;
        } catch (error) {
            logger.error('Error in User.update:', error);
            throw error;
        }
    }

    /**
     * Verify password
     * @param {string} plainPassword - Plain text password
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} Match status
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Increment login attempts
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    static async incrementLoginAttempts(userId) {
        try {
            const sql = 'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?';
            await db.query(sql, [userId]);
        } catch (error) {
            logger.error('Error in User.incrementLoginAttempts:', error);
            throw error;
        }
    }

    /**
     * Reset login attempts
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    static async resetLoginAttempts(userId) {
        try {
            const sql = 'UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = ?';
            await db.query(sql, [userId]);
        } catch (error) {
            logger.error('Error in User.resetLoginAttempts:', error);
            throw error;
        }
    }

    /**
     * Lock user account
     * @param {number} userId - User ID
     * @param {number} minutes - Lock duration in minutes
     * @returns {Promise<void>}
     */
    static async lockAccount(userId, minutes) {
        try {
            const lockUntil = new Date(Date.now() + minutes * 60000);
            const sql = 'UPDATE users SET lock_until = ? WHERE id = ?';
            await db.query(sql, [lockUntil, userId]);
            logger.warn(`User account locked: ${userId} until ${lockUntil}`);
        } catch (error) {
            logger.error('Error in User.lockAccount:', error);
            throw error;
        }
    }

    /**
     * Check if account is locked
     * @param {Object} user - User object
     * @returns {boolean} Lock status
     */
    static isAccountLocked(user) {
        return user.lock_until && new Date(user.lock_until) > new Date();
    }

    /**
     * Get all users with pagination
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Users and pagination info
     */
    static async getAll(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const countSql = 'SELECT COUNT(*) as total FROM users';
            const dataSql = `
                SELECT id, email, role, is_active, created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;

            const [countResult] = await db.query(countSql);
            const users = await db.query(dataSql, [limit, offset]);

            return {
                users,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in User.getAll:', error);
            throw error;
        }
    }
}

module.exports = User;
