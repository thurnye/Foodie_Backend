//this is the server controller where i do send data to the back end....
const User = require('../Model/user')
const Event = require('../Model/events')
const Recipe = require('../Model/recipes')
const Review = require('../Model/review')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 6  // tell bcrypt how many times to randomize the generation of salt. usually 6 is enough.




//Creating A User
const postCreateUser = async (req, res, next) => {
    try { 
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

        const newUser = new User ({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
        })
        const user = await newUser.save()
        const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
        // send a response to the front end
        res.status(200).json(token)

    }catch(err){
        res.status(400).json('Bad Credentials');
    }
}

// Login a User
const getLogIn = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).exec()
        // console.log(user)
          // check password. if it's bad throw an error.
        if (!(await bcrypt.compare(req.body.password, user.password))) throw new Error();
  
        // if we got to this line, password is ok. give user a new token.
        const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
        res.json(token)
    } catch {
        res.status(400).json('Bad Credentials');
    }
}

//RETRIEVE AN AUTHOR Recipes

const getAUserRecipes = async(req, res, next) => {
    try{
        console.log(req.body)
        const author = req.params.id;
        const count = await Recipe.find({author: author}).countDocuments()
        // console.log(count);
        const perPage = req.body.perPage || 9;
        const page = req.body.currentPage || 1

        const recipes =  await Recipe.find({author: author})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .select('_id thumbnail recipeName createdAt')
        // .populate({
        //     path: 'reviews.review',
        //     populate: ({ 
        //         path: 'userId',
        //         populate: {path: 'myRecipes.recipe'}
        //     }) 
        // })
        // .populate({
        //     path: 'author'
        // })
        .exec()
        const data = {
            recipes, 
            count: Math.ceil(count)
        }
        res.status(200).json(data)

    }catch(err){
        console.log(err)
        res.status(400).json(err)
    }   
}


// POSTING Updated User
const postUpdatedUser = (req, res, next) => {
    const id = req.params.id;

    User.findById(id)
    .then(user => {
        user.firstName =  req.body.firstName;
        user.lastName =  req.body.lastName;
        user.email =  req.body.email;
        user.avatar =  "";
        user.slogan =  req.body.slogan;
        user.aboutMe =  req.body.aboutMe;
        user.location =  req.body.location;
        user.resourceInfo =  req.body.myResource;
        user.resourceList = [];
        user.socialMedia= [{
            facebook : req.body.facebook,
            twitter : req.body.twitter,
            linkedIn : req.body.linkedIn,
            pinterest : req.body.pinterest
            }]
        return user.save()
    })
    .then((user) => {
        const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
        res.status(200).json(token)
    })
    .catch(err => res.status(400).json(err));
    
}

//Create New Recipe
const postNewRecipe = async (req, res, next) => {
    try{
        const authorId = req.body.author
        const newRecipe = new Recipe({
            author: authorId,
            recipeName: req.body.recipeName,
            description: req.body.description,
            serving: req.body.serving,
            category: req.body.category,
            duration: req.body.duration,
            level: req.body.level,
            tags: req.body.tags,
            mainIngredients: req.body.mainIngredients,
            dressingIngredients: req.body.dressingIngredients,
            directions: req.body.directions,
            notes: req.body.notes,
            thumbnail: req.body.thumbnail,
            nutritionFacts: req.body.nutritionFacts

        })
        let savedRecipe = await newRecipe.save()
        const recipeId = {recipe: savedRecipe._id}
        const foundUser = await User.findById(authorId)

        foundUser.myRecipes.push(recipeId)
        
        await foundUser.save()

        const user =  await User.findById(authorId).populate({
            path: 'myRecipes.recipe'
        }).exec()
        const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
        res.status(200).json(token)

    }catch(err){
        res.status(400).json(err)
    }    
}

//RETRIEVE ALL RECIPES BY PAGINATION
const getAllRecipes = async(req, res, next) => {
    try{
        const count = await Recipe.find().countDocuments()
        const perPage = 9;
        const page = req.body.currentPage
        const recipes =  await Recipe.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate('author').exec()
        const data = {
            recipes, 
            count: Math.ceil(count / perPage)
        }
        res.status(200).json(data)

    }catch(err){
        res.status(400).json(err)
    }   
}


