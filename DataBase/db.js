const mongoose = require('mongoose');

const db = mongoose.connect('mongodb://localhost/FoodieBlog',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
module.exports = db