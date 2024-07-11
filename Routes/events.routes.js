const EventController = require('../Controller/eventController');
const EventCache = require('../middleware/cache/event.redis.cache')
const router = require('express').Router()



// Events
//post new event ---> this will be the post Event
router.post('/', EventController.postEvent);

//get all events
router.post('/query',EventCache.cacheAllEvents, EventController.getAllEvents)

//get the loggedIn user events
router.post('/user/:id',EventCache.cacheUserEvents, EventController.getUserEvents);

//getting a event by id
router.get('/:id',EventCache.cacheAnEvent, EventController.getSingleEvent);

//delete an event
router.post('/:id', EventController.postDeleteEvent);





module.exports = router;