const mongoose = require('mongoose');
const { Schema } = mongoose;

const recipeSchema = new Schema(
  {
    basicInfo: {
      recipeName: { type: String, required: true },
      duration: {
        value: { type: String, required: true },
        label: { type: String, required: true },
      },
      level: {
        value: { type: String, required: true },
        label: { type: String, required: true },
      },
      serving: {
        value: { type: String, required: true },
        label: { type: String, required: true },
      },
      tags: [
        {
          value: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      categories: [
        {
          value: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
    },
    details: {
      thumbnail: { type: String, required: true },
      about: [
        {
          type: {
            type: String,
            required: true,
            enum: ['text', 'image', 'video'],
          },
          value: { type: Object, required: true },
          isUnsplash: { type: Boolean },
          isMultiple: { type: Boolean },
        },
      ],
      faqs: [
        {
          ques: { type: String },
          ans: { type: String },
        },
      ],
    },
    nutritionalFacts: [
      {
        name: { type: String, required: true },
        amount: { type: String, required: true },
        unit: { type: String, required: true },
      },
    ],
    directions: {
      methods: [
        {
          step: [
            {
              type: {
                type: String,
                required: true,
                enum: ["title", 'text', 'image', 'video'],
              },
              value: { type: Object, required: true },
              isUnsplash: { type: Boolean },
              isMultiple: { type: Boolean },
            },
          ],
        },
      ],
      ingredients: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true, enum: ['main', 'dressing'] },
        },
      ],
    },

    reviews: [
      {
        review: {
          type: Schema.Types.ObjectId,
          ref: 'Reviews',
        },
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('recipe', recipeSchema);
