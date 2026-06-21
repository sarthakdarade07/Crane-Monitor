const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST', 'PATCH']
  }
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

// Initialize database
initDB().then(() => {
  console.log('Database initialized successfully.');
}).catch(err => {
  console.error('Failed to initialize database. Ensure PostgreSQL is running and DATABASE_URL is correct.', err);
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Role Checking Middleware (Optional for future use)
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];

    if (user.is_blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by an administrator.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/readings — validate incoming payloads and store readings
app.post('/api/readings', authenticateToken, async (req, res) => {
  const { crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status } = req.body;

  if (!crane_id || !ts || load_kg === undefined || motor_temp_c === undefined || vibration_mm_s === undefined || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const insertReadingQuery = `
      INSERT INTO readings (crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const result = await pool.query(insertReadingQuery, [crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status]);
    const newReading = result.rows[0];

    // Broadcast new reading to all connected clients
    io.emit('new_reading', newReading);

    // Check for high motor temp threshold
    if (motor_temp_c > 80) {
      const message = `CR-101 motor temp ${motor_temp_c}°C exceeds threshold`;
      const fullLogMsg = `ALERT: ${message}`;
      console.log(fullLogMsg);

      const insertAlertQuery = `
        INSERT INTO alerts (crane_id, message)
        VALUES ($1, $2) RETURNING *;
      `;
      const alertResult = await pool.query(insertAlertQuery, [crane_id, message]);
      
      // Broadcast new alert
      io.emit('new_alert', alertResult.rows[0]);
    }

    res.status(201).json(newReading);
  } catch (err) {
    console.error('Error inserting reading:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/readings/latest — returns the most recent reading for each crane
app.get('/api/readings/latest', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (crane_id) *
      FROM readings
      ORDER BY crane_id, ts DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching latest readings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/readings/range — returns readings for a crane within a specified time range
app.get('/api/readings/range', authenticateToken, async (req, res) => {
  const { crane_id, start, end } = req.query;

  if (!crane_id || !start || !end) {
    return res.status(400).json({ error: 'Missing crane_id, start, or end parameters' });
  }

  try {
    const query = `
      SELECT * FROM readings
      WHERE crane_id = $1 AND ts >= $2 AND ts <= $3
      ORDER BY ts ASC;
    `;
    const result = await pool.query(query, [crane_id, start, end]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching range readings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alerts — returns all triggered alerts
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const query = `SELECT * FROM alerts ORDER BY created_at DESC;`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users — returns all registered users (Admin only)
app.get('/api/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const query = `SELECT id, username, role, is_blocked FROM users ORDER BY id ASC;`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id/block — toggle blocked status (Admin only)
app.patch('/api/users/:id/block', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const userId = req.params.id;
  const { is_blocked } = req.body;
  try {
    // Prevent admin from blocking themselves (assuming admin is id=1, or check username)
    // For safety, let's check the username of the user being blocked
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (userResult.rows[0].username === 'admin') return res.status(403).json({ error: 'Cannot block the primary admin' });

    const query = `UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, username, is_blocked;`;
    const result = await pool.query(query, [is_blocked, userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating block status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id/password — change user password (Admin only)
app.patch('/api/users/:id/password', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const userId = req.params.id;
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ error: 'Missing new_password' });

  try {
    const hash = await bcrypt.hash(new_password, 10);
    const query = `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username;`;
    const result = await pool.query(query, [hash, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/readings/all — fetch latest 200 readings globally
app.get('/api/readings/all', authenticateToken, async (req, res) => {
  try {
    const query = `SELECT * FROM readings ORDER BY ts DESC LIMIT 200;`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching global readings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
