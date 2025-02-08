const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3002;

// Game rooms storage
const gameRooms = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  port: 3307,
  user: 'admin',
  password: 'admin_password',
  database: 'lichess',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// WebSocket game logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new game room
  socket.on('createGame', () => {
    const roomId = uuidv4();
    const color = Math.random() < 0.5 ? 'white' : 'black';
    
    gameRooms.set(roomId, {
      players: [{
        socketId: socket.id,
        color: color
      }],
      gameState: 'waiting' // waiting, playing, finished
    });

    socket.join(roomId);
    socket.emit('gameCreated', { roomId, color });
  });

  // Join an existing game
  socket.on('joinGame', (roomId) => {
    const room = gameRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Game room not found');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', 'Game room is full');
      return;
    }

    const opponentColor = room.players[0].color === 'white' ? 'black' : 'white';
    room.players.push({
      socketId: socket.id,
      color: opponentColor
    });

    socket.join(roomId);
    room.gameState = 'playing';

    // Notify both players that the game is starting
    io.to(roomId).emit('gameStart', {
      white: room.players.find(p => p.color === 'white').socketId,
      black: room.players.find(p => p.color === 'black').socketId
    });
  });

  // Handle moves
  socket.on('move', ({ roomId, move }) => {
    const room = gameRooms.get(roomId);
    if (room && room.gameState === 'playing') {
      socket.to(roomId).emit('move', move);
    }
  });

  // Handle game end
  socket.on('gameOver', ({ roomId, result }) => {
    const room = gameRooms.get(roomId);
    if (room) {
      room.gameState = 'finished';
      io.to(roomId).emit('gameOver', result);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [roomId, room] of gameRooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        io.to(roomId).emit('playerDisconnected');
        gameRooms.delete(roomId);
        break;
      }
    }
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      res.status(201).json({ message: 'User registered successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [user] = await connection.query(
        'SELECT id, username, email, elo, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      res.json(user[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
