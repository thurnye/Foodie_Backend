const Forums = require('../Model/forums');
const AutoComplete = require('../Model/autoComplete');


const postForum = async (req, res, next) => {
  try {
    const { forumId, ...newData } = req.body;
    let data;

    if (forumId) {
      // update
    }
    if (!forumId) {
      // create
      const newForumRoom = new Forums({...newData, forumTotalMembers: 0, forumTotalPosts: 0});
      data = await newForumRoom.save();
    }
    const autoCompleteData = new AutoComplete({
      title: data.forumName,
      section: 'forum'
    })
    await autoCompleteData.save();

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json('Something went Wrong!');
  }
};

const getForums = async (req, res, next) => {
  try {
    const { currentPage, perPage } = req.body;
    const data = await Forums.find()
      .skip(perPage * currentPage - perPage)
      .limit(perPage)
      .select(
        'forumName forumTotalMembers forumTotalGroups' 
      )
      .sort({ createdAt: -1 })
      .exec();


    const count = await Forums.find().countDocuments();

    res.status(200).json({ groupRooms: data, count: Math.ceil(count / perPage) });
  } catch (error) {
    console.error(error);
    res.status(500).json('Something went Wrong!');
  }
};


module.exports = {
  postForum,
  getForums,
};
