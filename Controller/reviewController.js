const Review = require('../Model/review');
const Recipe = require('../Model/recipe');

//Post a Review
const postReview = async (req, res, next) => {
  try {
    const recipeId = req.body.recipeId;
    const newReview = new Review({
      review: req.body.review,
      rating: req.body.ratings,
      userId: req.body.userId,
      recipeId: recipeId,
    });
    const savedReview = await newReview.save();

    const reviewId = { review: savedReview._id };
    const foundRecipe = await Recipe.findById(recipeId);
    foundRecipe.reviews.push(reviewId);

    const recipe = await foundRecipe.save();

    // console.log(recipe)
    res.status(200).json();
  } catch (err) {
    res.status(400).json(err);
  }
};

module.exports = {
  postReview,
};
