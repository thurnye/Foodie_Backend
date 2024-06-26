const ChatRoom = require('../Chat/WebSocket/models/chatRoom.model')

//Post a Review
const postChatRoom = async (req, res, next) => {
  try {

    let chatRoom = await ChatRoom.findOne({
      $or: [
        { user1, user2 },
        { user1: user2, user2: user1 }
      ]
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({ user1, user2 });
      await chatRoom.save();
    }
    
    res.status(200).json(chatRoom);
  } catch (error) {
    res.status(500).json('An error occurred!' );
  }
};

module.exports = {
  postChatRoom,
};
