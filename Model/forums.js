const mongoose = require('mongoose');
const {Schema} = mongoose;


const forumsSchema = new Schema({
    forumName: {
        type: String,
        require: true
    },
    forumTotalMembers: {
        type: Number,
    },
    forumTotalGroups: {
        type: Number,
    },
},
{
    timestamps: true
  }
)

module.exports = mongoose.model('Forums', forumsSchema);