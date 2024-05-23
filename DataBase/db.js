const mongoose = require('mongoose');


// Production
// mongoose.connect(process.env.DATABASE_URL)
// .then(() => {
//   console.log("Database Connected..");
// })
// .catch(() => {
//   console.log("Database Not Connected");
// });



// Local Dev
const db = mongoose.connect('mongodb://localhost/FoodieBlog',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
module.exports = db