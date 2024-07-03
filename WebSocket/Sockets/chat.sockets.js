const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');

module.exports = (io, socket) => {
    socket.on('joinChatRoom', async ({ userId, receiverId, roomId }) => {
        try {
          let chatRoomId = roomId;
          if (!chatRoomId) {
            // Check if a chat room already exists between these users in either order
            let chatRoom = await ChatRoom.findOne({
              $or: [
                { user1: userId, user2: receiverId },
                { user1: receiverId, user2: userId },
              ],
            });
  
            if (!chatRoom) {
              chatRoom = new ChatRoom({ user1: userId, user2: receiverId });
              await chatRoom.save();
              ////console.log()g()g('Chat room created');
            }
            chatRoomId = chatRoom._id.toString();
          }
  
          socket.join(chatRoomId);
  
          // Fetch chat history
          const chatHistory = await Chat.findOne({ chatRoomId })
            .populate({
              path: 'chat.sender chat.receiver',
              select: '_id firstName lastName avatar',
            })
            .exec();
  
          if (chatHistory) {
            // Decrypt messages
            chatHistory.decryptMessages();
            socket.emit('joinedChatRoom', {
              roomId: chatRoomId,
              chatHistory: chatHistory.chat,
            });
          } else {
            socket.emit('joinedChatRoom', {
              roomId: chatRoomId,
              chatHistory: [],
            });
          }
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', {
            message: 'An error occurred while joining the chat room.',
          });
        }
      });
  
      socket.on('sendChat', async ({ roomId, sender, receiverId, message }) => {
        try {
          let singleRoom = await Chat.findOne({ chatRoomId: roomId }).exec();
          if (!singleRoom) {
            singleRoom = new Chat({ chatRoomId: roomId, chat: [] });
          }
          singleRoom.chat.push({
            sender,
            receiver: receiverId,
            message,
          });
          await singleRoom.save();
  
          await Chat.populate(singleRoom, {
            path: 'chat.sender',
            select: '_id firstName lastName avatar',
          });
  
          singleRoom.decryptMessages();
  
          // ////console.log()g()g(singleRoom);
  
          io.to(roomId).emit(
            'newChat',
            singleRoom.chat[singleRoom.chat.length - 1]
          );
        } catch (err) {
          console.error(err);
        }
      });
};