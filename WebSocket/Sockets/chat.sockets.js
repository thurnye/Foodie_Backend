const mongoose = require('mongoose');
const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');

module.exports = (io, socket) => {
  socket.on('joinChatRoom', async ({ userId, receiverId, roomId }) => {
    try {
      console.log('joinChatRoom event received:', { userId, receiverId, roomId });

      let chatRoomId = roomId;
      if (!chatRoomId) {
        console.log('No roomId provided, finding or creating chat room...');
        let chatRoom = await ChatRoom.findOne({
          $or: [
            { user1: userId, user2: receiverId },
            { user1: receiverId, user2: userId },
          ],
        });

        if (!chatRoom) {
          chatRoom = new ChatRoom({ user1: userId, user2: receiverId });
          await chatRoom.save();
          console.log('Chat room created:', chatRoom._id);
        }
        chatRoomId = chatRoom._id.toString();
      }

      console.log('Joining room:', chatRoomId);
      socket.join(chatRoomId);

      const chatHistory = await Chat.findOne({ chatRoomId })
        .populate({
          path: 'chat.sender chat.receiver',
          select: '_id firstName lastName avatar',
        })
        .exec();

      console.log('Chat history fetched for room:', chatRoomId);

      if (chatHistory) {
        console.log('Original chatHistory:', chatHistory.chat);
        chatHistory.decryptMessages();
        const transformedChatHistory = chatHistory.chat.map(chat => {
          const chatObject = chat.toObject();
          if (chatObject.image) {
            chatObject.image.data = chatObject.image.data.toString('base64');
          }
          return chatObject;
        });
        console.log('Transformed chatHistory:', transformedChatHistory);
        socket.emit('joinedChatRoom', {
          roomId: chatRoomId,
          chatHistory: transformedChatHistory,
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
      console.log('sendChat event received:', { roomId, sender, receiverId, message });

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

      io.to(roomId).emit(
        'newChat',
        singleRoom.chat[singleRoom.chat.length - 1]
      );
    } catch (err) {
      console.error('Error sending chat:', err);
    }
  });

  socket.on('sendImage', async (data) => {
    try {
      console.log('sendImage event received:', data);

      const roomId = data.roomId;
      const sender = data.sender;
      const receiverId = data.receiverId;
      const imageBuffer = Buffer.from(data.image);
      const imageName = data.imageName;
      const imageType = data.imageType;

      let singleRoom = await Chat.findOne({ chatRoomId: roomId }).exec();
      if (!singleRoom) {
        singleRoom = new Chat({ chatRoomId: roomId, chat: [] });
      }
      singleRoom.chat.push({
        sender,
        receiver: receiverId,
        message: '',
        image: {
          data: imageBuffer,
          contentType: imageType,
          name: imageName,
        },
      });
      await singleRoom.save();

      await Chat.populate(singleRoom, {
        path: 'chat.sender',
        select: '_id firstName lastName avatar',
      });

      singleRoom.decryptMessages();

      io.to(roomId).emit(
        'newChat',
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
