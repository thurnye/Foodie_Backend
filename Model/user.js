var mongoose = require('mongoose');
const {Schema} = mongoose


const userSchema = new Schema({
    
  firstName: {
    type: Schema.Types.String,
  },
  lastName: {
    type: Schema.Types.String,
  },
  email: {
    type: Schema.Types.String,
  },
  password: {
    type: Schema.Types.String,
  },
  avatar: {
    type: Schema.Types.String,
  },
  slogan: {
    type: Schema.Types.String,
  },
  aboutMe: {
    type: Schema.Types.String,
  },
  location: {
    type: Schema.Types.String,
  },
  resourceInfo: {
    type: Schema.Types.String,
  },
  resourceList:[{
    type: Object
  }],
  socialMedia:[{
    type: Object
  }],
  myRecipes: [{
      recipe: {
        type: Schema.Types.ObjectId,
        ref: 'Recipes',
      }
    }
  ],
  events: {
      myEvents: [{
        type: Schema.Types.ObjectId,
        ref: 'Events',
      }]
    }
  ,
  images: [{
      recipe: {
        type: Schema.Types.ObjectId,
        ref: 'FoodBlogImgs',
      }
    }
  ],
  bookmarks: [{
      recipe: {
        type: Schema.Types.ObjectId,
        ref: 'Recipes',
      }
    }
  ],
  favorites: [{
      recipe: {
        type: Schema.Types.ObjectId,
        ref: 'Recipes',
      }
    }
  ],
  followers: {
    type: Number
  } 
},
   
{
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
