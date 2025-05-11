const express = require('express');
require('dotenv').config();
const testRouter = require('./routers/test');
const accountRouter = require('./routers/account');

const port = process.env.APP_PORT;

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

app.use('/', testRouter);

app.use('/account', accountRouter);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});