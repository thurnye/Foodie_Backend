const redisClient = require('../../Utils/redisClient');

// Middleware to cache recipes by author ID
const cacheUserRecipes = async (req, res, next) => {
  try {
    const author = req.params.id;
    const perPage = req.body.perPage || 9;
    const page = req.body.currentPage || 1;
    const cacheKey = `recipes:${author}_${perPage}_${page}`;

    // Check if data exists in Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('sending caching data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    // If data does not exist in Redis, proceed to next middleware (getAUserRecipes)
    next();
  } catch (err) {
    console.log('Error in caching middleware:', err);
    next(); // Proceed to next middleware or route handler on error
  }
};

// Middleware to cache all recipes 
const cacheAllRecipes = async (req, res, next) => {
  try {
    console.log("REDISCACHE", req.body)
    if(req.body?.filter?.isFilter){
      return next()
    }
    const author = req.params.id;
    const perPage = 24;
    const page = req.body.currentPage || 1;
    const cacheKey = `recipes:all_${perPage}_${page}`;

    // Check if data exists in Redis
    const cachedData = await redisClient.get(cacheKey);
    // console.log('cache::', cachedData)
    if (cachedData) {
      console.log('sending caching data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    // If data does not exist in Redis, proceed to next middleware (getAUserRecipes)
    next();
  } catch (err) {
    console.log('Error in caching middleware:', err);
    next(); // Proceed to next middleware or route handler on error
  }
};


const cacheARecipe = async (req, res, next) => {
  try {
    
    const recipeId = req.params.id;
    const cacheKey = `recipes:${recipeId}`;

    // Check if data exists in Redis
    const cachedData = await redisClient.get(cacheKey);
    // console.log('cache::', cachedData)
    if (cachedData) {
      console.log('sending caching data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    // If data does not exist in Redis, proceed to next middleware (getAUserRecipes)
    next();
  } catch (err) {
    console.log('Error in caching middleware:', err);
    next(); // Proceed to next middleware or route handler on error
  }
};

module.exports = {
  cacheUserRecipes,
  cacheAllRecipes,
  cacheARecipe
};
