const User = require('../Model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AutoComplete = require('../Model/autoComplete');

const SALT_ROUNDS = 6; // tell bcrypt how many times to randomize the generation of salt. usually 6 is enough.


//Create or Update A User
const postCreateUser = async (req, res, next) => {
  try {
    const id = req.body.userId;
    let savedUser = null;
    if (!req.body.email || !req.body.password) {
      res.status(400).json('Missing Field Needed!');
      return;
    }
    if (!id) {
      // Create New User
      const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        googleId: req.body.googleId,
      });
      savedUser = await newUser.save();
      const newData = new AutoComplete({
        title: `${savedUser.firstName} ${savedUser.lastName}`,
        section: 'author',
        refId: savedUser._id.toString()
      })
    }

    if (id) {
      // Update User
      const updateUser = await User.findById(id);

      if (!updateUser) {
        res.status(400).json('No User Found!!');
        return;
      }

      updateUser.firstName = req.body.firstName;
      updateUser.lastName = req.body.lastName;
      updateUser.email = req.body.email;
      updateUser.avatar = req.body.avatar;
      updateUser.slogan = req.body.slogan;
      updateUser.aboutMe = req.body.aboutMe;
      updateUser.location = req.body.location;
      updateUser.socialMediaPlatform = req.body.socialMediaPlatform;

      savedUser = await updateUser.save();
      const ACData = AutoComplete.find({refId: savedUser._id.toString()})
      if(ACData){
        ACData.title = `${savedUser.firstName} ${savedUser.lastName}`
       await ACData.save()
      }
    }

    const user = await User.findById(savedUser._id)
      .select('firstName lastName _id email avatar slogan aboutMe location resourceInfo resourceList socialMediaPlatform myRecipes events images bookmarks favorites followers')
      .lean();

    const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: '24h' });
    // send a response to the front end
    res.status(200).json(token);
  } catch (err) {
    console.log(err);
    res.status(500).json('Something went Wrong!');
  }
};

// Login a User
const getLogIn = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Find the user and select necessary fields
    const user = await User.findOne({ email }).select('firstName lastName email password').lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Check the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const loggedUser= {
      _id : user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }

    const token = jwt.sign({ user:loggedUser }, process.env.SECRET, { expiresIn: '24h' });
  // send a response to the front end
  res.status(200).json(token);
  } catch (error) {
    console.log(error);
    res.status(400).json('Bad Credentials');
  }
};

//RETRIEVE A USER BY ID
const getAUserByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id)
    .select("_id aboutMe avatar lastName firstName socialMediaPlatform")
    .exec();
    res.send({ user });
  } catch (error) {
    console.log(error);
    res.status(400).json(err);
  }
};

// Login a User with Google
const getGoogleLogIn = async (req, res) => {
  try {
    const email = req.body.email;
    let user;

    console.log(req.body);

    // Find the user and select necessary fields
    user = await User.findOne({ email })
      .select('firstName lastName email password')
      .lean();

    if (!user) {
      // create user for google login if user not found!
      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: '',
        googleId: req.body.googleId,
      });
      user = await newUser.save();
    }

    const loggedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    const token = jwt.sign({ user: loggedUser }, process.env.SECRET, {
      expiresIn: '24h',
    });
    // send a response to the front end
    res.status(200).json(token);
  } catch (error) {
    console.log(error);
    res.status(400).json('Something went Wrong!!');
  }
};

//Forgotten Password
const PostForgottenPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    console.log('findUser::', user);

    if (!user) {
      res.status(400).json('User Not Found!');
      return;
    }
    var createPass = '';
    var str =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890@#$%&';

    for (let i = 0; i < 6; i++) {
      var char = Math.floor(Math.random() * str.length + 1);
      createPass += str.charAt(char);
    }

    console.log('createPass::', createPass);

    // --- content for mail --- //
    let sub = 'Reset Your Password';
    let html = `<h3>
                  Hello ${user.firstName}, 
                  <br/> You forget you password, Don't worry Here your new password <u> ${createPass} </u>
                </h3>
            <p>If you didn't request for a new password. Then you can safely ignore this email.</p>
            <br/>
            <h4>Thank You</h4>`;

    await mailService(user.email, sub, html);

    console.log('findUser._id::::', user._id);
    console.log('createPass::::', createPass);

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          password: createPass,
        },
      }
    );
    res.status(200).json('Your new password has been sent on your register mail');
  } catch (error) {
    console.log('forgetPassword-Error::', error);
    res.status(400).json('Something Went Wrong!.');
  }
};

// --------------------------------------



module.exports = {
  postCreateUser,
  getLogIn,
  getAUserByID,
  getGoogleLogIn,
  PostForgottenPassword,
};
