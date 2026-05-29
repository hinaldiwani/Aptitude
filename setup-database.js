/**
 * Database Setup Script
 * Run this script to create and initialize the database
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
    console.log('Starting database setup...\n');

    let connection;

    try {
        // Connect to MySQL without specifying database
        console.log('Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✓ Connected to MySQL server\n');

        // Create database if not exists
        const dbName = process.env.DB_NAME || 'exam_system';
        console.log(`Creating database '${dbName}' if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✓ Database '${dbName}' ready\n`);

        // Switch to the database
        await connection.query(`USE ${dbName}`);

        // Read and execute schema.sql
        console.log('Loading schema...');
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        let schemaSQL = await fs.readFile(schemaPath, 'utf8');

        // Clean up the SQL
        schemaSQL = schemaSQL.replace(/CREATE DATABASE.*?;/gi, '');
        schemaSQL = schemaSQL.replace(/USE\s+\w+\s*;/gi, '');
        schemaSQL = schemaSQL.replace(/DELIMITER\s+\/\//gi, '$$DELIM_START$$');
        schemaSQL = schemaSQL.replace(/DELIMITER\s*;/gi, '$$DELIM_END$$');

        // Split into regular SQL and procedures
        const parts = schemaSQL.split('$$DELIM_START$$');

        // Execute first part (tables, views, etc.)
        if (parts[0]) {
            const regularStatements = parts[0].split(';').filter(s => s.trim());
            for (const stmt of regularStatements) {
                if (stmt.trim() && !stmt.trim().startsWith('--')) {
                    try {
                        await connection.query(stmt);
                    } catch (err) {
                        if (!err.message.includes('already exists') && !err.message.includes('DROP')) {
                            console.error('Error in statement:', stmt.substring(0, 100) + '...');
                            throw err;
                        }
                    }
                }
            }
        }

        // Execute procedures
        for (let i = 1; i < parts.length; i++) {
            const procPart = parts[i].split('$$DELIM_END$$')[0];
            if (procPart && procPart.trim()) {
                const cleanProc = procPart.replace(/\/\//g, ';').trim();
                if (cleanProc) {
                    try {
                        await connection.query(cleanProc);
                    } catch (err) {
                        console.error('Error in procedure');
                        throw err;
                    }
                }
            }
        }

        console.log('✓ Schema created successfully\n');

        // Read and execute seed.sql
        console.log('Loading seed data...');
        const seedPath = path.join(__dirname, 'database', 'seed.sql');
        let seedSQL = await fs.readFile(seedPath, 'utf8');

        // Remove USE statements from seed
        seedSQL = seedSQL.replace(/USE\s+\w+\s*;/gi, '');

        // Split and execute seed statements
        const seedStatements = seedSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of seedStatements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }

        console.log('✓ Seed data loaded successfully\n');

        // Verify setup
        console.log('Verifying setup...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`✓ Created ${tables.length} tables`);

        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`✓ Loaded ${users[0].count} users`);

        const [exams] = await connection.query('SELECT COUNT(*) as count FROM exams');
        console.log(`✓ Loaded ${exams[0].count} exams`);

        console.log('\n✅ Database setup completed successfully!\n');
        console.log('You can now start the server with: npm start\n');
        console.log('Default credentials:');
        console.log('  Admin: admin@exam.com / Admin@123');
        console.log('  Student: john.doe@college.edu / Student@123\n');

    } catch (error) {
        console.error('\n❌ Error setting up database:');
        console.error(error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\nAccess denied. Please check your database credentials in .env file:');
            console.error('  DB_USER and DB_PASSWORD');
            console.error('\nOr run MySQL as root:');
            console.error('  mysql -u root -p');
            console.error('  Then create user and grant permissions:');
            console.error(`  CREATE USER IF NOT EXISTS '${process.env.DB_USER}'@'localhost' IDENTIFIED BY '${process.env.DB_PASSWORD}';`);
            console.error(`  GRANT ALL PRIVILEGES ON ${process.env.DB_NAME}.* TO '${process.env.DB_USER}'@'localhost';`);
            console.error('  FLUSH PRIVILEGES;');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\nCannot connect to MySQL server. Please ensure:');
            console.error('  1. MySQL is installed and running');
            console.error('  2. The connection details in .env are correct');
            console.error('  3. MySQL is listening on port', process.env.DB_PORT || 3306);
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
setupDatabase();
