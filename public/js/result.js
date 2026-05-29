/**
 * Result Display JavaScript
 * Handles exam result viewing
 */

const API_URL = '/api';

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

// Load result
async function loadResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attemptId');

    if (!attemptId) {
        showNotification('Invalid result link', 'error');
        setTimeout(() => {
            window.location.href = '/student-dashboard';
        }, 2000);
        return;
    }

    try {
        // Load result data
        const response = await fetch(`${API_URL}/results/attempt/${attemptId}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        const result = data.data;

        // Display exam info
        document.getElementById('examTitle').textContent = result.exam_title;
        document.getElementById('resultDate').textContent = new Date(result.submitted_at).toLocaleString();

        // Display score
        document.getElementById('marksObtained').textContent = result.marks_obtained;
        document.getElementById('totalMarks').textContent = result.total_marks;
        document.getElementById('percentage').textContent = result.percentage;

        // Display result status
        const resultStatus = document.getElementById('resultStatus');
        if (result.result_status === 'pass') {
            resultStatus.innerHTML = '<span style="color: #27ae60; font-size: 1.2em;">✓ PASSED</span>';
        } else {
            resultStatus.innerHTML = '<span style="color: #e74c3c; font-size: 1.2em;">✗ FAILED</span>';
        }

        // Display rank if available
        if (result.rank) {
            document.getElementById('rank').textContent = result.rank;
        } else {
            document.getElementById('rank').textContent = 'N/A';
        }

        // Display statistics
        document.getElementById('correctAnswers').textContent = result.correct_answers;
        document.getElementById('incorrectAnswers').textContent = result.incorrect_answers;
        document.getElementById('unattempted').textContent = result.unattempted;

        // Load detailed answers
        loadDetailedAnswers(attemptId);

    } catch (error) {
        console.error('Error loading result:', error);
        showNotification(error.message, 'error');
        setTimeout(() => {
            window.location.href = '/student-dashboard';
        }, 2000);
    }
}

// Load detailed answers
async function loadDetailedAnswers(attemptId) {
    try {
        const response = await fetch(`${API_URL}/results/attempt/${attemptId}/details`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const answers = data.data;
            const container = document.getElementById('answersContainer');

            container.innerHTML = answers.map((ans, index) => {
                const isCorrect = ans.selected_option === ans.correct_option;
                const statusClass = isCorrect ? 'correct' : (ans.selected_option ? 'incorrect' : 'unattempted');
                const statusText = isCorrect ? '✓ Correct' : (ans.selected_option ? '✗ Incorrect' : '⊗ Unattempted');

                return `
                    <div class="card answer-card ${statusClass}">
                        <div class="answer-header">
                            <h4>Question ${index + 1}</h4>
                            <span class="answer-status ${statusClass}">${statusText}</span>
                        </div>
                        <p class="question-text">${ans.question_text}</p>
                        <div class="options-container">
                            <div class="option ${ans.selected_option === 'A' ? 'selected' : ''} ${ans.correct_option === 'A' ? 'correct-answer' : ''}">
                                <strong>A)</strong> ${ans.option_a}
                                ${ans.correct_option === 'A' ? '<span class="correct-mark">✓</span>' : ''}
                            </div>
                            <div class="option ${ans.selected_option === 'B' ? 'selected' : ''} ${ans.correct_option === 'B' ? 'correct-answer' : ''}">
                                <strong>B)</strong> ${ans.option_b}
                                ${ans.correct_option === 'B' ? '<span class="correct-mark">✓</span>' : ''}
                            </div>
                            <div class="option ${ans.selected_option === 'C' ? 'selected' : ''} ${ans.correct_option === 'C' ? 'correct-answer' : ''}">
                                <strong>C)</strong> ${ans.option_c}
                                ${ans.correct_option === 'C' ? '<span class="correct-mark">✓</span>' : ''}
                            </div>
                            <div class="option ${ans.selected_option === 'D' ? 'selected' : ''} ${ans.correct_option === 'D' ? 'correct-answer' : ''}">
                                <strong>D)</strong> ${ans.option_d}
                                ${ans.correct_option === 'D' ? '<span class="correct-mark">✓</span>' : ''}
                            </div>
                        </div>
                        <div class="marks-info">
                            Marks: ${isCorrect ? ans.marks : 0}/${ans.marks}
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading answer details:', error);
    }
}

// Go back to dashboard
function goToDashboard() {
    window.location.href = '/student-dashboard';
}

// Print result
function printResult() {
    window.print();
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadResult();
});
