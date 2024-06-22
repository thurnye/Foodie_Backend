// backend/socket.js
const socketIO = require('socket.io');
const PostChat = require('./models/panelChat.model');
const Chat = require('./models/chat.model');
const GroupRoom = require('./models/group.model');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('socket connected');

    // Single Chat
    socket.on('join room', async (chatRoomId) => {
      try {
        socket.join(chatRoomId);
        const chatHistory = await Chat.findOne({ chatRoomId }).exec();
        if (chatHistory) {
          chatHistory.decryptMessages();
          socket.emit('chat history', chatHistory.chat);
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on(
      'chat message',
      async ({ chatRoomId, sender, receiver, message }) => {
        try {
          let chat = await Chat.findOne({ chatRoomId }).exec();
          if (!chat) {
            chat = new Chat({ chatRoomId, chat: [] });
          }
          chat.chat.push({ sender, receiver, message });
          await chat.save();

          chat.decryptMessages();
          io.to(chatRoomId).emit(
            'chat message',
            chat.chat[chat.chat.length - 1]
          );
        } catch (err) {
          console.error(err);
        }
      }
    );

    socket.on('join group', async (groupId) => {
      try {
        socket.join(groupId);
        const postChatHistory = await PostChat.findOne({ groupId }).exec();
        if (postChatHistory) {
          postChatHistory.decryptMessages();
          socket.emit('group chat history', postChatHistory.chat);
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('group chat message', async ({ groupId, sender, message }) => {
      try {
        let postChat = await PostChat.findOne({ groupId }).exec();
        if (!postChat) {
          postChat = new PostChat({ groupId, chat: [] });
        }
        postChat.chat.push({ sender, message });
        await postChat.save();

        postChat.decryptMessages();
        io.to(groupId).emit(
          'group chat message',
          postChat.chat[postChat.chat.length - 1]
        );
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
}

module.exports = initializeSocket;
