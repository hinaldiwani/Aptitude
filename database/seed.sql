-- =====================================================
-- Seed Data for Testing
-- =====================================================

USE exam_system;

-- =====================================================
-- Insert Admin User
-- Password: admin123 (hashed with bcrypt)
-- =====================================================
INSERT INTO users (email, password, role, is_active) VALUES
('admin@college.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'admin', TRUE);

-- =====================================================
-- Insert Student Users
-- Password for all: student123
-- =====================================================
INSERT INTO users (email, password, role, is_active) VALUES
('john.doe@student.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'student', TRUE),
('jane.smith@student.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'student', TRUE),
('alice.johnson@student.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'student', TRUE),
('bob.williams@student.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'student', TRUE),
('charlie.brown@student.edu', '$2a$10$rZ8qHYxFLqE7Y0xqBqxVXOL3YPPJWzEqMZGrLZKW9KmVpYxZqKGRK', 'student', TRUE);

-- =====================================================
-- Insert Student Profiles
-- =====================================================
INSERT INTO students (user_id, full_name, roll_number, department, semester, phone) VALUES
(2, 'John Doe', 'CS2021001', 'Computer Science', 6, '9876543210'),
(3, 'Jane Smith', 'CS2021002', 'Computer Science', 6, '9876543211'),
(4, 'Alice Johnson', 'IT2021001', 'Information Technology', 5, '9876543212'),
(5, 'Bob Williams', 'CS2021003', 'Computer Science', 6, '9876543213'),
(6, 'Charlie Brown', 'EC2021001', 'Electronics', 4, '9876543214');

-- =====================================================
-- Insert Sample Exams
-- =====================================================
INSERT INTO exams (title, description, duration, total_marks, passing_marks, start_time, end_time, created_by, is_active) VALUES
('Data Structures Mid-Term', 'Mid-term examination covering arrays, linked lists, stacks, and queues', 60, 50, 25, 
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, TRUE),
('Database Management Systems Final', 'Final examination covering SQL, normalization, transactions, and ER diagrams', 90, 100, 50,
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 1, TRUE),
('Operating Systems Quiz', 'Quick quiz on process scheduling and memory management', 30, 30, 15,
    DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 1, TRUE),
('Java Programming Test', 'Test covering OOP concepts, exceptions, and collections', 45, 40, 20,
    DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 1, TRUE);

-- =====================================================
-- Insert Sample Questions for Data Structures Exam
-- =====================================================
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order) VALUES
(1, 'What is the time complexity of inserting an element at the beginning of a singly linked list?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', 'A', 2, 1),
(1, 'Which data structure uses LIFO (Last In First Out) principle?', 'Queue', 'Stack', 'Array', 'Tree', 'B', 2, 2),
(1, 'What is the maximum number of nodes at level k in a binary tree?', '2^k', '2^(k-1)', '2^(k+1)', 'k^2', 'A', 2, 3),
(1, 'In which data structure is recursion implemented?', 'Queue', 'Stack', 'Linked List', 'Array', 'B', 2, 4),
(1, 'What is the average time complexity of searching in a hash table?', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', 'A', 2, 5),
(1, 'Which traversal of binary tree visits nodes in ascending order in BST?', 'Preorder', 'Postorder', 'Inorder', 'Level order', 'C', 2, 6),
(1, 'What is the space complexity of merge sort?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'C', 2, 7),
(1, 'In a circular queue, when should we increment the rear pointer?', 'After insertion', 'Before insertion', 'During insertion', 'Never', 'A', 2, 8),
(1, 'Which of the following is NOT a linear data structure?', 'Array', 'Stack', 'Tree', 'Queue', 'C', 2, 9),
(1, 'What is the worst-case time complexity of Quick Sort?', 'O(n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'C', 2, 10),
(1, 'Which data structure is used for BFS traversal?', 'Stack', 'Queue', 'Array', 'Tree', 'B', 2, 11),
(1, 'What is the height of a complete binary tree with n nodes?', 'log n', 'n', 'n log n', 'sqrt(n)', 'A', 2, 12),
(1, 'In a doubly linked list, each node has how many pointers?', '1', '2', '3', '4', 'B', 2, 13),
(1, 'Which sorting algorithm is stable?', 'Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort', 'C', 2, 14),
(1, 'What is the minimum number of nodes in an AVL tree of height h?', 'h', '2^h', 'Fibonacci(h+2)', 'h²', 'C', 2, 15);

-- =====================================================
-- Insert Sample Questions for DBMS Exam
-- =====================================================
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order) VALUES
(2, 'Which normal form eliminates transitive dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'C', 4, 1),
(2, 'What does ACID stand for in database transactions?', 'Atomicity, Consistency, Isolation, Durability', 'Association, Consistency, Integrity, Data', 'Atomicity, Correctness, Isolation, Design', 'None of the above', 'A', 4, 2),
(2, 'Which SQL command is used to remove a table from database?', 'DELETE', 'REMOVE', 'DROP', 'TRUNCATE', 'C', 4, 3),
(2, 'What type of join returns all rows from both tables?', 'INNER JOIN', 'CROSS JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'D', 4, 4),
(2, 'Which key uniquely identifies a record in a table?', 'Foreign Key', 'Primary Key', 'Composite Key', 'Candidate Key', 'B', 4, 5),
(2, 'What is the purpose of indexing in databases?', 'Reduce storage', 'Speed up queries', 'Maintain relationships', 'Backup data', 'B', 4, 6),
(2, 'Which isolation level prevents dirty reads?', 'READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE', 'B', 4, 7),
(2, 'What does DDL stand for?', 'Data Definition Language', 'Data Derivation Language', 'Database Definition Language', 'Data Description Language', 'A', 4, 8),
(2, 'Which clause is used to filter grouped results in SQL?', 'WHERE', 'HAVING', 'GROUP BY', 'ORDER BY', 'B', 4, 9),
(2, 'What is a deadlock in database systems?', 'Database crash', 'Two transactions waiting for each other', 'Slow query execution', 'Network failure', 'B', 4, 10);

-- =====================================================
-- Insert Sample Questions for OS Quiz
-- =====================================================
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order) VALUES
(3, 'Which scheduling algorithm can cause starvation?', 'FCFS', 'Round Robin', 'Priority Scheduling', 'SRTF', 'C', 3, 1),
(3, 'What is thrashing in operating systems?', 'CPU overload', 'Excessive paging', 'Memory leak', 'Disk failure', 'B', 3, 2),
(3, 'Which page replacement algorithm has optimal page fault rate?', 'FIFO', 'LRU', 'Optimal', 'Clock', 'C', 3, 3),
(3, 'What is the purpose of semaphore?', 'Memory management', 'Process synchronization', 'File management', 'CPU scheduling', 'B', 3, 4),
(3, 'Which memory allocation technique has internal fragmentation?', 'Paging', 'Segmentation', 'Both', 'Neither', 'A', 3, 5),
(3, 'What is the banker''s algorithm used for?', 'Banking transactions', 'Deadlock avoidance', 'Scheduling', 'Memory allocation', 'B', 3, 6),
(3, 'Which system call is used to create a new process?', 'exec()', 'fork()', 'wait()', 'exit()', 'B', 3, 7),
(3, 'What is context switching?', 'Switching between users', 'Switching between processes', 'Switching between files', 'Switching between disks', 'B', 3, 8),
(3, 'Which of the following is a non-preemptive scheduling algorithm?', 'Round Robin', 'FCFS', 'SRTF', 'Priority with preemption', 'B', 3, 9),
(3, 'What is a zombie process?', 'Dead process', 'Process waiting for parent', 'Orphan process', 'Background process', 'B', 3, 10);

-- =====================================================
-- Insert Sample Exam Attempts and Answers
-- =====================================================

-- Student 1 (John Doe) attempts Data Structures exam
INSERT INTO exam_attempts (exam_id, student_id, start_time, end_time, is_submitted, ip_address) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), TRUE, '192.168.1.100');

-- Student 1's answers (12 correct out of 15)
INSERT INTO student_answers (attempt_id, question_id, selected_option, is_correct) VALUES
(1, 1, 'A', TRUE),
(1, 2, 'B', TRUE),
(1, 3, 'A', TRUE),
(1, 4, 'B', TRUE),
(1, 5, 'A', TRUE),
(1, 6, 'C', TRUE),
(1, 7, 'B', FALSE),
(1, 8, 'A', TRUE),
(1, 9, 'C', TRUE),
(1, 10, 'B', FALSE),
(1, 11, 'B', TRUE),
(1, 12, 'A', TRUE),
(1, 13, 'B', TRUE),
(1, 14, 'C', TRUE),
(1, 15, 'A', FALSE);

-- Student 1's result
INSERT INTO results (attempt_id, exam_id, student_id, total_questions, attempted_questions, correct_answers, wrong_answers, marks_obtained, total_marks, percentage, result_status) VALUES
(1, 1, 1, 15, 15, 12, 3, 24, 30, 80.00, 'pass');

-- Student 2 (Jane Smith) attempts Data Structures exam
INSERT INTO exam_attempts (exam_id, student_id, start_time, end_time, is_submitted, ip_address) VALUES
(1, 2, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), TRUE, '192.168.1.101');

-- Student 2's answers (14 correct out of 15)
INSERT INTO student_answers (attempt_id, question_id, selected_option, is_correct) VALUES
(2, 1, 'A', TRUE),
(2, 2, 'B', TRUE),
(2, 3, 'A', TRUE),
(2, 4, 'B', TRUE),
(2, 5, 'A', TRUE),
(2, 6, 'C', TRUE),
(2, 7, 'C', TRUE),
(2, 8, 'A', TRUE),
(2, 9, 'C', TRUE),
(2, 10, 'C', TRUE),
(2, 11, 'B', TRUE),
(2, 12, 'A', TRUE),
(2, 13, 'B', TRUE),
(2, 14, 'C', TRUE),
(2, 15, 'A', FALSE);

-- Student 2's result
INSERT INTO results (attempt_id, exam_id, student_id, total_questions, attempted_questions, correct_answers, wrong_answers, marks_obtained, total_marks, percentage, result_status) VALUES
(2, 1, 2, 15, 15, 14, 1, 28, 30, 93.33, 'pass');

-- Calculate rankings for exam 1
CALL calculate_rankings(1);

-- =====================================================
-- Insert Sample Activity Logs
-- =====================================================
INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES
(1, 'LOGIN', 'Admin logged in', '192.168.1.1'),
(2, 'LOGIN', 'Student logged in', '192.168.1.100'),
(3, 'LOGIN', 'Student logged in', '192.168.1.101'),
(1, 'CREATE_EXAM', 'Created exam: Data Structures Mid-Term', '192.168.1.1'),
(2, 'START_EXAM', 'Started exam: Data Structures Mid-Term', '192.168.1.100'),
(2, 'SUBMIT_EXAM', 'Submitted exam: Data Structures Mid-Term', '192.168.1.100');

-- =====================================================
-- End of Seed Data
-- =====================================================
