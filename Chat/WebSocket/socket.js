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



    socket.on('joinChatRoom', async ({ userId, receiverId }) => {
      try {
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

        socket.join(chatRoom._id.toString());
        console.log(`User ${userId} joined room ${chatRoom._id}`);

        // Fetch chat history
        const chatHistory = await Chat.findOne({ chatRoomId: chatRoom._id })
          .populate({
            path: 'chat.sender chat.receiver',
            select: '_id firstName lastName avatar',
          })
          .exec();

          if(chatHistory){
            // Decrypt messages before sending
            chatHistory.decryptMessages();
            socket.emit('joinedChatRoom', { roomId: chatRoom._id, chatHistory: chatHistory.chat});
          }else{
            console.log(chatHistory)
            socket.emit('joinedChatRoom', { roomId: chatRoom._id, chatHistory: []});

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
        console.log({ roomId, sender, receiverId, message,  });
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

        io.to(roomId).emit('newChat', singleRoom.chat[singleRoom.chat.length - 1]);
      } catch (err) {
        console.error(err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = initializeSocket;
