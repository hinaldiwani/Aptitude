/**
 * Student Dashboard JavaScript
 * Handles student dashboard functionality
 */

const API_URL = '/api';
let currentTab = 'available';

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'student') {
        window.location.href = '/login';
        return false;
    }

    return true;
}

// Show tab
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');

    currentTab = tabName;

    // Load tab data
    switch (tabName) {
        case 'available':
            loadAvailableExams();
            break;
        case 'history':
            loadExamHistory();
            break;
        case 'results':
            loadMyResults();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Load available exams
async function loadAvailableExams() {
    const container = document.getElementById('availableExams');
    container.innerHTML = '<div class="loading">Loading exams...</div>';

    try {
        const response = await fetch(`${API_URL}/exams/active/list`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(exam => `
                <div class="exam-card">
                    <div class="exam-header">
                        <h3 class="exam-title">${exam.title}</h3>
                        <p>${exam.description || 'No description'}</p>
                    </div>
                    <div class="exam-info">
                        <div class="info-item">
                            <span class="info-label">Duration</span>
                            <span class="info-value">${exam.duration} mins</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Marks</span>
                            <span class="info-value">${exam.total_marks}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Questions</span>
                            <span class="info-value">${exam.question_count}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Passing Marks</span>
                            <span class="info-value">${exam.passing_marks}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="startExam(${exam.id})">Start Exam</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">No exams available at the moment</p>';
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading exams</p>';
    }
}

// Start exam
async function startExam(examId) {
    if (!confirm('Are you sure you want to start this exam? The timer will begin immediately.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/exam-take/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ exam_id: examId })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect to exam page
            window.location.href = `/exam.html?attemptId=${data.data.attemptId}`;
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error starting exam:', error);
        showNotification('Error starting exam', 'error');
    }
}

// Load exam history
async function loadExamHistory() {
    const container = document.getElementById('examHistory');
    container.innerHTML = '<div class="loading">Loading history...</div>';

    try {
        const response = await fetch(`${API_URL}/exam-take/history`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(attempt => `
                <div class="card">
                    <h3>${attempt.exam_title}</h3>
                    <p>Started: ${new Date(attempt.start_time).toLocaleString()}</p>
                    <p>Status: ${attempt.is_submitted ? 'Completed' : 'In Progress'}</p>
                    ${attempt.is_submitted ? `
                        <button class="btn btn-secondary btn-sm" onclick="viewResult(${attempt.id})">View Result</button>
                    ` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">No exam history</p>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading history</p>';
    }
}

// Load my results
async function loadMyResults() {
    const container = document.getElementById('myResults');
    container.innerHTML = '<div class="loading">Loading results...</div>';

    try {
        const response = await fetch(`${API_URL}/results/my-results`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(result => `
                <div class="card">
                    <h3>${result.exam_title}</h3>
                    <div class="exam-info">
                        <div class="info-item">
                            <span class="info-label">Score</span>
                            <span class="info-value">${result.marks_obtained}/${result.total_marks}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Percentage</span>
                            <span class="info-value">${result.percentage}%</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Result</span>
                            <span class="info-value ${result.result_status === 'pass' ? 'text-success' : 'text-danger'}">
                                ${result.result_status.toUpperCase()}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rank</span>
                            <span class="info-value">${result.rank || 'N/A'}</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm mt-2" onclick="viewResult(${result.attempt_id})">View Details</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">No results yet</p>';
        }
    } catch (error) {
        console.error('Error loading results:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading results</p>';
    }
}

// View result
function viewResult(attemptId) {
    window.location.href = `/result.html?attemptId=${attemptId}`;
}

// Load profile
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const user = data.data.user;
            const student = data.data.student;

            document.getElementById('profileEmail').value = user.email;

            if (student) {
                document.getElementById('profileName').value = student.full_name || '';
                document.getElementById('profileRoll').value = student.roll_number || '';
                document.getElementById('profileDept').value = student.department || '';
                document.getElementById('profileSem').value = student.semester || '';
                document.getElementById('profilePhone').value = student.phone || '';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile', 'error');
    }
}

// Handle profile update
function initProfileForm() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            full_name: document.getElementById('profileName').value,
            roll_number: document.getElementById('profileRoll').value,
            department: document.getElementById('profileDept').value,
            semester: parseInt(document.getElementById('profileSem').value) || null,
            phone: document.getElementById('profilePhone').value
        };

        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Profile updated successfully', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error updating profile', 'error');
        }
    });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('studentName').textContent = user.email;

    initProfileForm();
    loadAvailableExams();
});
