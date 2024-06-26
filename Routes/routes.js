const RecipeController = require('../Controller/recipeController');
const ReviewController = require('../Controller/reviewController');
const EventController = require('../Controller/eventController');
const UserController = require('../Controller/userController');
const CookBookController = require('../Controller/cookBookController');
const AppController = require('../Controller/appController');
const ForumController = require('../Controller/forumsController')
const GroupController = require('../Controller/groupController')
const GroupPanelController = require('../Controller/groupPanelController')




const router = require('express').Router()


// User 
//post new user
router.post('/user', UserController.postCreateUser);

// POST /api/users/login
router.post('/user/login', UserController.getLogIn);

//update user
router.post('/user/edit/', UserController.postCreateUser);

//post the updated user
router.get('/user/:id', UserController.getAUserByID);

// Login Google
router.post('/user/google/login', UserController.getGoogleLogIn);

// Forgotten Password
router.post('/user/forgottenPassword/login', UserController.PostForgottenPassword);



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

//generate PDF
router.post('/recipe/generateBook/:userId', CookBookController.createRecipeBookPDF);


// Review
//post new user review 
router.post('/review/recipe', ReviewController.postReview);



//APP
// get autocomplete by sections - all , category', 'recipe', 'event', 'author'
router.post('/autoComplete', AppController.getAutoComplete)


//ForumRooms
// post forum = create and update
router.post('/forum', ForumController.postForum);

// get all groups in a forum
router.post('/forums', ForumController.getForums);


//GroupRooms
// post group = create and update
router.post('/group', GroupController.postGroup);

// get all groups in a forum
router.post('/groups', GroupController.getGroups);

// get single group by Id
router.get('/group/:groupId', GroupController.getSingleGroup);

// Join Group Request
router.post('/group/request', GroupController.postRequestToJoinOrLeaveGroup);

// Approve Group Request
router.post('/group/approve', GroupController.approveJoinRequest);


// Post
// post Panel Discussion
router.post('/panel', GroupPanelController.postGroupDiscussion);

// get all  discussion panels in a group
router.post('/panel/discussions', GroupPanelController.getGroupDiscussionPanels);



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