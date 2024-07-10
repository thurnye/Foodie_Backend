const RecipeController = require('../Controller/recipeController');
const CookBookController = require('../Controller/cookBookController');
const RecipeCache = require('../middleware/cache/recipe.redis.cache')
const router = require('express').Router()


// RECIPES
//post recipe ---> create and update
router.post('/add/:userId', RecipeController.postRecipe);

//get the loggedIn user recipes
router.post('/user/:id',RecipeCache.cacheUserRecipes,  RecipeController.getAUserRecipes);

//get all recipes
router.post('/', RecipeCache.cacheAllRecipes ,RecipeController.getAllRecipes);

//get all recipes by query
router.post('/query', RecipeCache.cacheAllRecipes, RecipeController.getQueryRecipes);

//getting a recipe by id
router.get('/:id', RecipeController.getOneRecipe);

//update a recipe by id
// router.post('/recipe/update/:id', RecipeController.getRecipeUpdate);

//delete a recipe
router.post('/removeRecipe/:id', RecipeController.postDeleteARecipe);

//generate PDF
router.post('/generateBook/:userId', CookBookController.createRecipeBookPDF);



module.exports = router;