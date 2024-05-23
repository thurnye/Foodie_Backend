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
    
    
    
    
    
    
    // getHomepage,
    // getAUserByID,
    // getEdit,
    // postEdit, 
    // postDelete,
}