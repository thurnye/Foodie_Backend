const PrivateGroup = require('../Model/privateGroup');


const postPrivateGroup = async (req, res, next) => {
  try {
    const {groupId, ...newData} = req.body
    let data;

    if(!groupId){
      // create
      const newPrivateGroup = new PrivateGroup(newData);
      data = await newPrivateGroup.save();
      if(data._id){
        await PrivateGroup.populate(data, {
          path: 'members startedBy',
          select: '_id firstName lastName avatar',
        });
      }
    }
    if(groupId){
      // update
    }

    res.status(200).json(data);
    
  } catch (error) {
    console.log(error);
    res.status(500).json('Something Went Wrong!');
  }
}


module.exports = {
  postPrivateGroup
}