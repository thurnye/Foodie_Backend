const ReviewController = require('../Controller/reviewController');




const router = require('express').Router()


// Review
//post new user review 
router.post('/recipe', ReviewController.postReview);



module.exports = router;