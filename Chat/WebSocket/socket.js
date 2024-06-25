const socketIO = require('socket.io');
const PanelChat = require('./models/panelChat.model');

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
        socket.join(groupId);  // Join the room
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


    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = initializeSocket;
