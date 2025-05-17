const express = require('express');
require('dotenv').config();
const testRouter = require('./routers/test');
const accountRouter = require('./routers/account');
const http = require('http');
const { Server } = require('socket.io');
const gameHandler = require('./services/game');

const port = process.env.APP_PORT;

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

app.use('/', testRouter);

app.use('/account', accountRouter);

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

const io = new Server(server);

io.on('connection', (socket) => {
    gameHandler.connect(socket);
    gameHandler.playWithBot(socket);
    gameHandler.playWithPlayer(socket);
    gameHandler.undexpectedDisconnection(socket);
});