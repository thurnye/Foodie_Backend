const RecipeController = require('../Controller/recipeController');
const ReviewController = require('../Controller/reviewController');
const EventController = require('../Controller/eventController');
const UserController = require('../Controller/userController');
const CookBookController = require('../Controller/cookBookController');

const router = require('express').Router()


// User 
//post new user
router.post('/user', UserController.postCreateUser);

// POST /api/users/login
router.post('/user/login', UserController.getLogIn);

//post the updated user
router.post('/user/edit/:id', UserController.postUpdatedUser);

//post the updated user
router.get('/user/:id', UserController.getAUserByID);



// Events
//post new event ---> this will be the post recipe
router.post('/event', EventController.postEvent);

//get all events
router.post('/event/query', EventController.getAllEvents)

//get the loggedIn user events
router.post('/event/user/:id', EventController.getUserEvents);

//getting a event by id
router.get('/event/:id', EventController.getSingleEvent);

//delete an event
router.post('/event/:id', EventController.postDeleteEvent);





// RECIPES
//post recipe ---> create and update
router.post('/recipe/:userId', RecipeController.postRecipe);

//get the loggedIn user recipes
router.post('/recipe/user/:id', RecipeController.getAUserRecipes);

//get all recipes
router.post('/recipes', RecipeController.getAllRecipes);

//get all recipes by query
router.post('/recipes/query', RecipeController.getQueryRecipes);

//getting a recipe by id
router.get('/recipe/:id', RecipeController.getOneRecipe);

//update a recipe by id
// router.post('/recipe/update/:id', RecipeController.getRecipeUpdate);

//delete a recipe
router.post('/recipe/removeRecipe/:id', RecipeController.postDeleteARecipe);


router.post('/recipe/generateBook/:userId', CookBookController.createRecipeBookPDF);


// Review
//post new user review 
router.post('/review/recipe', ReviewController.postReview);









// =============================================

//get all users
// router.get('/', Controller.getHomepage)


//getting a user item by id
// router.get('/api/:id', Controller.getAUserByID);

//get user to edit
// router.get('/edit/:id', Controller.getEdit);

//post the edited user
// router.post('/edit/:id', Controller.postEdit);

//post delete
// router.post('/api/:id', Controller.postDelete);




module.exports = router;