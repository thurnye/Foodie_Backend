const User = require('../Model/user');
const GroupRoom = require('../WebSocket/models/group.model');
const AutoComplete = require('../Model/autoComplete');
const Forums = require('../Model/forums');
const PostRoom = require('../WebSocket/models/groupPanel.model');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const postGroup = async (req, res, next) => {
  try {
    const { groupRoomId, ...newData } = req.body;
    let data;

    if (groupRoomId) {
      // update
    }
    if (!groupRoomId) {
      // create
      const newGroupRoom = new GroupRoom(newData);
      let savedGroupRoom = await newGroupRoom.save();

      if (savedGroupRoom._id) {
        const populatedGroupRoom = await GroupRoom.findById(savedGroupRoom._id)
          .select(
            'groupName forumId startedBy createdAt groupDescription, pendingGroupMembers'
          )
          .populate({
            path: 'startedBy',
            select: '_id avatar lastName firstName',
          })
          .sort({ createdAt: -1 })
          .exec();
        data = {
          ...populatedGroupRoom.toObject(),
          topics: '0',
          users: req.body.groupMembers.length,
        };
        const autoCompleteData = new AutoComplete({
          title: populatedGroupRoom.groupName,
          section: 'group',
        });
        const forum = await Forums.findById(savedGroupRoom.forumId);

        forum.forumTotalGroups += 1;
        forum.forumTotalMembers += savedGroupRoom?.groupMembers?.length;
        await forum.save();
        await autoCompleteData.save();
      }

      res.status(200).json(data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json('Something Went Wrong!');
  }
};

const getGroups = async (req, res, next) => {
  try {
    console.log(req.body);
    const { currentPage, forumId, perPage, userId } = req.body;

    const populatedGroupRoom = await GroupRoom.find({ forumId: forumId })
      .skip(perPage * currentPage - perPage)
      .limit(perPage)
      .select(
        'groupName forumId startedBy createdAt groupDescription groupTotalPosts groupMembers pendingGroupMembers'
      )
      .populate({
        path: 'startedBy',
        select: '_id avatar lastName firstName',
      })
      .sort({ createdAt: -1 })
      .exec();

    const objectId = new ObjectId(userId);

    const data = populatedGroupRoom.map((groupRoom) => {
      // Convert Mongoose document to plain JavaScript object
      const groupRoomObj = groupRoom.toObject();

      // Destructure the necessary fields
      const { groupMembers, pendingGroupMembers, groupTotalPosts, ...others } =
        groupRoomObj;

      // Check if user is already pending approval
      const isPendingMember = pendingGroupMembers.some((memberId) =>
        memberId.equals(userId)
      );
      const isMember = groupMembers.some((memberId) => memberId.equals(userId));

      return {
        ...others,
        isPendingMember,
        isMember,
        users: groupMembers ? groupMembers.length : 0,
        topics: groupTotalPosts ? groupTotalPosts : 0,
      };
    });
    const count = await GroupRoom.find({ forumId: forumId }).countDocuments();

    res
      .status(200)
      .json({ groupRooms: data, count: Math.ceil(count / perPage) });
  } catch (error) {
    console.error(error);
    res.status(500).json('Something Went Wrong!');
  }
};

const postRequestToJoinOrLeaveGroup = async (req, res, next) => {
  try {
    const { userId, groupId } = req.body;

    const group = await GroupRoom.findById(groupId);

    if (!group) {
      return res.status(404).json('Group not found');
    }

    // Check if user is already a member of the group
    const isMemberIndex = group.groupMembers.indexOf(userId);
    if (isMemberIndex !== -1) {
      // If user is a member, remove them from groupMembers array
      group.groupMembers.splice(isMemberIndex, 1);
      await group.save();

      const forum = await Forums.findById(group.forumId);
      forum.forumTotalMembers -= 1;
      await forum.save();
      return res.status(200).json('exit');
    }

    // Check if user is already pending approval
    const isPending = group.pendingGroupMembers.includes(userId);
    if (isPending) {
      return res
        .status(400)
        .json('User already has a pending request to join the group');
    }

    // If not already a member or pending, add to pending group members
    group.pendingGroupMembers.unshift(userId);
    await group.save();

    res.status(200).json('pending');
  } catch (error) {
    console.log(error);
    res.status(500).json('Something Went Wrong!');
  }
};

const getSingleGroup = async (req, res, next) => {
  try {
    console.log(req.params.groupId);
    const groupId = req.params.groupId;

    const group = await GroupRoom.findById(groupId)
      .select(
        'groupName forumId startedBy createdAt groupDescription  groupMembers pendingGroupMembers'
      )
      .populate({
        path: 'startedBy',
        select: '_id avatar lastName firstName',
      })
      .populate({
        path: 'pendingGroupMembers',
        select: '_id avatar lastName firstName',
      })
      .populate({
        path: 'groupMembers',
        select: '_id avatar lastName firstName',
      })
      .exec();

    // Sort the pendingGroupMembers array by firstName, and then by lastName
    group.pendingGroupMembers.sort((a, b) => {
      if (a.firstName < b.firstName) return -1;
      if (a.firstName > b.firstName) return 1;
      return 0;
    });
    group.groupMembers.sort((a, b) => {
      if (a.firstName < b.firstName) return -1;
      if (a.firstName > b.firstName) return 1;
      return 0;
    });

    res.status(200).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json('Something Went Wrong!');
  }
};

const approveJoinRequest = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body;

    const group = await GroupRoom.findById(groupId);
    if (!group) {
      return res.status(404).json('Group not found' );
    }

    group.groupMembers.push(userId);
    group.pendingGroupMembers = group.pendingGroupMembers.filter(el => el.toString() !== userId.toString());

    // Save the updated group
    const savedGroupRoom = await group.save();

    // Update forum statistics
    const forum = await Forums.findById(savedGroupRoom.forumId);
    if (forum) {
      forum.forumTotalMembers += 1;
      await forum.save();
    }
    res.status(200).json('confirm');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something Went Wrong!', error: error.message });
  }
};


module.exports = {
  postGroup,
  getGroups,
  postRequestToJoinOrLeaveGroup,
  getSingleGroup,
  approveJoinRequest
};
