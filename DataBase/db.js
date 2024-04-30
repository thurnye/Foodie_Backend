const mongoose = require('mongoose');


// Production
const db =  mongoose.connect(process.env.DATABASE_URL,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Database Connected..");
})
.catch(() => {
  console.log("Database Not Connected");
});
module.exports = db


// Local Dev
// const db = mongoose.connect('mongodb://localhost/FoodieBlog',{
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
// module.exports = db