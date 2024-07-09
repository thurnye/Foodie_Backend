const socketIO = require('socket.io');
const ChatSocket = require('./Sockets/chat.sockets');
const GeneralGroupSocket = require('./Sockets/generalGroup.sockets');
const PrivateGroupSocket = require('./Sockets/privateGroup.sockets');
const VideoSocket = require('./Sockets/video.sockets');


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

    ChatSocket(io, socket);
    GeneralGroupSocket(io, socket);
    PrivateGroupSocket(io, socket);
    VideoSocket(io, socket);


    // ==========================================================================================

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
