/**
 * Exam Taking JavaScript
 * Handles exam timing, navigation, and submission
 */

const API_URL = '/api';
let examData = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let timerInterval = null;
let timeRemaining = 0;
let attemptId = null;
let autoSaveInterval = null;

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

// Prevent back navigation
function preventBackNavigation() {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
        window.history.pushState(null, null, window.location.href);
        showNotification('Please use exam navigation buttons only', 'warning');
    };
}

// Load exam
async function loadExam() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    attemptId = urlParams.get('attemptId');

    if (!examId || !attemptId) {
        showNotification('Invalid exam link', 'error');
        setTimeout(() => {
            window.location.href = '/student-dashboard';
        }, 2000);
        return;
    }

    try {
        // Load exam details
        const examResponse = await fetch(`${API_URL}/exams/${examId}`, {
            headers: getAuthHeaders()
        });

        const examResult = await examResponse.json();

        if (!examResult.success) {
            throw new Error(examResult.message);
        }

        examData = examResult.data;

        // Load questions
        const questionsResponse = await fetch(`${API_URL}/exam-take/${examId}/questions`, {
            headers: getAuthHeaders()
        });

        const questionsResult = await questionsResponse.json();

        if (!questionsResult.success) {
            throw new Error(questionsResult.message);
        }

        questions = questionsResult.data;

        // Initialize exam interface
        document.getElementById('examTitle').textContent = examData.title;
        document.getElementById('totalQuestions').textContent = questions.length;

        // Set timer
        timeRemaining = examData.duration * 60; // Convert to seconds
        startTimer();

        // Create question palette
        createQuestionPalette();

        // Show first question
        showQuestion(0);

        // Start auto-save
        startAutoSave();

        // Prevent back navigation
        preventBackNavigation();

    } catch (error) {
        console.error('Error loading exam:', error);
        showNotification(error.message, 'error');
        setTimeout(() => {
            window.location.href = '/student-dashboard';
        }, 2000);
    }
}

// Start timer
function startTimer() {
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 300 && timeRemaining % 60 === 0) {
            showNotification(`${Math.floor(timeRemaining / 60)} minutes remaining!`, 'warning');
        }

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timeRemaining').textContent = display;

    // Change color when time is running out
    const timerElement = document.querySelector('.timer');
    if (timeRemaining <= 300) { // 5 minutes
        timerElement.style.color = '#e74c3c';
    } else if (timeRemaining <= 600) { // 10 minutes
        timerElement.style.color = '#f39c12';
    }
}

// Create question palette
function createQuestionPalette() {
    const palette = document.getElementById('questionPalette');
    palette.innerHTML = questions.map((q, index) =>
        `<div class="palette-btn ${index === 0 ? 'active' : ''}" onclick="showQuestion(${index})">${index + 1}</div>`
    ).join('');
}

// Show question
function showQuestion(index) {
    // Save current answer before switching
    saveCurrentAnswer();

    currentQuestionIndex = index;
    const question = questions[index];

    // Update question content
    document.getElementById('questionNumber').textContent = `Question ${index + 1}`;
    document.getElementById('questionText').textContent = question.question_text;
    document.getElementById('questionMarks').textContent = `${question.marks} marks`;

    // Update options
    const optionInputs = {
        'A': document.getElementById('optionA'),
        'B': document.getElementById('optionB'),
        'C': document.getElementById('optionC'),
        'D': document.getElementById('optionD')
    };

    document.getElementById('optionALabel').textContent = question.option_a;
    document.getElementById('optionBLabel').textContent = question.option_b;
    document.getElementById('optionCLabel').textContent = question.option_c;
    document.getElementById('optionDLabel').textContent = question.option_d;

    // Set saved answer if exists
    const savedAnswer = answers[question.id];
    if (savedAnswer) {
        optionInputs[savedAnswer].checked = true;
    } else {
        Object.values(optionInputs).forEach(input => input.checked = false);
    }

    // Update palette
    document.querySelectorAll('.palette-btn').forEach((btn, i) => {
        btn.classList.remove('active');
        if (i === index) {
            btn.classList.add('active');
        }
        // Mark as answered
        if (answers[questions[i].id]) {
            btn.classList.add('answered');
        }
    });

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').textContent = index === questions.length - 1 ? 'Review' : 'Next';
}

// Save current answer
function saveCurrentAnswer() {
    const question = questions[currentQuestionIndex];
    const selectedOption = document.querySelector('input[name="option"]:checked');

    if (selectedOption) {
        answers[question.id] = selectedOption.value;
    }
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

// Next question
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    } else {
        showSubmitConfirmation();
    }
}

// Clear response
function clearResponse() {
    const question = questions[currentQuestionIndex];
    delete answers[question.id];
    document.querySelectorAll('input[name="option"]').forEach(input => input.checked = false);

    // Update palette
    const paletteBtn = document.querySelectorAll('.palette-btn')[currentQuestionIndex];
    paletteBtn.classList.remove('answered');

    showNotification('Response cleared', 'info');
}

// Mark for review
function markForReview() {
    const paletteBtn = document.querySelectorAll('.palette-btn')[currentQuestionIndex];
    paletteBtn.classList.toggle('marked');
    showNotification('Question marked for review', 'info');
}

// Show submit confirmation
function showSubmitConfirmation() {
    const answered = Object.keys(answers).length;
    const unanswered = questions.length - answered;

    document.getElementById('answeredCount').textContent = answered;
    document.getElementById('unansweredCount').textContent = unanswered;

    document.getElementById('confirmSubmitModal').classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Auto-save answers
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        autoSaveAnswers();
    }, 30000); // Every 30 seconds
}

// Auto-save implementation
async function autoSaveAnswers() {
    if (Object.keys(answers).length === 0) return;

    try {
        const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
            question_id: parseInt(questionId),
            selected_option: selectedOption
        }));

        await fetch(`${API_URL}/exam-take/save-progress`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                attempt_id: attemptId,
                answers: answersArray
            })
        });

        console.log('Progress auto-saved');
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
}

// Submit exam
async function submitExam() {
    // Save current answer
    saveCurrentAnswer();

    // Stop timer and auto-save
    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);

    closeModal('confirmSubmitModal');

    // Show loading
    document.body.innerHTML = '<div class="loading" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);">Submitting exam...</div>';

    try {
        const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
            question_id: parseInt(questionId),
            selected_option: selectedOption
        }));

        const response = await fetch(`${API_URL}/exam-take/submit`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                attempt_id: attemptId,
                answers: answersArray
            })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect to result page
            window.location.href = `/result?attemptId=${attemptId}`;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error submitting exam:', error);
        alert('Error submitting exam: ' + error.message);
        window.location.href = '/student-dashboard';
    }
}

// Auto-submit when time expires
function autoSubmitExam() {
    showNotification('Time is up! Auto-submitting...', 'warning');
    setTimeout(() => {
        submitExam();
    }, 2000);
}

// Prevent tab switching and copying (optional strict mode)
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        console.warn('Student switched tab');
        // You can implement stricter measures here
    }
});

document.addEventListener('copy', function (e) {
    e.preventDefault();
    showNotification('Copying is not allowed during exam', 'warning');
});

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showNotification('Right-click is disabled during exam', 'warning');
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadExam();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function (e) {
    if (timerInterval) {
        e.preventDefault();
        e.returnValue = 'Your exam is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});
