const userRoutes = require('./user.routes')
const eventRoutes = require('./events.routes')
const recipeRoutes = require('./recipes.routes')
const reviewRoutes = require('./reviews.routes')
const autoCompleteRoutes = require('./autoComplete.routes')
const forumRoutes = require('./forum.routes')
const groupRoutes = require('./group.routes')
const groupPanelRoutes = require('./groupPanel.routes')
const router = require('express').Router()






// User 
router.use('/user', userRoutes)
router.use('/event', eventRoutes)
router.use('/recipe', recipeRoutes)
router.use('/review', reviewRoutes)
router.use('/autoComplete', autoCompleteRoutes)
router.use('/forum', forumRoutes)
router.use('/group', groupRoutes)
router.use('/panel', groupPanelRoutes)



module.exports = router;