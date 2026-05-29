/**
 * Main Server Entry Point
 * Online Examination System
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import configurations
const db = require('./config/database');
const logger = require('./config/logger');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/security');

// Import routes
const routes = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
            imgSrc: ["'self'", "data:", "https:"],
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use(apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', routes);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/student-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/teacher-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});

app.get('/exam', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'exam.html'));
});

app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Store server instance
let server;

// Test database connection
async function testDatabaseConnection() {
    try {
        await db.query('SELECT 1');
        logger.info('Database connection successful');
        return true;
    } catch (error) {
        logger.error('Database connection failed', error);
        return false;
    }
}

// Graceful shutdown function
async function gracefulShutdown(signal) {
    logger.info(`${signal} signal received: starting graceful shutdown`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');
            await db.closePool();
            logger.info('Database connections closed');
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            logger.error('Forcefully shutting down');
            process.exit(1);
        }, 10000);
    } else {
        await db.closePool();
        process.exit(0);
    }
}

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testDatabaseConnection();

        if (!dbConnected) {
            logger.error('Failed to connect to database. Server not started.');
            process.exit(1);
        }

        // Start listening
        server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Access the application at: http://localhost:${PORT}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
                process.exit(1);
            } else {
                logger.error('Server error:', error);
                process.exit(1);
            }
        });

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle nodemon restart
process.once('SIGUSR2', async () => {
    logger.info('SIGUSR2 signal received: nodemon restart');
    await gracefulShutdown('SIGUSR2');
    process.kill(process.pid, 'SIGUSR2');
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception', error);
    await gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

module.exports = app;
