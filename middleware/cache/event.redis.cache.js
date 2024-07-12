const redisClient = require('../../Utils/redisClient');

// Middleware to cache event by author ID
const cacheUserEvents = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const perPage = 12;
    const page = req.body.currentPage;
    const cacheKey = `event:${userId}_${perPage}_${page}`;

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

// Middleware to cache all events
const cacheAllEvents = async (req, res, next) => {
  try {
    console.log('REDISCACHE', req.body);
    const filter = req.body;
    const page = filter.page;
    const limit = filter.limit || 12;
    const cacheKey = `event:all_${limit}_${page}`;

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

const cacheAnEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const cacheKey = `event:${eventId}`;

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
  cacheUserEvents,
  cacheAllEvents,
  cacheAnEvent,
};