//RETRIEVE ALL  QUERY RECIPES
const getQueryRecipes = async(req, res, next) => {
    try{
        // console.log(req.body);
        const filter = req.body.filter;
        const category = filter?.category
        const page = req.body.currentPage;
        const keyword = filter?.keywordSearch
        const options = filter?.options;
        const tags = filter?.tags;
        const perPage = 9;
        const query = {
        };
        let categories = [
            (category && category)
        ]
        if(options){
            categories = [
                (category && category) , 
            ...(options ? options : {} )
            ]
        }

        // Save Category, Tags as strings[] not as an array of objects
        const filteredCategories = categories.filter((element) => typeof element !== 'undefined');
        // console.log(filteredCategories);


        if(keyword){
            query.recipeName =  new RegExp(keyword, 'i')
        }
        if(tags){
            tags.forEach((el) => {
                query.tags =  { $in: tags }
            })
        }
        if(filteredCategories.length > 0){
            query.category =  { $in: filteredCategories }
        }
        console.log(query);

        const count = await Recipe.find(query).countDocuments();
        const recipes = await Recipe.find(query)
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .limit(perPage).populate('author').exec()
        const data = {
            recipes, 
            count: Math.ceil(count / perPage)
        };
        res.status(200).json(data);
    }catch(err){
        // console.log(err)
        res.status(400).json(err)
    }   
}

//RETRIVE A Recipe BY ID
const getOneRecipe = async (req, res, next) => {
    try{
        const recipeId = req.params.id;
        const recipeData = await Recipe.findById(recipeId)
        .populate({
            path: 'reviews.review',
            populate: ({ 
                path: 'userId',
                populate: {path: 'myRecipes.recipe'}
            }) 
        })
        .populate({
            path: 'author'
        })
        .exec()

        if(recipeData.reviews.length > 0 ){
            const rating = []
            recipeData.reviews.map(el => rating.push(parseInt(el.review.rating)))
            const sum = rating.reduce((a, b) => a + b)
            const average = sum / rating.length
            recipeData.rating = average.toFixed(1)
            const recipe = await recipeData.save()
            res.status(200).json(recipe)
       }else{
            res.status(200).json(recipeData) 
       }

    }catch(err){
        res.status(400).json(err)
    }   
}

//Post a Review
const postReview = async (req, res, next) => {
    try{
        const recipeId = req.body.recipeId
        const newReview = new Review ({
            review: req.body.review,
            rating: req.body.ratings,
            userId: req.body.userId,
            recipeId: recipeId
        })
        const savedReview = await newReview.save()

        const reviewId = {review:savedReview._id}
        const foundRecipe = await Recipe.findById(recipeId)
        foundRecipe.reviews.push(reviewId)

        const recipe = await foundRecipe.save()



        // console.log(recipe)
        res.status(200).json()
    }catch(err){
        res.status(400).json(err)
    } 
}

//UPDATING A RECIPE
const getRecipeUpdate = async(req, res, next) => {
    try{
        
        const loggedUser = req.body.loggedUser
        
        //find the receipe 
        const recipe = await Recipe.findById(req.params.id)
        // console.log("recipe", recipe)
        if(recipe.author.toString() === loggedUser.toString()){
            recipe.recipeName= req.body.recipeName
            recipe.description= req.body.description
            recipe.serving= req.body.serving
            recipe.category= req.body.category
            recipe.duration= req.body.duration
            recipe.level= req.body.level
            recipe.tags= req.body.tags
            recipe.mainIngredients= req.body.mainIngredients
            recipe.dressingIngredients= req.body.dressingIngredients
            recipe.directions= req.body.directions
            recipe.notes= req.body.notes
            recipe.thumbnail= req.body.thumbnail
            recipe.nutritionFacts= req.body.nutritionFacts

            recipe.save()
            
            const user =  await User.findById(recipe.author).populate({
                path: 'myRecipes.recipe'
            }).exec()
            const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
            res.status(200).json(token)
            // res.status(200).json()
        }

        
        // let savedRecipe = await newRecipe.save()
        // const recipeId = {recipe: savedRecipe._id}
        // const foundUser = await User.findById(authorId)

        // foundUser.myRecipes.push(recipeId)
        
        // await foundUser.save()

    }catch(err){

    }
}

