const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io')
const connectDB = require('./mongoDB/db');
const { handleUserMsg } = require('./controllers/userControl');
require('dotenv').config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('home');
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {
    console.log(`new client connected, ${socket.id}`);

    socket.on('user-message', (msg) => {
        handleUserMsg(socket, msg);
    });



    socket.on('disconnect', () => {
        console.log(`client disconnected, ${socket.id}`);

    });
});


const PORT = process.env.PORT || 6336;

server.listen(PORT, () => {
    console.log(`server is lsitening at ${PORT}`);

})


