/**
 * Question Model
 * Handles all database operations related to questions
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Question {
    /**
     * Find question by ID
     * @param {number} id - Question ID
     * @returns {Promise<Object|null>} Question object or null
     */
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM questions WHERE id = ?';
            const questions = await db.query(sql, [id]);
            return questions[0] || null;
        } catch (error) {
            logger.error('Error in Question.findById:', error);
            throw error;
        }
    }

    /**
     * Get all questions for an exam
     * @param {number} examId - Exam ID
     * @param {boolean} includeAnswers - Include correct answers (for admin)
     * @returns {Promise<Array>} Questions array
     */
    static async getByExamId(examId, includeAnswers = false) {
        try {
            let sql;
            if (includeAnswers) {
                sql = 'SELECT * FROM questions WHERE exam_id = ? ORDER BY question_order ASC';
            } else {
                // Hide correct_option for students
                sql = `
                    SELECT id, exam_id, question_text, option_a, option_b, option_c, option_d, 
                           marks, question_order, created_at
                    FROM questions 
                    WHERE exam_id = ? 
                    ORDER BY question_order ASC
                `;
            }
            return await db.query(sql, [examId]);
        } catch (error) {
            logger.error('Error in Question.getByExamId:', error);
            throw error;
        }
    }

    /**
     * Create new question
     * @param {Object} questionData - Question data
     * @returns {Promise<number>} New question ID
     */
    static async create(questionData) {
        try {
            const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order } = questionData;

            const sql = `
                INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await db.query(sql, [
                exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order
            ]);

            logger.info(`Question created for exam ${exam_id}`);
            return result.insertId;
        } catch (error) {
            logger.error('Error in Question.create:', error);
            throw error;
        }
    }

    /**
     * Create multiple questions at once
     * @param {Array} questionsArray - Array of question objects
     * @returns {Promise<boolean>} Success status
     */
    static async createBulk(questionsArray) {
        try {
            const sql = `
                INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order)
                VALUES ?
            `;

            const values = questionsArray.map(q => [
                q.exam_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.marks, q.question_order
            ]);

            await db.pool.query(sql, [values]);
            logger.info(`Bulk created ${questionsArray.length} questions`);
            return true;
        } catch (error) {
            logger.error('Error in Question.createBulk:', error);
            throw error;
        }
    }

    /**
     * Update question
     * @param {number} id - Question ID
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

            const sql = `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(sql, values);

            return true;
        } catch (error) {
            logger.error('Error in Question.update:', error);
            throw error;
        }
    }

    /**
     * Delete question
     * @param {number} id - Question ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        try {
            const sql = 'DELETE FROM questions WHERE id = ?';
            await db.query(sql, [id]);
            logger.info(`Question deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error('Error in Question.delete:', error);
            throw error;
        }
    }

    /**
     * Delete all questions for an exam
     * @param {number} examId - Exam ID
     * @returns {Promise<boolean>} Success status
     */
    static async deleteByExamId(examId) {
        try {
            const sql = 'DELETE FROM questions WHERE exam_id = ?';
            const result = await db.query(sql, [examId]);
            logger.info(`Deleted ${result.affectedRows} questions for exam ${examId}`);
            return true;
        } catch (error) {
            logger.error('Error in Question.deleteByExamId:', error);
            throw error;
        }
    }

    /**
     * Get question count for exam
     * @param {number} examId - Exam ID
     * @returns {Promise<number>} Question count
     */
    static async getCountByExamId(examId) {
        try {
            const sql = 'SELECT COUNT(*) as count FROM questions WHERE exam_id = ?';
            const [result] = await db.query(sql, [examId]);
            return result.count;
        } catch (error) {
            logger.error('Error in Question.getCountByExamId:', error);
            throw error;
        }
    }

    /**
     * Get correct option for a question
     * @param {number} questionId - Question ID
     * @returns {Promise<string>} Correct option
     */
    static async getCorrectOption(questionId) {
        try {
            const sql = 'SELECT correct_option FROM questions WHERE id = ?';
            const [result] = await db.query(sql, [questionId]);
            return result ? result.correct_option : null;
        } catch (error) {
            logger.error('Error in Question.getCorrectOption:', error);
            throw error;
        }
    }
}

module.exports = Question;
