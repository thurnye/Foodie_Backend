const express = require('express');
const path = require('path');
const logger = require('morgan');
require('dotenv').config()
require('./DataBase/index');
const route = require('./Routes/routes');

const PORT = process.env.PORT || 8000;
const app = express();

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));

app.use(logger('dev'));
app.use(express.json());

//STATIC FOLDER
app.use(express.static(path.join(__dirname,'../client/build')));

//SETTING HEADER FOR ACCESS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, CREATE, DELETE, DESTROY');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(route);

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// this will change and redirect the backend request for the webcon app to localhost: 9000
// app.use('/webCon', createProxyMiddleware({target: 'http://localhost:9000', changeOrigin: true}));

app.listen(PORT, () => {
console.log(`Server started on port ${PORT}`);
});
