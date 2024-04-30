const Controller = require('../Controller/controller');
const router = require('express').Router()


 
//post new user
router.post('/api', Controller.postCreateUser);

// POST /api/users/login
router.post('/api/user/login', Controller.getLogIn);

//post the updated user
router.post('/edit/:id', Controller.postUpdatedUser);

//get the loggedIn user recipes
router.post('/user/:id', Controller.getAUserRecipes);

//post new recipe ---> this will be the post recipe
router.post('/api/recipe', Controller.postNewRecipe);

//get all recipes
router.post('/', Controller.getAllRecipes)

//get all recipes
router.post('/query', Controller.getQueryRecipes)

//post new user review 
router.post('/api/recipe/review', Controller.postReview);

//getting a recipe by id
router.get('/api/:id', Controller.getOneRecipe);

//update a recipe by id
router.post('/api/recipe/update/:id', Controller.getRecipeUpdate);

//delete a recipe
router.post('/api/removeRecipe/:id', Controller.postDeleteARecipe);

//post new event ---> this will be the post recipe
router.post('/api/event', Controller.postEvent);

//get all events
router.post('/event/query', Controller.getAllEvents)

//get the loggedIn user events
router.post('/user/event/:id', Controller.getUserEvents);

//getting a event by id
router.get('/event/:id', Controller.getSingleEvent);

//delete an event
router.post('/event/:id', Controller.postDeleteEvent);












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