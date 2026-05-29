/**
 * Answer Model
 * Handles all database operations related to student answers
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Answer {
    /**
     * Save or update student answer
     * @param {Object} answerData - Answer data
     * @returns {Promise<number>} Answer ID
     */
    static async saveAnswer(answerData) {
        try {
            const { attempt_id, question_id, selected_option } = answerData;

            // Check if answer already exists
            const checkSql = 'SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?';
            const existing = await db.query(checkSql, [attempt_id, question_id]);

            if (existing.length > 0) {
                // Update existing answer
                const updateSql = `
                    UPDATE student_answers 
                    SET selected_option = ?, answered_at = NOW()
                    WHERE attempt_id = ? AND question_id = ?
                `;
                await db.query(updateSql, [selected_option, attempt_id, question_id]);
                logger.debug(`Answer updated: Attempt ${attempt_id}, Question ${question_id}`);
                return existing[0].id;
            } else {
                // Insert new answer
                const insertSql = `
                    INSERT INTO student_answers (attempt_id, question_id, selected_option)
                    VALUES (?, ?, ?)
                `;
                const result = await db.query(insertSql, [attempt_id, question_id, selected_option]);
                logger.debug(`Answer saved: Attempt ${attempt_id}, Question ${question_id}`);
                return result.insertId;
            }
        } catch (error) {
            logger.error('Error in Answer.saveAnswer:', error);
            throw error;
        }
    }

    /**
     * Get all answers for an attempt
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<Array>} Answers array
     */
    static async getByAttemptId(attemptId) {
        try {
            const sql = `
                SELECT sa.*, q.correct_option
                FROM student_answers sa
                JOIN questions q ON sa.question_id = q.id
                WHERE sa.attempt_id = ?
                ORDER BY q.question_order ASC
            `;
            return await db.query(sql, [attemptId]);
        } catch (error) {
            logger.error('Error in Answer.getByAttemptId:', error);
            throw error;
        }
    }

    /**
     * Get answer for specific question in attempt
     * @param {number} attemptId - Attempt ID
     * @param {number} questionId - Question ID
     * @returns {Promise<Object|null>} Answer object or null
     */
    static async getAnswer(attemptId, questionId) {
        try {
            const sql = `
                SELECT * FROM student_answers 
                WHERE attempt_id = ? AND question_id = ?
            `;
            const answers = await db.query(sql, [attemptId, questionId]);
            return answers[0] || null;
        } catch (error) {
            logger.error('Error in Answer.getAnswer:', error);
            throw error;
        }
    }

    /**
     * Evaluate answers and mark correct/incorrect
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<Object>} Evaluation summary
     */
    static async evaluateAnswers(attemptId) {
        try {
            // Update is_correct field for all answers
            const updateSql = `
                UPDATE student_answers sa
                JOIN questions q ON sa.question_id = q.id
                SET sa.is_correct = (sa.selected_option = q.correct_option)
                WHERE sa.attempt_id = ?
            `;
            await db.query(updateSql, [attemptId]);

            // Get evaluation summary
            const summarySql = `
                SELECT 
                    COUNT(*) as total_questions,
                    COUNT(sa.selected_option) as attempted_questions,
                    SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
                    SUM(CASE WHEN sa.is_correct = FALSE AND sa.selected_option IS NOT NULL THEN 1 ELSE 0 END) as wrong_answers,
                    SUM(CASE WHEN sa.is_correct = TRUE THEN q.marks ELSE 0 END) as marks_obtained
                FROM student_answers sa
                JOIN questions q ON sa.question_id = q.id
                WHERE sa.attempt_id = ?
            `;

            const [summary] = await db.query(summarySql, [attemptId]);
            logger.info(`Answers evaluated for attempt ${attemptId}`);
            return summary;
        } catch (error) {
            logger.error('Error in Answer.evaluateAnswers:', error);
            throw error;
        }
    }

    /**
     * Get answered question IDs for an attempt
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<Array>} Array of question IDs
     */
    static async getAnsweredQuestionIds(attemptId) {
        try {
            const sql = `
                SELECT question_id 
                FROM student_answers 
                WHERE attempt_id = ? AND selected_option IS NOT NULL
            `;
            const results = await db.query(sql, [attemptId]);
            return results.map(r => r.question_id);
        } catch (error) {
            logger.error('Error in Answer.getAnsweredQuestionIds:', error);
            throw error;
        }
    }

    /**
     * Delete all answers for an attempt
     * @param {number} attemptId - Attempt ID
     * @returns {Promise<boolean>} Success status
     */
    static async deleteByAttemptId(attemptId) {
        try {
            const sql = 'DELETE FROM student_answers WHERE attempt_id = ?';
            await db.query(sql, [attemptId]);
            return true;
        } catch (error) {
            logger.error('Error in Answer.deleteByAttemptId:', error);
            throw error;
        }
    }
}

module.exports = Answer;
