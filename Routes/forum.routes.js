const ForumController = require('../Controller/forumsController')
const router = require('express').Router()

//ForumRooms
// post forum = create and update
router.post('/', ForumController.postForum);

// get all groups in a forum
router.post('/all', ForumController.getForums);





module.exports = router;