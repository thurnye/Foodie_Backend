const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');
const { getRandomInt } = require('../../Utils/common');
const User = require('../../Model/user')

module.exports = (io, socket) => {
  // Private Chat List
  socket.on('chatList', async ({ userId }) => {
    try {
      const chats = await Chat.find({
        $or: [{ 'chat.sender': userId }, { 'chat.receiver': userId }],
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: 'chat.sender chat.receiver',
          select: '_id firstName lastName avatar',
        })
        .exec();

      const groups = await PrivateGroup.find({ groupMembers: userId })
        .select('groupName groupDescription groupMembers startedBy updatedAt groupAvatar')
        .populate({
          path: 'groupMembers startedBy',
          select: '_id firstName lastName avatar',
        })
        .exec();

      const groupData = groups.map(
        ({
          _id,
          groupName,
          groupAvatar,
          groupDescription,
          groupMembers,
          startedBy,
          updatedAt,
        }) => ({
          _id,
          chatRoomId: _id,
          updatedAt,
          groupName,
          groupAvatar,
          groupDescription,
          groupMembers,
          startedBy,
          type: 'groupChat',
          randomId: getRandomInt(),
        })
      );

      const data = chats.map(({ _id, chatRoomId, chat, updatedAt }) => ({
        _id,
        chatRoomId,
        otherUser:
          chat[0].sender._id.toString() === userId.toString()
            ? chat[0].receiver
            : chat[0].sender,
        type: 'singleChat',
        updatedAt,
        randomId: getRandomInt(),
      }));

      const allList = [...data, ...groupData].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      // Emit the chats to the client
      socket.emit('allChatsLists', {
        chatLists: data,
        groupList: groups,
        allList,
      });
    } catch (error) {
      console.error('Error retrieving chats:', error);
      socket.emit('error', 'Error retrieving chats');
    }
  });

  socket.on('joinPrivateGroup', async ({ roomId, type }) => {
    try {
      if (type === 'groupChat') {
        socket.join(roomId);
        const groupChatHistory = await PrivateGroup.findById(roomId)
          .populate({
            path: 'chat.sender',
            select: '_id firstName lastName avatar',
          })
          .exec();

        if (groupChatHistory) {
          groupChatHistory.decryptMessages();
          const transformedChatHistory = groupChatHistory.chat.map((chat) => {
            const chatObject = chat.toObject();
            if (chatObject.image) {
              chatObject.image.data = chatObject.image.data.toString('base64');
            }
            return chatObject;
          });
          socket.emit('joinedChatRoom', {
            roomId,
            chatHistory: transformedChatHistory,
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('sendPrivateGroupMessage', async ({ roomId, sender, message }) => {
    try {
      const chat = { sender, message };
      const group = await PrivateGroup.findById(roomId);
      if (group) {
        group.chat.push(chat);
        await group.save();
      }

      await PrivateGroup.populate(group, {
        path: 'chat.sender',
        select: '_id firstName lastName avatar',
      });

      group.decryptMessages();

      io.to(roomId).emit('newChat', group.chat[group.chat.length - 1]);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('sendPrivateGroupImage', async (data) => {
    try {
      const roomId = data.roomId;
      const sender = data.sender;
      const imageBuffer = Buffer.from(data.image);
      const imageName = data.imageName;
      const imageType = data.imageType;

      let singleRoom = await PrivateGroup.findById(roomId).exec();

      if (singleRoom) {
        singleRoom.chat.push({
          sender,
          message: '',
          image: {
            data: imageBuffer,
            contentType: imageType,
            name: imageName,
          },
        });
        await singleRoom.save();
      }

      await PrivateGroup.populate(singleRoom, {
        path: 'chat.sender',
        select: '_id firstName lastName avatar',
      });

      singleRoom.decryptMessages();

      io.to(roomId).emit('newChat', {
        ...singleRoom.chat[singleRoom.chat.length - 1].toObject(),
        image: {
          ...singleRoom.chat[singleRoom.chat.length - 1].image.toObject(),
          data: imageBuffer.toString('base64'),
        },
      });
    } catch (err) {
      console.error('Error sending image:', err);
    }
  });

  socket.on('updatePrivateGroupInfo', async (data) => {
    try {
      const { _id, user, chatRoomId } = data;
      const group = await PrivateGroup.findById(_id).populate({
        path: 'chat.sender',
        select: '_id firstName lastName avatar',
      })
      .exec();

      if (group) {
        group.groupName = data.groupName;
        group.groupAvatar = data.groupAvatar;
        group.groupDescription = data.groupDescription;

        const result = await group.save();

        await PrivateGroup.populate(result, {
          path: ' groupMembers chat.sender',
          select: '_id firstName lastName avatar',
        });

        const {
          groupName,
          groupDescription,
          groupMembers,
          startedBy,
          groupAvatar,
          updatedAt,
        } = result;

        const groupData = {
          _id,
          chatRoomId: _id,
          updatedAt,
          groupName,
          groupAvatar,
          groupDescription,
          groupMembers,
          startedBy,
          type: 'groupChat',
          randomId: getRandomInt(),
        };

        socket.emit('privateGroupInfoUpdated', groupData);
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('addToPrivateGroup', async(data) => {
    try {
      console.log(data)
      const {email, groupId} = data;

      const user = await User.findOne({email});
      if (!user) {
        throw new Error('User not found');
      }

      const group = await PrivateGroup.findById(groupId)
      if (!group) {
        throw new Error('Group not found');
      }

      group.groupMembers.push(user._id);
      await group.save();

      await PrivateGroup.populate(group, {
        path: ' groupMembers',
        select: '_id firstName lastName avatar',
      });

      console.log(group.groupMembers)

      socket.emit('newMemberAdded', group.groupMembers);

    } catch (error) {
      console.log(error)
    }
  })
};
