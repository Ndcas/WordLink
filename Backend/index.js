const express = require('express');
require('dotenv').config();
const testRouter = require('./routers/test');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

app.use('/', testRouter);

let port = process.env.APP_PORT;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});