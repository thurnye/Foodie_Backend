const Recipe = require('../Model/recipe');
const User = require('../Model/user');
const Review = require('../Model/review');
const jwt = require('jsonwebtoken');
const AutoComplete = require('../Model/autoComplete');
const redisClient = require('../Utils/redisClient');

//Create New Recipe
const postRecipe = async (req, res, next) => {
  try {
    console.log('BODY:::', req.body);
    const { _id, basicInfo, details, directions, nutritionalFacts } = req.body;
    const loggedUserId = req.params.userId;
    const foundUser = await User.findById(loggedUserId)
      .populate({
        path: 'myRecipes.recipe',
      })
      .exec();

    let data = {};

    if (_id) {
      //update
      console.log('Updating....');
      const recipe = await Recipe.findById(_id);
      if (recipe.author.toString() === loggedUserId.toString()) {
        (recipe.basicInfo = basicInfo),
          (recipe.details = details),
          (recipe.directions = directions),
          (recipe.nutritionalFacts = nutritionalFacts),
          recipe.save();
      }
      data = recipe;
    }
    if (!_id) {
      //create
      const newRecipe = new Recipe({
        author: loggedUserId,
        basicInfo,
        details,
        directions,
        nutritionalFacts,
      });
      let savedRecipe = await newRecipe.save();
      const recipeId = { recipe: savedRecipe._id };

      foundUser.myRecipes.push(recipeId);
      const newData = new AutoComplete({
        title: basicInfo.recipeName,
        section: 'recipe',
      });
      data = await newData.save();
      await foundUser.save();
    }

    // foundUser
    //   .populate({
    //     path: 'myRecipes.recipe',
    //   })
    //   .exec();

    res.status(200).json(data._id);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

//RETRIEVE AN AUTHOR Recipes

const getAUserRecipes = async (req, res, next) => {
  try {
    console.log(req.body);
    const author = req.params.id;
    const perPage = req.body.perPage || 9;
    const page = req.body.currentPage || 1;
    const cacheKey = `recipes:${author}_${perPage}_${page}`;

    const count = await Recipe.find({ author: author }).countDocuments();
    // console.log(count);
    const skip = req.body.skip;
    const isScrollLoad = req.body.isScrollLoad;

    const recipes = await Recipe.find({ author: author })
      .skip(isScrollLoad ? skip : perPage * page - perPage)
      .limit(perPage)
      .select('_id details.thumbnail basicInfo.recipeName createdAt')
      .exec();
    const data = {
      recipes,
      count: Math.ceil(count),
    };

    // Cache the data in Redis
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 }); // Cache for 1 hour

    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

//RETRIEVE ALL RECIPES BY PAGINATION
const getAllRecipes = async (req, res, next) => {
  try {
    console.log(req.body);
    // const count = await Recipe.find().countDocuments();
    const perPage = req.body.perPage || 9;
    const page = req.body.currentPage || 1;
    const cacheKey = `recipes:all_${perPage}_${page}`;

    const recipes = await Recipe.find({})
      .skip(perPage * page - perPage)
      .limit(perPage)
      .select(
        '_id details.thumbnail basicInfo.recipeName basicInfo.level basicInfo.duration'
      )
      //   .populate('author')
      .exec();
    const data = {
      recipes,
      // count: Math.ceil(count / perPage),
    };
    // Cache the data in Redis
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3 }); // 3mins

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err);
  }
};

//RETRIEVE ALL  QUERY RECIPES
const getQueryRecipes = async (req, res, next) => {
  try {
    console.log(req.body);
    let categories, tags, keyword;
    const page = req.body.currentPage;
    const query = {};
    const isFilter = req.body.filter?.isFilter;
    const perPage = 24;
    const cacheKey = `recipes:all_${perPage}_${page}`;

    if (req.body.filter?.isFilter) {
      const filter = req.body.filter;
      categories = filter?.categories;
      keyword = filter?.keywordSearch;
      tags = filter?.tags;

      if (keyword) {
        query['basicInfo.recipeName'] = new RegExp(keyword, 'i');
      }
      if (tags) {
        query['basicInfo.tags.value'] = { $in: tags };
      }
      if (categories) {
        query['basicInfo.categories.value'] = { $in: categories };
      }
    }

    const count = await Recipe.find(query).countDocuments();
    const recipes = await Recipe.find(query)
      .skip(perPage * page - perPage)
      .limit(perPage)
      .select(
        '_id details.thumbnail basicInfo.recipeName basicInfo.level basicInfo.duration'
      )
      .exec();

    const data = {
      recipes,
      count: Math.ceil(count / perPage),
    };

    if (!isFilter) {
      await redisClient.set(cacheKey, JSON.stringify(data), { EX: 180 }); // 3 minutes
    }

    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

//RETRIEVE A Recipe BY ID
const getOneRecipe = async (req, res, next) => {
  try {
    const recipeId = req.params.id;
    const recipeData = await Recipe.findById(recipeId)
      .populate({
        path: 'reviews.review',
        populate: {
          path: 'userId',
          select: '_id firstName lastName avatar',
        },
      })
      .populate({
        path: 'author',
        select: '_id firstName lastName avatar slogan',
      })
      .exec();

    if (recipeData.reviews.length > 0) {
      const rating = [];
      recipeData.reviews.map((el) => rating.push(parseInt(el.review.rating)));
      const sum = rating.reduce((a, b) => a + b);
      const average = sum / rating.length;
      recipeData.rating = average.toFixed(1);
      const recipe = await recipeData.save();
      res.status(200).json(recipe);
    } else {
      res.status(200).json(recipeData);
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

//DELETING A RECIPE
const postDeleteARecipe = async (req, res, next) => {
  try {
    // console.log(req.params.id)
    const recipeId = req.params.id;
    let authorId = '';

    const recipe = await Recipe.findById(recipeId);
    // console.log(recipe)

    authorId = recipe.author._id;
    // console.log(authorId)

    // // delete recipe from author account
    const foundUser = await User.findById(authorId)
      .populate({
        path: 'myRecipes.recipe',
      })
      .exec();
    const recipes = foundUser.myRecipes;

    const delRecipe = recipes.findIndex(
      (el) => el.recipe._id.toString() === recipeId.toString()
    );

    // delete relations
    recipes.splice(delRecipe, 1);

    await Review.deleteMany({ _id: recipeId });

    recipe.remove();

    const user = await foundUser.save();

    const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: '24h' });
    res.status(200).json(token);
  } catch (err) {
    res.status(400).json(err);
  }
};

module.exports = {
  postRecipe,
  getAllRecipes,
  getQueryRecipes,
  getAUserRecipes,
  getOneRecipe,
  postDeleteARecipe,
  //   updateNewRecipe
};

