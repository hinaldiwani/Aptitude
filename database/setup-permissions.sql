-- =====================================================
-- Database Setup Script for MySQL Root User
-- Run this as root to create database and grant permissions
-- =====================================================

-- =====================================================
-- OPTION 1: Use this if you want to use 'hinal' user
-- =====================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS exam_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user 'hinal' if doesn't exist (or skip if already exists)
CREATE USER IF NOT EXISTS 'hinal'@'localhost' IDENTIFIED BY 'hinal';

-- Grant all privileges on exam_system to hinal user
GRANT ALL PRIVILEGES ON exam_system.* TO 'hinal'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- =====================================================
-- OPTION 2: Just use root user (simpler for development)
-- =====================================================
-- Update your .env file to use root:
-- DB_USER=root
-- DB_PASSWORD=your_root_password

-- =====================================================
-- After running this, execute:
-- =====================================================
-- node setup-database.js
