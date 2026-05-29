-- =====================================================
-- Fix Password Hashes for All Users
-- =====================================================

USE exam_system;

-- Update admin password (admin123)
UPDATE users 
SET password = '$2a$10$SL5eZMC0/IbM9wM4QnHYUuopS287c2Q1Vq6YdKtwZebeqoI2xPn0K'
WHERE email = 'admin@college.edu';

-- Update student passwords (student123)
UPDATE users 
SET password = '$2a$10$qE2KBRaoXQ1y8KPC9uAfVOnnmDag0t/CKn2yBg5xPjKEPeNB9vSz.'
WHERE role = 'student';

-- Update teacher passwords (teacher123)
UPDATE users 
SET password = '$2a$10$Km6PXpk83eHLNcoh5.27/ON.nGnmBoCvO0kZunP1EVcCRmM.VqZOa'
WHERE role = 'teacher';

-- Verify the updates
SELECT email, role, 
       CASE 
           WHEN password = '$2a$10$SL5eZMC0/IbM9wM4QnHYUuopS287c2Q1Vq6YdKtwZebeqoI2xPn0K' THEN 'admin123'
           WHEN password = '$2a$10$qE2KBRaoXQ1y8KPC9uAfVOnnmDag0t/CKn2yBg5xPjKEPeNB9vSz.' THEN 'student123'
           WHEN password = '$2a$10$Km6PXpk83eHLNcoh5.27/ON.nGnmBoCvO0kZunP1EVcCRmM.VqZOa' THEN 'teacher123'
           ELSE 'UNKNOWN'
       END as password_set
FROM users
ORDER BY role, email;
