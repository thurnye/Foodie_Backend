const mongoose = require('mongoose');
const { Schema } = mongoose;

const autoCompleteSchema = new Schema(
  {
    title: { type: String, required: true },
    section: {
      type: String,
      required: true,
      enum: ['category', 'recipe', 'event', 'author', 'forum', 'group'],
    },
    refId: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('autoComplete', autoCompleteSchema);
