const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const testRouter = require('./routers/test');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use('/', testRouter);

app.listen(process.env.PORT, () => {
    console.log('Listening on port', process.env.PORT);
})