//DELETING A RECIPE
const postDeleteARecipe = async (req, res, next) => {
    try{ 
        // console.log(req.params.id)
        const recipeId = req.params.id;
        let authorId = ''

        const recipe =  await Recipe.findById(recipeId)
        // console.log(recipe)

        authorId = recipe.author._id
        // console.log(authorId)
        

        // // delete recipe from author account
        const foundUser = await User.findById(authorId).populate({
            path: 'myRecipes.recipe'
        }).exec()
        const recipes = foundUser.myRecipes

        const delRecipe = recipes.findIndex(el => el.recipe._id.toString() === recipeId.toString())


        // delete relations
        recipes.splice(delRecipe, 1)

        await Review.deleteMany({ _id: recipeId})

        recipe.remove()

        const user = await foundUser.save()
        

        const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
        res.status(200).json(token)

    }catch(err){
        res.status(400).json(err)
    } 
}

//POST NEW EVENT
// const postEvent = async(req, res, next) => {
//     try {
//         const userId = req.body.userId;
//         const eventForm = req.body.eventForm;
//         const eventId = req.body.eventForm._id

//         console.log(userId, eventId, eventForm)

//         const newEvent = new Event({
//             ...eventForm,
//             eventDetails:{ 
//                 ...eventForm.eventDetails,
//                 starts: new Date(eventForm.eventDetails.starts),
//                 ends: new Date(eventForm.eventDetails.starts)
//             },
//             createdBy: userId, 
//             attendees:[]
//         })

//         //Update Event
//         if(eventId){
//             const event = await Event.findById(eventId);
            
//             if(event._id.toString() === eventId.toString() && event.createdBy.toString() === userId.toString()){
//                 event.eventDetails = eventForm.eventDetails
//                 event.tickets = eventForm.tickets
//                 event.additionalSettings = eventForm.additionalSettings

//                 await event.save();
//                 console.log('Updated')
//             }
//         }
        
//         //Create NewEvent
//         if(!eventId){
//             let savedEvent = await newEvent.save()
//             const eventId = savedEvent._id
//             const foundUser = await User.findById(userId)
//             foundUser.events.myEvents.push(eventId)
//             await foundUser.save()
//             console.log('Saved')

//         }

