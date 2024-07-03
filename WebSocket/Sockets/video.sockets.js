const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');

const rooms = {};

module.exports = (io, socket) => {
 // Video Chat Offer

    // socket.on('join video room', (roomId) => {
    //   if (rooms[roomId]) {
    //     rooms[roomId].push(socket.id);
    //   } else {
    //     rooms[roomId] = [socket.id];
    //   }
    //   const otherUser = rooms[roomId].find((id) => id !== socket.id);
    //   if (otherUser) {
    //     socket.emit('other user', otherUser);
    //     socket.to(otherUser).emit('user joined', socket.id);
    //   }
    // });

    // socket.on('offer', (payload) => {
    //   io.to(payload.target).emit('offer', payload);
    // });

    // socket.on('answer', (payload) => {
    //   io.to(payload.target).emit('answer', payload);
    // });

    // socket.on('ice-candidate', (incoming) => {
    //   io.to(incoming.target).emit('ice-candidate', incoming.candidate); // for best connection btwn candidates
    // });

    // ----
    // socket.emit("me", socket.id);

    //  socket.on('join video room', (roomId) => {
    //   console.log({roomId})
    //   socket.emit("me", socket.id);
    // });

    // socket.on("callUser", (data) => {
    //   console.log("Call User", data);
    //   io.to(data.userToCall).emit("callUser", {
    //     signal: data.signalData,
    //     from: data.from,
    //     name: data.name
    //   });
    // });
  
    // socket.on("answerCall", (data) => {
    //   console.log("Answer Call", data);
    //   io.to(data.to).emit("callAccepted", data.signal);
    // });
  
    // socket.on("leaveCall", (data) => {
    //   console.log("Leave Call", data);
    //   io.to(data.to).emit("callEnded");
    // });

    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push(socket.id);
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });
    
      socket.on('requestVideoCall', ({ roomId }) => {
        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        if (otherUsers.length > 0) {
          const recipient = otherUsers[0]; // assuming 1-on-1 call
          io.to(recipient).emit('incomingCall', { caller: socket.id });
        }
      });
    
      socket.on('acceptCall', ({ roomId }) => {
        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        if (otherUsers.length > 0) {
          const caller = otherUsers[0]; // assuming 1-on-1 call
          io.to(caller).emit('callAccepted');
          io.to(socket.id).emit('callAccepted');
        }
      });
    
      socket.on('declineCall', ({ roomId }) => {
        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        if (otherUsers.length > 0) {
          const caller = otherUsers[0]; // assuming 1-on-1 call
          io.to(caller).emit('callDeclined');
        }
      });
    
      socket.on('signal', ({ roomId, signal }) => {
        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        if (otherUsers.length > 0) {
          const recipient = otherUsers[0]; // assuming 1-on-1 call
          io.to(recipient).emit('signal', { signal });
        }
      });
  
};