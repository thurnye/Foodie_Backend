const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');

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
                .select('groupName groupDescription groupMembers startedBy updatedAt')
                .populate({
                  path: 'groupMembers startedBy',
                  select: '_id firstName lastName avatar',
                })
                .exec();
      
      
      
              const groupData = groups.map(
                ({
                  _id,
                  groupName,
                  groupDescription,
                  groupMembers,
                  startedBy,
                  updatedAt,
                }) => ({
                  _id,
                  chatRoomId: _id,
                  updatedAt,
                  groupName,
                  groupDescription,
                  groupMembers,
                  startedBy,
                  type: 'groupChat',
                })
              );
      
              const data = chats.map(({ _id, chatRoomId, chat, updatedAt }) => ({
                _id,
                chatRoomId,
                otherUser:
                  chat[0].sender._id.toString() === userId.toString() ? chat[0].receiver : chat[0].sender,
                type: 'singleChat',
                updatedAt,
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
                ////console.log()g()g('joined private', roomId);
                const groupChatHistory = await PrivateGroup.findById(roomId)
                  .populate({
                    path: 'chat.sender',
                    select: '_id firstName lastName avatar',
                  })
                  .exec();
      
                  ////console.log()g()g(groupChatHistory)
                if (groupChatHistory) {
                  groupChatHistory.decryptMessages();
                  socket.emit('joinedChatRoom', {
                    roomId,
                    chatHistory: groupChatHistory.chat,
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
                if(group){
                  ////console.log()g()g(group)
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
              console.log(error)
            }
          });
};