//         const user =  await User.findById(userId).populate({
//             path: 'events.myEvents'
//         }).exec()
//         const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
//         res.status(200).json(token)
//     } catch (err) {
//         console.log(err);
//         res.status(400).json(err)
//     }
// }
const postEvent = async(req, res, next) => {
    try {
        const userId = req.body.userId;
        const eventForm = req.body.eventForm;
        const eventId = req.body.eventForm._id

        console.log(userId, eventId, eventForm)

        const newEvent = new Event({
            ...eventForm,
            createdBy: userId, 
            attendees:[]
        })

        // Update Event
        if(eventId){
            const event = await Event.findById(eventId);
            if(event._id.toString() === eventId.toString() && event.createdBy.toString() === userId.toString()){
                event.basicInfo = eventForm.basicInfo
                event.details = eventForm.details
                event.schedule = eventForm.schedule
                event.tickets = eventForm.tickets

            }
            const updatedEvent = await event.save();
            console.log('Updated')
            res.status(200).json({event:updatedEvent});
        }
        
        //Create NewEvent
        if(!eventId){
            let savedEvent = await newEvent.save()
            const eventId = savedEvent._id
            const foundUser = await User.findById(userId)
            foundUser.events.myEvents.push(eventId)
            await foundUser.save()
            console.log('Saved')

            const user =  await User.findById(userId).populate({
                path: 'events.myEvents'
            }).exec()
            const token = jwt.sign({ user }, process.env.SECRET,{ expiresIn: '24h' });
            res.status(200).json(token)
        }

    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

//GET ALL EVENTS BY PAGINATION AND FILTERS
const getAllEvents = async(req, res, next) => {
    try{
        
        const filter = req.body;
        const type = filter?.activeComp
        const page = filter.page;
        const keyword = filter.keywordSearch
        const timeFrameStarts = filter?.timeFrame?.starts;
        const timeFrameEnds = filter?.timeFrame?.ends;
        const limit = filter.limit || 12;
        let query = { };
        
      
        if(keyword){
            query["eventDetails.eventTitle"] = new RegExp(keyword, 'i')
        }
        // if(type === 'online'){
        //     query["eventDetails.isOnline"] = true
        // }
        // if(type === 'free'){
        //     query["eventDetails.isFree"]= true
        // }
       
        //get date range
        // if (timeFrameStarts ) {
        //     query["eventDetails.starts"] = {"$gte": new Date(timeFrameStarts)}
        // }
        // if (timeFrameEnds) {
        //     query["eventDetails.ends"] = {"$lte": new Date(timeFrameEnds)}
        // }
        
        console.log('EventQuery::',query);

        const count = await Event.find(query).countDocuments();
       
        const events = await Event.find(query)
        .skip((limit * page) - limit)
        .limit(limit)
        .populate({
            path: 'createdBy',
            select: '_id avatar lastName firstName followers'
            })
        .exec()
        const data = {
            events, 
            count: Math.ceil(count / limit)
        };
        console.log(events.length);
        res.status(200).json(data);
    }catch(err){
        console.log(err)
        res.status(400).json(err)
    }   
}

// GET USER EVENTS
const getUserEvents = async(req, res, next) => {
    try{
        console.log(req.body)
        const userId = req.params.id;
        const count = await Event.find({createdBy: userId}).countDocuments()
        // console.log(count);
        const perPage = 12;
        const page = req.body.currentPage

        const events =  await Event.find({createdBy: userId})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate({
            path: 'createdBy',
            select: '_id avatar lastName firstName followers'
            })
        .exec()
        const data = {
            events, 
            count: Math.ceil(count / perPage)
        }
        console.log(events.length);
        res.status(200).json(data)

    }catch(err){
        res.status(400).json(err)
    }   
}

//RETRIVE A Recipe BY ID
const getSingleEvent = async (req, res, next) => {
    try{
        const eventId = req.params.id;
        const event = await Event.findById(eventId)
        .populate({
            path: 'createdBy',
            select: '_id avatar lastName firstName followers'
            })
        .exec()

        res.status(200).json(event)
    }catch(err){
        res.status(400).json(err)
    }   
}

//DELETING AN EVENT
const postDeleteEvent = async (req, res, next) => {
    try{ 
        // console.log(req.params.id)
        const eventId = req.params.id;
        const event =  await Event.findById(eventId);
        const organizerId = event.createdBy
        //  delete recipe from author account
        const foundUser = await User.findById(organizerId).populate({
            path: 'events.myEvents'
        }).exec()
        const userEvent = foundUser.events.myEvents;
        const delEvent = userEvent.findIndex(el => el._id.toString() === eventId.toString());
        
        // // delete relations
        userEvent.splice(delEvent, 1);
        await Event.deleteMany({ _id: eventId})
        userEvent.remove()
        const user = await foundUser.save();

        const token = jwt.sign({ user}, process.env.SECRET,{ expiresIn: '24h' });
        res.status(200).json({token, deleted: true})

    }catch(err){
        res.status(400).json({err, deleted: false})
    } 
}







// --------------------------------------

// //RETRIEVE ALL USER 
// const getHomepage = async(req, res, next) => {
//     await User.find().then(users => {
//         res.send({users});
//     })
//     .catch(err => res.status(400).json(err))
// }


// //RETRIEVE A USER BY ID
// const getAUserByID = (req, res, next) => {
//     const id = req.params.id;
//     User.findById(id)
//     .then(data => {
//         res.send({data})
//     })
//     .catch(err => res.status(400).json(err))
// }



// //  GETTING A USER TO EDIT
// const getEdit = (req, res, next) => {
//     const id = req.params.id;
//     User.findById(id)
//     .then(data => {
//         res.send({data})
//     })
//     .catch(err => res.status(400).json(err))
// }

// // POSTING UPDATED USER INFO
// const postEdit = (req, res, next) => {
//     const id = req.body.id;
//     User.findById(id)
//     .then(user => {
//         user.FirstName = req.body.firstName;
//         user.LastName = req.body.lastName;
//         user.Address = req.body.address;
//         user.Number = req.body.number;
//         user.Email = req.body.email;
//         return user.save()
//     })
//     .then((user) => {
//         // send a response to the front end
//         res.status(200).json(user)
//     })
//     .catch(err => res.status(400).json(err));
// }

// //DELETING A USER
// const postDelete = async (req, res, next) => {
//     const id = req.params.id;
//     console.log(id)
//     await User.findByIdAndDelete(id)
//     .then(result => {
//         console.log(result)
//           res.status(200).json(result)
//       })
//     .catch(err => res.status(400).json(err))
// }





module.exports = {
    postCreateUser,
    getLogIn,
    postUpdatedUser,
    postNewRecipe,
    postReview,
    getAllRecipes,
    getQueryRecipes,
    getAUserRecipes,
    getOneRecipe,
    getRecipeUpdate,
    postDeleteARecipe,
    postEvent,
    getAllEvents,
    getUserEvents,
    getSingleEvent,
    postDeleteEvent
    
    
    
    
    
    
    // getHomepage,
    // getAUserByID,
    // getEdit,
    // postEdit, 
    // postDelete,
}