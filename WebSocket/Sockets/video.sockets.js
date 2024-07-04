const PanelChat = require('../models/panelChat.model');
const Chat = require('../models/chat.model');
const ChatRoom = require('../models/chatRoom.model');
const PrivateGroup = require('../../Model/privateGroup');

const rooms = {};
const callIds = new Map(); 

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9); // Generate a random ID
}

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

     socket.on('join video room', (roomId) => {
      console.log({roomId})
      socket.emit("me", socket.id);
    });

    socket.on("callUser", (data) => {
      console.log("Call User", data);
      io.to(data.userToCall).emit("callUser", {
        signal: data.signalData,
        from: data.from,
        name: data.name
      });
    });
  
    socket.on("answerCall", (data) => {
      console.log("Answer Call", data);
      io.to(data.to).emit("callAccepted", data.signal);
    });
  
    socket.on("leaveCall", (data) => {
      console.log("Leave Call", data);
      io.to(data.to).emit("callEnded");
    });




  
};