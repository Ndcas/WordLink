const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { rateLimit } = require('express-rate-limit');
const { slowDown } = require('express-slow-down');
const initAssociation = require('./services/association');
const testRouter = require('./routers/test');
const accountRouter = require('./routers/account');
const bookmarkRouter = require('./routers/bookmark');
const wordRouter = require('./routers/word');
const wordmeaningRouter = require('./routers/wordmeaning');
const matchhistoryRouter = require('./routers/matchhistory');
const avatarImageRouter = require('./routers/avatarimage');
const gameHandler = require('./services/game');

const port = process.env.APP_PORT;

initAssociation();

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

const limiter = rateLimit({
    windowMs: 60000,
    max: 30
});

app.use(limiter);

const slower = slowDown({
    windowMs: 60000,
    delayAfter: 10,
    delayMs: () => 300
});

app.use(slower);

app.use('/assets', express.static('assets'));

app.use('/', testRouter);

app.use('/account', accountRouter);

app.use('/bookmark', bookmarkRouter);

app.use('/word', wordRouter);

app.use('/wordMeaning', wordmeaningRouter);

app.use('/matchHistory', matchhistoryRouter);

app.use('/avatarImage', avatarImageRouter);

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

const io = new Server(server);

io.on('connection', (socket) => {
    socket.data = { guest: true };
    gameHandler.connect(socket);
    gameHandler.playWithBot(socket);
    gameHandler.playWithPlayer(socket);
    gameHandler.unexpectedDisconnection(socket);
});