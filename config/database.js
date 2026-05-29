/**
 * Database Configuration Module
 * Handles MySQL connection pooling and database operations
 */

const mysql = require('mysql2/promise');
const logger = require('./logger');

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        logger.info('✓ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        logger.error('✗ Database connection failed:', error.message);
        return false;
    }
};

/**
 * Execute query with error handling
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        logger.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Execute transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        logger.error('Transaction error:', error.message);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Close database connection pool
 * Used for graceful shutdown
 */
const closePool = async () => {
    try {
        await pool.end();
        logger.info('Database connection pool closed');
    } catch (error) {
        logger.error('Error closing database pool:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closePool
};
