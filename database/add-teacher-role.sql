-- =====================================================
-- Add Teacher Role to Existing System
-- Run this to update your existing database
-- =====================================================

USE exam_system;

-- =====================================================
-- Step 1: Modify users table to add teacher role
-- =====================================================
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student';

-- =====================================================
-- Step 2: Create teachers table
-- =====================================================
CREATE TABLE IF NOT EXISTS teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    subject VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department)
) ENGINE=InnoDB;

-- =====================================================
-- Step 3: Insert sample teacher users
-- Password: teacher123 (bcrypt hash)
-- =====================================================
INSERT INTO users (email, password, role, is_active) VALUES
('dr.sharma@college.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'teacher', TRUE),
('prof.patel@college.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'teacher', TRUE),
('dr.kumar@college.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'teacher', TRUE);

-- =====================================================
-- Step 4: Insert teacher profiles
-- =====================================================
INSERT INTO teachers (user_id, full_name, employee_id, department, subject, phone) VALUES
((SELECT id FROM users WHERE email = 'dr.sharma@college.edu'), 'Dr. Rajesh Sharma', 'EMP001', 'Computer Science', 'Data Structures & Algorithms', '9876500001'),
((SELECT id FROM users WHERE email = 'prof.patel@college.edu'), 'Prof. Priya Patel', 'EMP002', 'Computer Science', 'Database Management Systems', '9876500002'),
((SELECT id FROM users WHERE email = 'dr.kumar@college.edu'), 'Dr. Anil Kumar', 'EMP003', 'Computer Science', 'Operating Systems', '9876500003');

-- =====================================================
-- Step 5: Update existing exams to assign to a teacher
-- =====================================================
UPDATE exams SET created_by = (SELECT id FROM users WHERE email = 'dr.sharma@college.edu' LIMIT 1) WHERE id = 1;
UPDATE exams SET created_by = (SELECT id FROM users WHERE email = 'prof.patel@college.edu' LIMIT 1) WHERE id = 2;
UPDATE exams SET created_by = (SELECT id FROM users WHERE email = 'dr.kumar@college.edu' LIMIT 1) WHERE id = 3;

-- =====================================================
-- Verify changes
-- =====================================================
SELECT 'Teachers added successfully' AS status;
SELECT email, role FROM users WHERE role = 'teacher';
SELECT * FROM teachers;
