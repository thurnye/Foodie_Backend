const PostRoom = require('../Chat/WebSocket/models/groupPanel.model');
const GroupRoom = require('../Chat/WebSocket/models/group.model');
const Forums = require('../Model/forums');

const postGroupDiscussion = async (req, res, next) => {
  try {
    const { postRoomId, ...newData } = req.body;
    let data;

    if (postRoomId) {
      // update
    }
    if (!postRoomId) {
      // create
      const newPostRoom = new PostRoom(newData);
      let savedPostRoom = await newPostRoom.save();

      if (savedPostRoom._id) {
        const populatedPost = await PostRoom.findById(savedPostRoom._id)
          .select('panel groupId  startedBy membersInPanel createdAt')
          .populate({
            path: 'startedBy',
            select: '_id avatar lastName firstName',
          })
          .sort({ createdAt: -1 })
          .exec();
        data = {
          ...populatedPost.toObject(),
          membersInPanel: populatedPost.membersInPanel.length,
          comments: 0,
          likes: 0,
        };
        const group = await GroupRoom.findById(savedPostRoom.groupId);

        if (group.groupTotalPosts) {
          group.groupTotalPosts += 1;
        } else {
          group.groupTotalPosts = 1;
        }
        await group.save();
      }

      res.status(200).json(data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json('Something Went Wrong!');
  }
};

const getGroupDiscussionPanels = async (req, res, next) => {
  try {
    console.log(req.body);
    const { currentPage, groupId, perPage } = req.body;

    const populatedGroupDiscussionPanels = await PostRoom.find({
      groupId: groupId,
    })
      .skip(perPage * currentPage - perPage)
      .limit(perPage)
      .populate({
        path: 'startedBy',
        select: '_id avatar lastName firstName',
      })
      .sort({ createdAt: -1 })
      .exec();

    const data = populatedGroupDiscussionPanels.map((panel) => {
      const panelObj = panel.toObject();
      const { membersInPanel, ...others } = panelObj;
      return {
        ...others,
        membersInPanels: membersInPanel ? membersInPanel.length : 0,
      };
    });
    const count = await PostRoom.find({ groupId: groupId }).countDocuments();

    res
      .status(200)
      .json({ groupPanels: data, count: Math.ceil(count / perPage) });
  } catch (error) {
    console.error(error);
    res.status(500).json('Something Went Wrong!');
  }
};

module.exports = {
  postGroupDiscussion,
  getGroupDiscussionPanels,
};
