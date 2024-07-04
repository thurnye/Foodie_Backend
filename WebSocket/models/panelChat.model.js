const mongoose = require('mongoose');
const crypto = require('crypto-js');
const objectId = mongoose.Schema.Types.ObjectId;

const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String,
  name: String,
});

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
      image: imageSchema,
    }
  ]
}, {
  timestamps: true,
  collection: 'panelChat'
});

const secretKey = process.env.ENCRYPT_SECRET; 

// Encrypt message before saving
panelChatSchema.pre('save', function (next) {
  this.chat.forEach((chat, index) => {
    if (chat.isModified('message') && !chat.message.startsWith('U2FsdGVkX1')) {
      const encryptedMessage = crypto.AES.encrypt(chat.message, secretKey).toString();
      this.chat[index].message = encryptedMessage;
    }
  });
  next();
});

// Decrypt messages when retrieving
panelChatSchema.methods.decryptMessages = function () {
  this.chat.forEach((chat, index) => {
    if (chat.message.startsWith('U2FsdGVkX1')) {
      const bytes = crypto.AES.decrypt(chat.message, secretKey);
      this.chat[index].message = bytes.toString(crypto.enc.Utf8);
    }
  });
};


module.exports = mongoose.model('panelChat', panelChatSchema);