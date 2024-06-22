const mongoose = require('mongoose');
const crypto = require('crypto-js');
const objectId = mongoose.Schema.Types.ObjectId;



const chatSchema = new mongoose.Schema({
  chatRoomId: {
    type: objectId,
    required: true,
    ref: 'chatRoom'
  },
  chat: [
    {
      sender: {
        type: objectId,
        ref: 'User',
      },
      receiver: {
        type: objectId,
        ref: 'User',
      },
      message: {
        type: String,
        required: true
      },
      read: {
        type: Number,
        default: 1
      }
    }
  ]
}, {
  timestamps: true,
  collection: 'chat'
});

const secretKey = process.env.ENCRYPT_SECRET; 


// Encrypt message before saving
chatSchema.pre('save', function(next) {
  this.chat.forEach(chat => {
    if (chat.isModified('message')) {
      const encryptedMessage = crypto.AES.encrypt(chat.message, secretKey).toString();
      chat.message = encryptedMessage;
    }
  });
  next();
});

// Decrypt messages when retrieving
chatSchema.methods.decryptMessages = function() {
  this.chat.forEach(chat => {
    const bytes = crypto.AES.decrypt(chat.message, secretKey);
    chat.message = bytes.toString(crypto.enc.Utf8);
  });
};

module.exports = mongoose.model('Chat', chatSchema);
