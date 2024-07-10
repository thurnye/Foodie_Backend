const GroupPanelController = require('../Controller/groupPanelController')


const router = require('express').Router()


// post Panel Discussion
router.post('/', GroupPanelController.postGroupDiscussion);

// get all  discussion panels in a group
router.post('/discussions', GroupPanelController.getGroupDiscussionPanels);



module.exports = router;