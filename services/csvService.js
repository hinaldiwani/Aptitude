/**
 * CSV Parser Service
 * Handles parsing CSV files for bulk question upload
 */

const fs = require('fs');
const csvParser = require('csv-parser');
const logger = require('../config/logger');

/**
 * Parse CSV file for questions
 * Expected CSV format:
 * question_text, option_a, option_b, option_c, option_d, correct_option, marks
 * 
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Array of question objects
 */
const parseQuestionsCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const questions = [];
        const errors = [];
        let lineNumber = 1; // Start from 1 (header is line 0)

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                lineNumber++;

                try {
                    // Validate required fields
                    if (!row.question_text || !row.option_a || !row.option_b ||
                        !row.option_c || !row.option_d || !row.correct_option) {
                        errors.push({
                            line: lineNumber,
                            error: 'Missing required fields'
                        });
                        return;
                    }

                    // Validate correct_option
                    const correctOption = row.correct_option.trim().toUpperCase();
                    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
                        errors.push({
                            line: lineNumber,
                            error: 'Invalid correct_option. Must be A, B, C, or D'
                        });
                        return;
                    }

                    // Validate marks
                    const marks = parseInt(row.marks || '1');
                    if (isNaN(marks) || marks < 1) {
                        errors.push({
                            line: lineNumber,
                            error: 'Invalid marks. Must be a positive integer'
                        });
                        return;
                    }

                    // Add question to array
                    questions.push({
                        question_text: row.question_text.trim(),
                        option_a: row.option_a.trim(),
                        option_b: row.option_b.trim(),
                        option_c: row.option_c.trim(),
                        option_d: row.option_d.trim(),
                        correct_option: correctOption,
                        marks: marks,
                        question_order: questions.length + 1
                    });
                } catch (error) {
                    errors.push({
                        line: lineNumber,
                        error: error.message
                    });
                }
            })
            .on('end', () => {
                if (errors.length > 0) {
                    logger.warn(`CSV parsing completed with ${errors.length} errors`);
                    resolve({ questions, errors });
                } else {
                    logger.info(`Successfully parsed ${questions.length} questions from CSV`);
                    resolve({ questions, errors: [] });
                }
            })
            .on('error', (error) => {
                logger.error('Error parsing CSV file:', error);
                reject(error);
            });
    });
};

/**
 * Generate sample CSV template
 * @returns {string} CSV template string
 */
const generateCSVTemplate = () => {
    const header = 'question_text,option_a,option_b,option_c,option_d,correct_option,marks\n';
    const sample1 = 'What is 2 + 2?,3,4,5,6,B,1\n';
    const sample2 = 'Which is the largest planet?,Earth,Jupiter,Mars,Venus,B,2\n';
    const sample3 = 'What is the capital of France?,London,Berlin,Paris,Rome,C,1\n';

    return header + sample1 + sample2 + sample3;
};

/**
 * Validate CSV file
 * @param {Object} file - Uploaded file object
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
const validateCSVFile = (file) => {
    // Check if file exists
    if (!file) {
        return { valid: false, error: 'No file uploaded' };
    }

    // Check file extension
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext !== 'csv') {
        return { valid: false, error: 'File must be a CSV file' };
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return { valid: false, error: 'File size must be less than 5MB' };
    }

    return { valid: true };
};

/**
 * Delete file
 * @param {string} filePath - Path to file
 */
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.debug(`File deleted: ${filePath}`);
        }
    } catch (error) {
        logger.error('Error deleting file:', error);
    }
};

module.exports = {
    parseQuestionsCSV,
    generateCSVTemplate,
    validateCSVFile,
    deleteFile
};
