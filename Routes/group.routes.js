const GroupController = require('../Controller/groupController')
const privateGroupController = require('../Controller/privateGroupController')




const router = require('express').Router()



//GroupRooms
// post group = create and update
router.post('/', GroupController.postGroup);

// get all groups in a forum
router.post('/all', GroupController.getGroups);

// get single group by Id
router.get('/:groupId', GroupController.getSingleGroup);

// Join Group Request
router.post('/request', GroupController.postRequestToJoinOrLeaveGroup);

// Approve Group Request
router.post('/approve', GroupController.approveJoinRequest);

// create private group
router.post('/private', privateGroupController.postPrivateGroup);




module.exports = router;