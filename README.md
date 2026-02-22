# Kodbank App

A full-stack banking simulation web application with user registration, login, balance checking, and money transfer features.

## Features

- **User Registration**: Create a new bank account with email, password, name, and optional initial balance
- **User Login**: Secure authentication with JWT tokens stored in HTTP-only cookies
- **Check Balance**: View current account balance
- **Transfer Money**: Transfer funds to other users by email address
- **Secure Authentication**: JWT-based authentication with token storage in database

## Tech Stack

### Backend
- Node.js with Express.js
- SQLite3 database
- JWT (JSON Web Tokens) for authentication
- bcryptjs for password hashing
- cookie-parser for cookie management

### Frontend
- React 18
- Vite for build tooling
- React Router for navigation
- Axios for API calls
- Modern CSS with gradient design

## Database Schema

### Table 1: bank_users
- `cust_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `cust_name` (TEXT NOT NULL)
- `cust_pwd` (TEXT NOT NULL) - Hashed password
- `balance` (REAL DEFAULT 0.0)
- `email` (TEXT UNIQUE NOT NULL)

### Table 2: bank_user_tokens
- `token_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `token_value` (TEXT NOT NULL)
- `cust_id` (INTEGER NOT NULL)
- `expiry_time` (INTEGER NOT NULL)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. Start the backend server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Registration**: 
   - Enter your name, email, password, and optional initial balance
   - Click "Register" to create an account

2. **Login**:
   - Enter your email and password
   - Upon successful login, a JWT token is stored in an HTTP-only cookie

3. **Dashboard**:
   - View your account information
   - Check your current balance
   - Transfer money to other users by entering their email address and amount

4. **Logout**:
   - Click the "Logout" button to end your session

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login and receive JWT token
- `POST /api/logout` - Logout and clear token

### Protected Routes (require authentication)
- `GET /api/user` - Get current user information
- `GET /api/balance` - Get current account balance
- `POST /api/transfer` - Transfer money to another user

## Security Features

- Passwords are hashed using bcryptjs
- JWT tokens stored in HTTP-only cookies (prevents XSS attacks)
- Token expiry set to 24 hours
- Token storage in database for tracking
- CORS configured for frontend origin only

## Notes

- The database file (`kodbank.db`) is created automatically on first run
- Make sure to change the JWT_SECRET in production
- The app uses SQLite for simplicity, but can be easily adapted to PostgreSQL or MySQL
