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
            const transformedChatHistory = postChatHistory.chat.map(chat => {
              const chatObject = chat.toObject();
              if (chatObject.image) {
                chatObject.image.data = chatObject.image.data.toString('base64');
              }
              return chatObject;
            });
            socket.emit('group chat history', transformedChatHistory);
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

      socket.on('sendGroupImage', async (data) => {
        try {
          console.log('sendImage event received:', data);
    
          const roomId = data.roomId;
          const sender = data.sender;
          const imageBuffer = Buffer.from(data.image);
          const imageName = data.imageName;
          const imageType = data.imageType;
          const chatType = data.chatType
    
          let singleRoom = await Panel.findOne({ panelId: roomId }).exec();
          if (!singleRoom) {
            singleRoom = new PanelChat({ panelId, chat: [] });
          }
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
    
          await PanelChat.populate(singleRoom, {
            path: 'chat.sender',
            select: '_id firstName lastName avatar',
          });
    
          singleRoom.decryptMessages();
    
          io.to(roomId).emit(
            'message',
            {
              ...singleRoom.chat[singleRoom.chat.length - 1].toObject(),
              image: {
                ...singleRoom.chat[singleRoom.chat.length - 1].image.toObject(),
                data: imageBuffer.toString('base64')
              }
            }
          );
        } catch (err) {
          console.error('Error sending image:', err);
        }
      });
};