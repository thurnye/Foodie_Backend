const socketIO = require('socket.io');
const PanelChat = require('./models/panelChat.model');
const Chat = require('./models/chat.model');
const ChatRoom = require('./models/chatRoom.model');
const PrivateGroup = require('../Model/privateGroup');

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

    // ==========================================================================================
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

    socket.emit("me", socket.id);

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });


    // ==========================================================================================

    // Private Chat List

    // Private Chat List
    socket.on('chatList', async ({ userId }) => {
      try {
        const chats = await Chat.find({
          $or: [{ 'chat.sender': userId }, { 'chat.receiver': userId }],
        })
          .sort({ updatedAt: -1 })
          .populate({
            path: 'chat.sender chat.receiver',
            select: '_id firstName lastName avatar',
          })
          .exec();

        const groups = await PrivateGroup.find({ groupMembers: userId })
          .select('groupName groupDescription groupMembers startedBy updatedAt')
          .populate({
            path: 'groupMembers startedBy',
            select: '_id firstName lastName avatar',
          })
          .exec();



        const groupData = groups.map(
          ({
            _id,
            groupName,
            groupDescription,
            groupMembers,
            startedBy,
            updatedAt,
          }) => ({
            _id,
            chatRoomId: _id,
            updatedAt,
            groupName,
            groupDescription,
            groupMembers,
            startedBy,
            type: 'groupChat',
          })
        );

        const data = chats.map(({ _id, chatRoomId, chat, updatedAt }) => ({
          _id,
          chatRoomId,
          otherUser:
            chat[0].sender._id !== userId ? chat[0].receiver : chat[0].sender,
          type: 'singleChat',
          updatedAt,
        }));

        const allList = [...data, ...groupData].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        // Emit the chats to the client
        socket.emit('allChatsLists', {
          chatLists: data,
          groupList: groups,
          allList,
        });
      } catch (error) {
        console.error('Error retrieving chats:', error);
        socket.emit('error', 'Error retrieving chats');
      }
    });

    socket.on('joinPrivateGroup', async ({ roomId, type }) => {
      try {
        if (type === 'groupChat') {
          socket.join(roomId);
          ////console.log()g()g('joined private', roomId);
          const groupChatHistory = await PrivateGroup.findById(roomId)
            .populate({
              path: 'chat.sender',
              select: '_id firstName lastName avatar',
            })
            .exec();

            ////console.log()g()g(groupChatHistory)
          if (groupChatHistory) {
            groupChatHistory.decryptMessages();
            socket.emit('joinedChatRoom', {
              roomId,
              chatHistory: groupChatHistory.chat,
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('sendPrivateGroupMessage', async ({ roomId, sender, message }) => {
      try {
        const chat = { sender, message };
          const group = await PrivateGroup.findById(roomId);
          if(group){
            ////console.log()g()g(group)
            group.chat.push(chat);
            await group.save();
          }

          await PrivateGroup.populate(group, {
            path: 'chat.sender',
            select: '_id firstName lastName avatar',
          });

          group.decryptMessages();
    
          io.to(roomId).emit('newChat', group.chat[group.chat.length - 1]);
        
      } catch (error) {
        console.log(error)
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
