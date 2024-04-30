const mongoose = require('mongoose');
const {Schema} = mongoose;


const fileSchema = new Schema({
    fileName: {
        type: String,
        require: true
    },
    isDeleted: {
        type: Number,
        require: true
    },
    isThumbNail: {
        type: Boolean,
        require: true
    },
    isRecipe: {
        type: Boolean,
        require: true
    },
    isAvatar: {
        type: Boolean,
        require: true
    },
    recipeId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Recipes'
    },
    
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
},
{
    timestamps: true
  }
)

module.exports = mongoose.model('FoodBlogImgs', fileSchema);