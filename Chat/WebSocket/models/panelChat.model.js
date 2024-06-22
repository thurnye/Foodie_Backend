// backend/models/panelChat.js
const mongoose = require('mongoose');
const crypto = require('crypto-js');
const objectId = mongoose.Schema.Types.ObjectId;

const panelChatSchema = new mongoose.Schema({
  panelId: {
    type: objectId,
    required: true,
    ref:'groupPanel'
  },
  chat: [
    {
      sender: {
        type: objectId,
        required: true,
        ref: 'User',
      },
      message: {
        type: String,
        required: true,
      },
      readBy: [
        {
          type: objectId,
          ref: 'User',
        }
      ]
    }
  ]
}, {
  timestamps: true,
  collection: 'panelChat'
});

const secretKey = process.env.ENCRYPT_SECRET; 

// Encrypt message before saving
panelChatSchema.pre('save', function(next) {
  this.chat.forEach(chat => {
    if (chat.isModified('message')) {
      const encryptedMessage = crypto.AES.encrypt(chat.message, secretKey).toString();
      chat.message = encryptedMessage;
    }
  });
  next();
});

// Decrypt messages when retrieving
panelChatSchema.methods.decryptMessages = function() {
  this.chat.forEach(chat => {
    const bytes = crypto.AES.decrypt(chat.message, secretKey);
    chat.message = bytes.toString(crypto.enc.Utf8);
  });
};

module.exports = mongoose.model('panelChat', panelChatSchema);
