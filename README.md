# Online Examination System

A comprehensive, industry-grade online examination platform designed for educational institutions. Built with Node.js, Express.js, MySQL, and vanilla JavaScript for secure, scalable exam management and administration.

## 🚀 Features

### Authentication & Security
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Three-Level Role System**: Admin, Teacher, and Student with appropriate access control
- **Account Security**: Account locking after 5 failed login attempts
- **Security Headers**: Helmet.js for HTTP security headers
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Express-validator for comprehensive input sanitization

### Admin Dashboard
- **Complete System Control**: Manage all teachers, students, and exams
- **Exam Management**: View and monitor all exams across the system
- **Question Management**: Access to all question banks
- **Results Management**: View comprehensive results for all exams
- **Analytics Dashboard**: System-wide statistics and performance metrics
- **User Management**: Manage teacher and student accounts

### Teacher Dashboard
- **Exam Creation**: Create and manage own exams
- **Question Management**: Add questions individually or via CSV bulk upload
- **Auto-Grading**: Automatic checking of MCQ answers
- **Results View**: View student results for their exams
- **Performance Analytics**: Track class performance and statistics
- **Question Bank**: Build and maintain personal question repositories

### Student Dashboard
- **Exam Taking**: Access and attempt active exams
- **Available Exams**: View and start active exams
- **Exam History**: Access past exam attempts and results
- **Profile Management**: Update personal information and password
- **Real-time Timer**: Live countdown during exams
- **Auto-submit**: Automatic submission when time expires

### Examination Features
- **Timer-Based Exams**: Configurable duration with auto-submit on timeout
- **Question Navigation**: Easy navigation between questions with palette
- **Mark for Review**: Flag questions for later review
- **Auto-save**: Periodic saving of answers every 30 seconds
- **Answer Tracking**: Visual indication of answered/unanswered questions
- **Security Measures**: 
  - Prevent back navigation during exam
  - Disable copy-paste and right-click
  - Tab switching detection

### Results & Analytics
- **Instant Results**: Immediate score calculation after submission
- **Detailed Analysis**: Question-by-question review with correct answers
- **Ranking System**: Automated ranking based on performance
- **Performance Metrics**: Pass/fail status, percentage, rank
- **Print Support**: Print-friendly result pages
- **Leaderboard**: Rankings for each exam

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt.js** - Password hashing
- **Winston** - Logging framework
- **Multer** - File upload handling
- **CSV Parser** - Bulk question imports

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **Vanilla JavaScript** - No frameworks, pure JS
- **Responsive Design** - Mobile-first approach

