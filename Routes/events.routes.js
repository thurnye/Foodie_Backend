const EventController = require('../Controller/eventController');

const router = require('express').Router()



// Events
//post new event ---> this will be the post recipe
router.post('/', EventController.postEvent);

//get all events
router.post('/query', EventController.getAllEvents)

//get the loggedIn user events
router.post('/user/:id', EventController.getUserEvents);

//getting a event by id
router.get('/:id', EventController.getSingleEvent);

//delete an event
router.post('/:id', EventController.postDeleteEvent);





module.exports = router;