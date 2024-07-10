const AppController = require('../Controller/appController');
const router = require('express').Router()


//APP
// get autocomplete by sections - all , category', 'recipe', 'event', 'author'
router.post('/', AppController.getAutoComplete)




module.exports = router;