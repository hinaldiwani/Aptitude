/**
 * Authentication JavaScript
 * Handles login and registration
 */

console.log('auth.js loaded');

const API_URL = '/api';
console.log('API_URL:', API_URL);

// Show login form
function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
}

// Show register form
function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
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

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing event listeners');

    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user.role) {
        console.log('User already logged in, redirecting...');
        if (user.role === 'admin') {
            window.location.href = '/admin-dashboard';
        } else if (user.role === 'teacher') {
            window.location.href = '/teacher-dashboard';
        } else {
            window.location.href = '/student-dashboard';
        }
        return;
    }

    // Handle login
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        console.log('Login form found, attaching listener');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            console.log('Email:', email);

            try {
                console.log('Sending login request to:', `${API_URL}/auth/login`);
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log('Login response:', data);

                if (data.success) {
                    // Store token in localStorage
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    console.log('Token stored, redirecting to dashboard...');

                    showNotification('Login successful! Redirecting...', 'success');

                    // Redirect based on role
                    setTimeout(() => {
                        if (data.data.user.role === 'admin') {
                            window.location.href = '/admin-dashboard';
                        } else if (data.data.user.role === 'teacher') {
                            window.location.href = '/teacher-dashboard';
                        } else {
                            window.location.href = '/student-dashboard';
                        }
                    }, 1000);
                } else {
                    showNotification(data.message, 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('An error occurred during login', 'error');
            }
        });
    } else {
        console.error('Login form not found!');
    }

    // Handle registration
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        console.log('Register form found, attaching listener');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                full_name: document.getElementById('fullName').value,
                email: document.getElementById('regEmail').value,
                roll_number: document.getElementById('rollNumber').value,
                department: document.getElementById('department').value,
                semester: parseInt(document.getElementById('semester').value) || null,
                phone: document.getElementById('phone').value,
                password: document.getElementById('regPassword').value,
                role: 'student'
            };

            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validate passwords match
            if (formData.password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Registration successful! Please login.', 'success');

                    // Switch to login form after 2 seconds
                    setTimeout(() => {
                        showLogin();
                        document.getElementById('registerFormElement').reset();
                    }, 2000);
                } else {
                    showNotification(data.message || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showNotification('An error occurred during registration', 'error');
            }
        });
    } else {
        console.error('Register form not found!');
    }

    console.log('Event listeners attached successfully');
});
