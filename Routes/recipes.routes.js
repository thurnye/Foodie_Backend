const RecipeController = require('../Controller/recipeController');
const CookBookController = require('../Controller/cookBookController');
// const RecipeCache = require('../middleware/cache/recipe.redis.cache')
const router = require('express').Router()


// RECIPES
//post recipe ---> create and update
router.post('/add/:userId', RecipeController.postRecipe);

//get the loggedIn user recipes
// router.post('/user/:id',RecipeCache.cacheUserRecipes,  RecipeController.getAUserRecipes);
router.post('/user/:id,  RecipeController.getAUserRecipes);

//get all recipes
// router.post('/', RecipeCache.cacheAllRecipes ,RecipeController.getAllRecipes);
router.post('/',RecipeController.getAllRecipes);

//get all recipes by query
// router.post('/query', RecipeCache.cacheAllRecipes, RecipeController.getQueryRecipes);
router.post('/query', RecipeController.getQueryRecipes);

//getting a recipe by id
// router.get('/:id', RecipeCache.cacheARecipe, RecipeController.getOneRecipe);
router.get('/:id', RecipeController.getOneRecipe);

//delete a recipe
router.post('/removeRecipe/:id', RecipeController.postDeleteARecipe);

//generate PDF
router.post('/generateBook/:userId', CookBookController.createRecipeBookPDF);



module.exports = router;