// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const connectDB = require('./mongoDB/db');
const { handleUserMsg } = require('./controllers/userControl');
const dashboardController = require('./controllers/dashboardControl');
const dashboardRoutes = require('./router/dashBoardRoute');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./router/authRoute');
const User = require('./models/userDetails');
require('dotenv').config();

// --- INITIAL SETUP ---
connectDB();
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'..', 'views'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES ---
app.use('/auth', authRoutes);
app.use('/', dashboardRoutes);

app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/chatbot', authMiddleware, (req, res) => res.render('chatbot'));
app.get('/dashboard', authMiddleware, dashboardController.showDashboard);
app.get('/dashboard', authMiddleware, (req, res) => res.redirect('/api/hr/dashboard'));

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', async (socket) => {
  console.log('🌐 Client connected:', socket.id);

  const cookieStr = socket.handshake.headers.cookie;
  const token = cookieStr
    ?.split('; ')
    .find(c => c.startsWith('token='))
    ?.split('=')[1];

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (user) {
        user.socketId = socket.id;
        await user.save();
        console.log('✅ socketId saved for:', user.email);

        // ✅ Greet immediately after login/register
        handleUserMsg(socket, '__init__');
      }
    } catch (err) {
      console.error('⚠️ JWT error in socket connection:', err.message);
    }
  }

  // ✅ Main chatbot communication
  socket.on('user-message', (msg) => {
    console.log('📩 Received message:', msg);
    handleUserMsg(socket, msg);
  });

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 6336;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