### Security & Middleware
- **Helmet.js** - Security headers
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation
- **CORS** - Cross-Origin Resource Sharing
- **Cookie Parser** - Cookie handling

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Download](https://www.mysql.com/)
- **npm** (comes with Node.js)
- A text editor (VS Code, Sublime Text, etc.)

## 📦 Installation

### 1. Clone or Download the Project
```bash
git clone <repository-url>
cd "Aptitude Test Website"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create Database
```sql
CREATE DATABASE online_exam_system;
```

#### Run Schema
```bash
# Using MySQL command line
mysql -u root -p online_exam_system < database/schema.sql

# Or import through MySQL Workbench
```

#### Seed Sample Data (Optional)
```bash
mysql -u root -p online_exam_system < database/seed.sql
```

### 4. Environment Configuration

Create a `.env` file in the root directory:
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=online_exam_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important**: Replace `your_mysql_password` and `your_super_secret_jwt_key_here` with your actual values.

### 5. Create Required Directories

The following directories should exist (create if missing):
```bash
mkdir -p uploads/csv
mkdir -p logs
```

### 6. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on port 3002 (configurable via `.env` file).  
Access at: `http://localhost:3002`

**Note**: All URLs use clean routing (no `.html` extensions visible in browser).  
Examples: `/login`, `/admin-dashboard`, `/student-dashboard`

## 🔑 Default Credentials

After running the seed file and password fix, you can login with:

**✓ All passwords have been properly hashed with bcrypt for security.**

### Admin Account
- **Email**: admin@college.edu
- **Password**: admin123
- **Access**: Full system access - manage all exams, questions, teachers, students, and view all results

### Teacher Accounts
- **Email**: dr.sharma@college.edu | **Password**: teacher123
- **Email**: prof.patel@college.edu | **Password**: teacher123
- **Email**: dr.kumar@college.edu | **Password**: teacher123
- **Access**: Create/manage own exams, add questions, view student results for their exams

### Student Accounts
- **Email**: john.doe@student.edu | **Password**: student123
- **Email**: jane.smith@student.edu | **Password**: student123
- **Email**: alice.johnson@student.edu | **Password**: student123
- **Email**: bob.williams@student.edu | **Password**: student123
- **Email**: charlie.brown@student.edu | **Password**: student123
- **Access**: Take exams, view their own results and history

## 📁 Project Structure

```
Aptitude Test Website/
├── config/
│   ├── database.js          # MySQL connection configuration
│   └── logger.js             # Winston logger setup
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── examController.js     # Exam CRUD operations
│   ├── questionController.js # Question management
│   ├── examTakeController.js # Exam taking logic
│   └── resultController.js   # Results & analytics
├── database/
│   ├── schema.sql            # Database schema with tables, views, procedures
│   └── seed.sql              # Sample data for testing
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   ├── validation.js         # Input validation rules
│   ├── errorHandler.js       # Centralized error handling
│   └── security.js           # Security configurations
├── models/
│   ├── User.js               # User model
│   ├── Student.js            # Student model
│   ├── Exam.js               # Exam model
│   ├── Question.js           # Question model
│   ├── ExamAttempt.js        # Exam attempt tracking
│   ├── Answer.js             # Student answers
│   └── Result.js             # Results & rankings
├── routes/
│   ├── authRoutes.js         # Authentication routes
│   ├── examRoutes.js         # Exam routes
│   ├── questionRoutes.js     # Question routes
│   ├── examTakeRoutes.js     # Exam taking routes
│   ├── resultRoutes.js       # Result routes
│   └── index.js              # Route aggregator
├── services/
│   └── csvService.js         # CSV parsing service
├── utils/
│   ├── jwtService.js         # JWT token utilities
│   └── helpers.js            # Helper functions
├── public/
│   ├── index.html            # Landing page
│   ├── login.html            # Login/Register page
│   ├── student-dashboard.html # Student interface
│   ├── admin-dashboard.html  # Admin interface
│   ├── exam.html             # Exam taking interface
│   ├── result.html           # Result display
│   ├── css/
│   │   └── style.css         # Complete styling
│   └── js/
│       ├── auth.js           # Authentication JS
│       ├── student-dashboard.js # Student dashboard JS
│       ├── admin-dashboard.js   # Admin dashboard JS
│       ├── exam.js           # Exam taking JS
│       └── result.js         # Result display JS
├── uploads/                  # CSV upload directory
├── logs/                     # Application logs
├── .env                      # Environment variables
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
├── server.js                 # Main entry point
└── README.md                 # Documentation
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Exams (Admin)
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get single exam
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Questions (Admin)
- `GET /api/questions/exam/:examId` - Get questions for exam
- `POST /api/questions` - Add single question
- `POST /api/questions/bulk-upload` - Upload CSV questions
- `DELETE /api/questions/:id` - Delete question
- `GET /api/questions/csv-template` - Download CSV template

### Exam Taking (Student)
- `GET /api/exam-take/:examId/questions` - Get exam questions
- `POST /api/exam-take/start` - Start exam attempt
- `POST /api/exam-take/save-progress` - Auto-save answers
- `POST /api/exam-take/submit` - Submit exam

### Results
- `GET /api/results/attempt/:attemptId` - Get result by attempt
- `GET /api/results/attempt/:attemptId/details` - Get detailed answers
- `GET /api/results/exam/:examId` - Get all results for exam (Admin)
- `GET /api/results/exam/:examId/analytics` - Get exam analytics (Admin)
- `GET /api/results/student/:studentId` - Get student results (Admin)

## 📤 CSV Upload Format

For bulk question upload, use the following CSV format:

```csv
question_text,option_a,option_b,option_c,option_d,correct_option,marks
"What is 2+2?","3","4","5","6","B",1
"Capital of France?","Berlin","Madrid","Paris","Rome","C",1
```

Download the template from the admin dashboard.

## 🔧 Configuration Options

### Rate Limiting
Edit `middleware/security.js` to adjust rate limits:
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Exam submit: 30 requests per minute

### Session Duration
Edit `.env` to change JWT expiration:
```env
JWT_EXPIRE=7d        # Token validity
JWT_COOKIE_EXPIRE=7  # Cookie validity in days
```

### Database Pool
Edit `config/database.js` to adjust connection pool:
```javascript
connectionLimit: 10  // Maximum connections
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
Error: ER_ACCESS_DENIED_ERROR
```
**Solution**: Check DB_USER and DB_PASSWORD in `.env` file

### Port Already in Use
```bash
Error: listen EADDRINUSE :::3000
```
**Solution**: Change PORT in `.env` or kill process using port 3000

### Module Not Found
```bash
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` to install dependencies

### CSV Upload Fails
**Solution**: 
- Check uploads/csv directory exists
- Ensure CSV format matches template
- Check file size (max 5MB)

### Login Fails After 5 Attempts
**Solution**: Account is locked. Update database:
```sql
UPDATE users SET login_attempts = 0, is_locked = 0 WHERE email = 'user@example.com';
```

## 📊 Database Schema

The system uses 9 main tables:
- **users** - User accounts and authentication (admin, teacher, student)
- **students** - Student profile information
- **teachers** - Teacher profile information
- **exams** - Exam definitions
- **questions** - Question bank
- **exam_attempts** - Exam sessions
- **student_answers** - Student responses
- **results** - Calculated results and rankings
- **activity_logs** - System activity tracking

Plus 2 views:
- **vw_student_results** - Consolidated result view
- **vw_active_exams** - Active exams with question counts

And 1 stored procedure:
- **calculate_rankings** - Automatic ranking calculation

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CSRF Protection**: Cookie-based token validation
- **Account Locking**: After failed login attempts
- **Activity Logging**: Track suspicious activities

## 📝 Development

### Adding New Features

1. Create model in `models/`
2. Add controller in `controllers/`
3. Define routes in `routes/`
4. Update database schema if needed
5. Add frontend interface in `public/`

### Running Tests
```bash
npm test  # Add your test scripts
```

### Code Style
- Use async/await for asynchronous operations
- Follow MVC architecture pattern
- Add JSDoc comments for functions
- Use meaningful variable names
- Handle errors appropriately

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed for educational purposes.

## 👨‍💻 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Check application logs in `logs/` directory

## 🎓 Credits

Developed for college examination management system.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
