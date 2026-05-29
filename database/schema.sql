-- =====================================================
-- Online Examination System - Database Schema
-- =====================================================

-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS exam_system;
CREATE DATABASE exam_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_system;

-- =====================================================
-- TABLE: users
-- Stores authentication information for all users
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    login_attempts INT DEFAULT 0,
    lock_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: students
-- Stores student profile information
-- =====================================================
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    semester INT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_roll_number (roll_number),
    INDEX idx_department (department)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: exams
-- Stores exam/test information
-- =====================================================
CREATE TABLE exams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    total_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_active (is_active),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: questions
-- Stores MCQ questions for exams
-- =====================================================
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    marks INT NOT NULL DEFAULT 1,
    question_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    INDEX idx_exam_id (exam_id),
    INDEX idx_question_order (question_order)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: exam_attempts
-- Tracks student exam attempts
-- =====================================================
CREATE TABLE exam_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    is_submitted BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exam_student (exam_id, student_id),
    INDEX idx_student_id (student_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_submitted (is_submitted)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: student_answers
-- Stores student responses to questions
-- =====================================================
CREATE TABLE student_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D') NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt_question (attempt_id, question_id),
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: results
-- Stores final exam results and scores
-- =====================================================
CREATE TABLE results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL UNIQUE,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    total_questions INT NOT NULL,
    attempted_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    marks_obtained INT NOT NULL,
    total_marks INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    result_status ENUM('pass', 'fail') NOT NULL,
    rank INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_exam_id (exam_id),
    INDEX idx_student_id (student_id),
    INDEX idx_result_status (result_status),
    INDEX idx_percentage (percentage)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: activity_logs
-- Tracks user activities for security and auditing
-- =====================================================
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- Create views for common queries
-- =====================================================

-- View: Student Results with Details
CREATE VIEW vw_student_results AS
SELECT 
    r.id,
    r.attempt_id,
    e.title as exam_title,
    s.full_name,
    s.roll_number,
    s.department,
    r.marks_obtained,
    r.total_marks,
    r.percentage,
    r.result_status,
    r.rank,
    r.created_at
FROM results r
JOIN exams e ON r.exam_id = e.id
JOIN students s ON r.student_id = s.id
ORDER BY r.created_at DESC;

-- View: Active Exams
CREATE VIEW vw_active_exams AS
SELECT 
    e.*,
    COUNT(q.id) as question_count
FROM exams e
LEFT JOIN questions q ON e.id = q.exam_id
WHERE e.is_active = TRUE 
    AND e.start_time <= NOW() 
    AND e.end_time >= NOW()
GROUP BY e.id;

-- =====================================================
-- Stored Procedure: Calculate Exam Rankings
-- =====================================================
DELIMITER //

CREATE PROCEDURE calculate_rankings(IN exam_id_param INT)
BEGIN
    DECLARE rank_counter INT DEFAULT 0;
    DECLARE prev_percentage DECIMAL(5,2) DEFAULT -1;
    DECLARE current_rank INT DEFAULT 1;
    
    -- Temporary table to store sorted results
    DROP TEMPORARY TABLE IF EXISTS temp_rankings;
    CREATE TEMPORARY TABLE temp_rankings AS
    SELECT id, percentage
    FROM results
    WHERE exam_id = exam_id_param
    ORDER BY percentage DESC, created_at ASC;
    
    -- Update rankings
    UPDATE results r
    JOIN (
        SELECT 
            id,
            @rank := IF(@prev_pct = percentage, @rank, @rownum) as new_rank,
            @rownum := @rownum + 1,
            @prev_pct := percentage
        FROM temp_rankings
        CROSS JOIN (SELECT @rank := 0, @rownum := 1, @prev_pct := -1) vars
    ) ranked ON r.id = ranked.id
    SET r.rank = ranked.new_rank;
    
    DROP TEMPORARY TABLE IF EXISTS temp_rankings;
END //

DELIMITER ;

-- =====================================================
-- End of Schema
-- =====================================================
