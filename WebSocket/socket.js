
const socketIO = require('socket.io');
const PanelChat = require('./models/panelChat.model');
const Chat = require('./models/chat.model');
const ChatRoom = require('./models/chatRoom.model');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const typingUsers = {};

  io.on('connection', (socket) => {
    console.log('A user connected');

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
        console.log({ panelId, sender, message });
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

        console.log(postChat);

        io.to(panelId).emit('message', postChat.chat[postChat.chat.length - 1]);
      } catch (err) {
        console.error(err);
      }
    });

    // Handle Typing Event
    socket.on('typing', ({ panelId, user }) => {
      typingUsers[panelId] = { user };
      io.to(panelId).emit('typing', { currentTypingUser: user });
    });

    // ==========================================================================================

    // Single Chat
    socket.on('joinChatRoom', async ({ userId, receiverId, roomId }) => {
      try {
        let chatRoomId = roomId;
        if(!chatRoomId){
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
            console.log('Chat room created');
          }
          chatRoomId = chatRoom._id.toString();
        }

        socket.join(chatRoomId);
        console.log(`User ${userId} joined room ${chatRoomId}`);

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
        console.log({ roomId, sender, receiverId, message });
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

        // console.log(singleRoom);

        io.to(roomId).emit(
          'newChat',
          singleRoom.chat[singleRoom.chat.length - 1]
        );
      } catch (err) {
        console.error(err);
      }
    });

    // ==========================================================================================
    // Video Chat Offer

    socket.on('join video room', (roomId) => {
      if (rooms[roomId]) {
        rooms[roomId].push(socket.id);
      } else {
        rooms[roomId] = [socket.id];
      }
      const otherUser = rooms[roomId].find((id) => id !== socket.id);
      if (otherUser) {
        socket.emit('other user', otherUser);
        socket.to(otherUser).emit('user joined', socket.id);
      }
    });

    socket.on('offer', (payload) => {
      io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
      io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (incoming) => {
      io.to(incoming.target).emit('ice-candidate', incoming.candidate); // for best connection btwn candidates
    });

    // ==========================================================================================

    // Private Chat List

    // Private Chat List
    socket.on('chatList', async ({ userId }) => {
      try {
        const chats = await Chat.find({
          $or: [
            { 'chat.sender': userId },
            { 'chat.receiver':userId},
          ],
        })
          .sort({ updatedAt: -1 })
          .populate({
            path: 'chat.sender chat.receiver',
            select: '_id firstName lastName avatar',
          })
          .exec();

        
          const data = chats.map(({_id, chatRoomId, chat}) => ({
            _id,
            chatRoomId,
            otherUser: chat[0].sender._id !== userId ? chat[0].receiver : chat[0].sender,
            type:'singleChat'
          }))

        // Emit the chats to the client
        socket.emit('allChatsLists', { chatLists: data });
      } catch (error) {
        console.error('Error retrieving chats:', error);
        socket.emit('error', 'Error retrieving chats');
      }
    });

    // ==========================================================================================

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = initializeSocket;