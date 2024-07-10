
const UserController = require('../Controller/userController');

const router = require('express').Router()


// User 
//post new user
router.post('/', UserController.postCreateUser);

// POST /api/users/login
router.post('/login', UserController.getLogIn);

//update user
router.post('/edit/', UserController.postCreateUser);

//post the updated user
router.get('/:id', UserController.getAUserByID);

// Login Google
router.post('/google/login', UserController.getGoogleLogIn);

// Forgotten Password
router.post('/forgottenPassword/login', UserController.PostForgottenPassword);






module.exports = router;