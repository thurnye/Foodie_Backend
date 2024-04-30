const mongoose = require('mongoose');
const {Schema} = mongoose;


const recipesSchema = new Schema({
    recipeName: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    duration: {type: String, required: true},
    level: {
        type: String, required: true
    },
    serving: {
        type: String, required: true
    },
    thumbnail: {
        type: String,
        require: true
    },
    tags: [{
        type: String, 
        required: true
    }],
    category: [
        {type: String, required: true}],

    rating: {
        type: Number,
        require: true
    },
    notes: [{
        type: Object, required: true
    }],
    mainIngredients: [{
        type: Object, required: true
    }],
    dressingIngredients: [{
        type: Object, required: true
    }],
    nutritionFacts: [{
        type: Object, required: true
    }],
    directions: [{
        type: Object, required: true
    }],
    reviews: [{
        review: {
        type: Schema.Types.ObjectId,
        ref: 'Reviews',
        }
    }],
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

module.exports = mongoose.model('Recipes', recipesSchema);