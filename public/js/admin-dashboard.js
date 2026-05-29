/**
 * Admin Dashboard JavaScript
 * Handles admin dashboard functionality
 */

const API_URL = '/api';
let currentExamId = null;

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

    if (!token || user.role !== 'admin') {
        window.location.href = '/login';
        return false;
    }

    return true;
}

// Show tab
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');

    switch (tabName) {
        case 'exams':
            loadExams();
            break;
        case 'questions':
            loadExamsForSelect();
            break;
        case 'results':
            loadExamsForResults();
            break;
        case 'analytics':
            loadExamsForAnalytics();
            break;
    }
}

// Show/Close modal
function showCreateExamModal() {
    document.getElementById('examModalTitle').textContent = 'Create New Exam';
    document.getElementById('examForm').reset();
    document.getElementById('examId').value = '';
    document.getElementById('examModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showAddQuestionModal() {
    if (!currentExamId) {
        showNotification('Please select an exam first', 'warning');
        return;
    }
    document.getElementById('questionForm').reset();
    document.getElementById('questionModal').classList.add('active');
}

function showBulkUploadModal() {
    if (!currentExamId) {
        showNotification('Please select an exam first', 'warning');
        return;
    }
    document.getElementById('bulkUploadForm').reset();
    document.getElementById('bulkUploadModal').classList.add('active');
}

// Load exams
async function loadExams() {
    const container = document.getElementById('examsList');
    container.innerHTML = '<div class="loading">Loading exams...</div>';

    try {
        const response = await fetch(`${API_URL}/exams`, {
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
                            <span class="info-label">Status</span>
                            <span class="info-value">${exam.is_active ? '✅ Active' : '❌ Inactive'}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editExam(${exam.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteExam(${exam.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">No exams found</p>';
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading exams</p>';
    }
}

// Handle exam form submission
function initExamForm() {
    const examForm = document.getElementById('examForm');
    if (!examForm) return;

    examForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const examId = document.getElementById('examId').value;
        const formData = {
            title: document.getElementById('examTitle').value,
            description: document.getElementById('examDesc').value,
            duration: parseInt(document.getElementById('examDuration').value),
            total_marks: parseInt(document.getElementById('examTotalMarks').value),
            passing_marks: parseInt(document.getElementById('examPassingMarks').value),
            start_time: document.getElementById('examStartTime').value,
            end_time: document.getElementById('examEndTime').value,
            is_active: document.getElementById('examActive').checked
        };

        try {
            const url = examId ? `${API_URL}/exams/${examId}` : `${API_URL}/exams`;
            const method = examId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showNotification(examId ? 'Exam updated successfully' : 'Exam created successfully', 'success');
                closeModal('examModal');
                loadExams();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error saving exam:', error);
            showNotification('Error saving exam', 'error');
        }
    });
}

// Edit exam
async function editExam(id) {
    try {
        const response = await fetch(`${API_URL}/exams/${id}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const exam = data.data;
            document.getElementById('examId').value = exam.id;
            document.getElementById('examTitle').value = exam.title;
            document.getElementById('examDesc').value = exam.description || '';
            document.getElementById('examDuration').value = exam.duration;
            document.getElementById('examTotalMarks').value = exam.total_marks;
            document.getElementById('examPassingMarks').value = exam.passing_marks;
            document.getElementById('examStartTime').value = exam.start_time.slice(0, 16);
            document.getElementById('examEndTime').value = exam.end_time.slice(0, 16);
            document.getElementById('examActive').checked = exam.is_active;
            document.getElementById('examModalTitle').textContent = 'Edit Exam';
            document.getElementById('examModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading exam:', error);
        showNotification('Error loading exam', 'error');
    }
}

// Delete exam
async function deleteExam(id) {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/exams/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Exam deleted successfully', 'success');
            loadExams();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting exam:', error);
        showNotification('Error deleting exam', 'error');
    }
}

// Load exams for select dropdown
async function loadExamsForSelect() {
    try {
        const response = await fetch(`${API_URL}/exams`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('examSelect');
            select.innerHTML = '<option value="">Select an exam...</option>' +
                data.data.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Load questions for selected exam
async function loadQuestions() {
    const examId = document.getElementById('examSelect').value;
    currentExamId = examId;

    if (!examId) {
        document.getElementById('questionsList').innerHTML = '<p class="text-muted">Select an exam to view questions</p>';
        return;
    }

    const container = document.getElementById('questionsList');
    container.innerHTML = '<div class="loading">Loading questions...</div>';

    try {
        const response = await fetch(`${API_URL}/questions/exam/${examId}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map((q, index) => `
                <div class="card">
                    <h4>Question ${index + 1} (${q.marks} marks)</h4>
                    <p>${q.question_text}</p>
                    <div class="mt-2">
                        <p><strong>A)</strong> ${q.option_a}</p>
                        <p><strong>B)</strong> ${q.option_b}</p>
                        <p><strong>C)</strong> ${q.option_c}</p>
                        <p><strong>D)</strong> ${q.option_d}</p>
                        <p class="text-success mt-1"><strong>Correct: ${q.correct_option}</strong></p>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${q.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">No questions found. Add questions to this exam.</p>';
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading questions</p>';
    }
}

// Handle question form submission
function initQuestionForm() {
    const questionForm = document.getElementById('questionForm');
    if (!questionForm) return;

    questionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            exam_id: parseInt(currentExamId),
            question_text: document.getElementById('questionText').value,
            option_a: document.getElementById('optionA').value,
            option_b: document.getElementById('optionB').value,
            option_c: document.getElementById('optionC').value,
            option_d: document.getElementById('optionD').value,
            correct_option: document.getElementById('correctOption').value,
            marks: parseInt(document.getElementById('questionMarks').value)
        };

        try {
            const response = await fetch(`${API_URL}/questions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Question added successfully', 'success');
                closeModal('questionModal');
                loadQuestions();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error adding question:', error);
            showNotification('Error adding question', 'error');
        }
    });
}

// Handle bulk upload
function initBulkUploadForm() {
    const bulkUploadForm = document.getElementById('bulkUploadForm');
    if (!bulkUploadForm) return;

    bulkUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (!file) {
            showNotification('Please select a file', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('exam_id', currentExamId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/questions/bulk-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showNotification(`Successfully uploaded ${data.data.uploaded} questions`, 'success');
                closeModal('bulkUploadModal');
                loadQuestions();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            showNotification('Error uploading file', 'error');
        }
    });
}

// Delete question
async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;

    try {
        const response = await fetch(`${API_URL}/questions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Question deleted', 'success');
            loadQuestions();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        showNotification('Error deleting question', 'error');
    }
}

// Load exams for results select
async function loadExamsForResults() {
    try {
        const response = await fetch(`${API_URL}/exams`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('resultsExamSelect');
            select.innerHTML = '<option value="">Select an exam...</option>' +
                data.data.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Load results
async function loadResults() {
    const examId = document.getElementById('resultsExamSelect').value;

    if (!examId) {
        document.getElementById('resultsList').innerHTML = '<p class="text-muted">Select an exam to view results</p>';
        return;
    }

    const container = document.getElementById('resultsList');
    container.innerHTML = '<div class="loading">Loading results...</div>';

    try {
        const response = await fetch(`${API_URL}/results/exam/${examId}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success && data.data.length > 0) {
            container.innerHTML = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; text-align: left;">Rank</th>
                            <th style="padding: 10px; text-align: left;">Name</th>
                            <th style="padding: 10px; text-align: left;">Roll No</th>
                            <th style="padding: 10px; text-align: left;">Score</th>
                            <th style="padding: 10px; text-align: left;">Percentage</th>
                            <th style="padding: 10px; text-align: left;">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.data.map(r => `
                            <tr>
                                <td style="padding: 10px;">${r.rank || 'N/A'}</td>
                                <td style="padding: 10px;">${r.full_name}</td>
                                <td style="padding: 10px;">${r.roll_number}</td>
                                <td style="padding: 10px;">${r.marks_obtained}/${r.total_marks}</td>
                                <td style="padding: 10px;">${r.percentage}%</td>
                                <td style="padding: 10px; color: ${r.result_status === 'pass' ? 'green' : 'red'};">
                                    ${r.result_status.toUpperCase()}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<p class="text-muted text-center">No results found</p>';
        }
    } catch (error) {
        console.error('Error loading results:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading results</p>';
    }
}

// Load exams for analytics select
async function loadExamsForAnalytics() {
    try {
        const response = await fetch(`${API_URL}/exams`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('analyticsExamSelect');
            select.innerHTML = '<option value="">Select an exam...</option>' +
                data.data.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Load analytics
async function loadAnalytics() {
    const examId = document.getElementById('analyticsExamSelect').value;

    if (!examId) {
        document.getElementById('analyticsContent').innerHTML = '<p class="text-muted">Select an exam to view analytics</p>';
        return;
    }

    const container = document.getElementById('analyticsContent');
    container.innerHTML = '<div class="loading">Loading analytics...</div>';

    try {
        const response = await fetch(`${API_URL}/results/exam/${examId}/analytics`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success && data.data) {
            const stats = data.data;
            container.innerHTML = `
                <div class="exam-info">
                    <div class="info-item">
                        <span class="info-label">Total Attempts</span>
                        <span class="info-value">${stats.total_attempts || 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Average %</span>
                        <span class="info-value">${stats.average_percentage ? stats.average_percentage.toFixed(2) : 0}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Highest %</span>
                        <span class="info-value">${stats.highest_percentage || 0}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Lowest %</span>
                        <span class="info-value">${stats.lowest_percentage || 0}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Passed</span>
                        <span class="info-value text-success">${stats.pass_count || 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Failed</span>
                        <span class="info-value text-danger">${stats.fail_count || 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Pass Rate</span>
                        <span class="info-value">${stats.pass_percentage ? stats.pass_percentage.toFixed(2) : 0}%</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-muted text-center">No analytics data available</p>';
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        container.innerHTML = '<p class="text-danger text-center">Error loading analytics</p>';
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('adminName').textContent = user.email;

    initExamForm();
    initQuestionForm();
    initBulkUploadForm();
    loadExams();
});
