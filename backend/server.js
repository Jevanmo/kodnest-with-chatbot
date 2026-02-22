const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database setup
const dbPath = path.join(__dirname, 'kodbank.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Table 1: Bank user details
  db.run(`CREATE TABLE IF NOT EXISTS bank_users (
    cust_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cust_name TEXT NOT NULL,
    cust_pwd TEXT NOT NULL,
    balance REAL DEFAULT 0.0,
    email TEXT UNIQUE NOT NULL
  )`);

  // Table 2: JWT token storage
  db.run(`CREATE TABLE IF NOT EXISTS bank_user_tokens (
    token_id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_value TEXT NOT NULL,
    cust_id INTEGER NOT NULL,
    expiry_time INTEGER NOT NULL,
    FOREIGN KEY (cust_id) REFERENCES bank_users(cust_id)
  )`);

  // Table 3: Transaction history
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL DEFAULT 'transfer',
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES bank_users(cust_id),
    FOREIGN KEY (recipient_id) REFERENCES bank_users(cust_id)
  )`);
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
};

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { cust_name, cust_pwd, email, initial_balance } = req.body;

    if (!cust_name || !cust_pwd || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    db.get('SELECT * FROM bank_users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(cust_pwd, 10);
      const balance = initial_balance || 0.0;

      // Insert new user
      db.run(
        'INSERT INTO bank_users (cust_name, cust_pwd, email, balance) VALUES (?, ?, ?, ?)',
        [cust_name, hashedPassword, email, balance],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to register user' });
          }
          res.status(201).json({
            message: 'User registered successfully',
            cust_id: this.lastID
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, cust_pwd } = req.body;

    if (!email || !cust_pwd) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    db.get('SELECT * FROM bank_users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(cust_pwd, user.cust_pwd);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { cust_id: user.cust_id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Calculate expiry time (24 hours from now)
      const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      // Store token in database
      db.run(
        'INSERT INTO bank_user_tokens (token_value, cust_id, expiry_time) VALUES (?, ?, ?)',
        [token, user.cust_id, expiryTime],
        (err) => {
          if (err) {
            console.error('Error storing token:', err);
          }
        }
      );

      // Set token as HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        message: 'Login successful',
        user: {
          cust_id: user.cust_id,
          cust_name: user.cust_name,
          email: user.email,
          balance: user.balance
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout endpoint
app.post('/api/logout', authenticateToken, (req, res) => {
  // Delete token from database
  const token = req.cookies.token;
  db.run('DELETE FROM bank_user_tokens WHERE token_value = ?', [token], (err) => {
    if (err) {
      console.error('Error deleting token:', err);
    }
  });

  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Check balance endpoint
app.get('/api/balance', authenticateToken, (req, res) => {
  db.get('SELECT balance FROM bank_users WHERE cust_id = ?', [req.user.cust_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ balance: row.balance });
  });
});

// Transfer money endpoint
app.post('/api/transfer', authenticateToken, (req, res) => {
  const { recipient_email, amount } = req.body;

  if (!recipient_email || !amount) {
    return res.status(400).json({ error: 'Recipient email and amount are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  const senderId = req.user.cust_id;

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Get sender balance and email
    db.get('SELECT balance, cust_name, email FROM bank_users WHERE cust_id = ?', [senderId], (err, sender) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Database error' });
      }

      if (!sender) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Sender not found' });
      }

      if (sender.balance < amount) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const senderEmail = sender.email;

      // Get recipient
      db.get('SELECT cust_id, cust_name, balance FROM bank_users WHERE email = ?', [recipient_email], (err, recipient) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Database error' });
        }

        if (!recipient) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Recipient not found' });
        }

        if (senderId === recipient.cust_id) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }

        // Update sender balance
        db.run(
          'UPDATE bank_users SET balance = balance - ? WHERE cust_id = ?',
          [amount, senderId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to update sender balance' });
            }

            // Update recipient balance
            db.run(
              'UPDATE bank_users SET balance = balance + ? WHERE cust_id = ?',
              [amount, recipient.cust_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to update recipient balance' });
                }

                // Get updated sender balance
                db.get('SELECT balance FROM bank_users WHERE cust_id = ?', [senderId], (err, updatedSender) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error' });
                  }

                  db.run('COMMIT');

                  // Record transaction after successful transfer
                  const timestamp = Math.floor(Date.now() / 1000);
                  db.run(
                    'INSERT INTO transactions (sender_id, recipient_id, sender_email, recipient_email, amount, transaction_type, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [senderId, recipient.cust_id, senderEmail, recipient_email, amount, 'transfer', timestamp],
                    (err) => {
                      if (err) {
                        console.error('Error recording transaction:', err);
                      }
                    }
                  );

                  res.json({
                    message: 'Transfer successful',
                    new_balance: updatedSender.balance,
                    recipient_name: recipient.cust_name
                  });
                });
              }
            );
          }
        );
      });
    });
  });
});

// Get user info endpoint
app.get('/api/user', authenticateToken, (req, res) => {
  db.get(
    'SELECT cust_id, cust_name, email, balance FROM bank_users WHERE cust_id = ?',
    [req.user.cust_id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Get transaction history endpoint
app.get('/api/transactions', authenticateToken, (req, res) => {
  const userId = req.user.cust_id;

  db.all(
    `SELECT 
      transaction_id,
      sender_id,
      recipient_id,
      sender_email,
      recipient_email,
      amount,
      transaction_type,
      timestamp,
      CASE 
        WHEN sender_id = ? THEN 'sent'
        WHEN recipient_id = ? THEN 'received'
      END as transaction_direction
    FROM transactions 
    WHERE sender_id = ? OR recipient_id = ?
    ORDER BY timestamp DESC
    LIMIT 50`,
    [userId, userId, userId, userId],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Format transactions with readable date
      const formattedTransactions = transactions.map(transaction => ({
        ...transaction,
        date: new Date(transaction.timestamp * 1000).toLocaleString()
      }));

      res.json({ transactions: formattedTransactions });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
