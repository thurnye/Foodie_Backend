const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');

module.exports = (io, socket) => {
    // Join Group
    socket.on('join group', async (groupId) => {
        try {
          socket.join(groupId); // Join the room
          const postChatHistory = await PanelChat.findOne({ panelId: groupId })
            .populate({
              path: 'chat.sender',
              select: '_id firstName lastName avatar',
            })
            .exec();
  
          if (postChatHistory) {
            postChatHistory.decryptMessages();
            socket.emit('group chat history', postChatHistory.chat);
          }
        } catch (err) {
          console.error(err);
        }
      });
  
      // Send Group Message
      socket.on('sendMessage', async ({ panelId, sender, message }) => {
        try {
          ////console.log()g()g({ panelId, sender, message });
          let postChat = await PanelChat.findOne({ panelId }).exec();
          if (!postChat) {
            postChat = new PanelChat({ panelId, chat: [] });
          }
          postChat.chat.push({ sender, message });
          await postChat.save();
  
          await PanelChat.populate(postChat, {
            path: 'chat.sender',
            select: '_id firstName lastName avatar',
          });
  
          postChat.decryptMessages();
  
          ////console.log()g()g(postChat);
  
          io.to(panelId).emit('message', postChat.chat[postChat.chat.length - 1]);
        } catch (err) {
          console.error(err);
        }
      });
};