const mongoose = require('mongoose');
const crypto = require('crypto-js');
const objectId = mongoose.Schema.Types.ObjectId;

const privateGroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },
  groupDescription: {
    type: String,
  },
  members: [
    {
      type: objectId,
      ref: 'User',
    },
  ],
  startedBy: {
    type: objectId,
    ref: 'User',
    required: true
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
      }
    }
  ]
}, {
  timestamps: true,
  collection: 'privateGroup'
});

const secretKey = process.env.ENCRYPT_SECRET; 

// Encrypt message before saving
privateGroupSchema.pre('save', function (next) {
  this.chat.forEach((chat, index) => {
    if (chat.isModified('message') && !chat.message.startsWith('U2FsdGVkX1')) {
      const encryptedMessage = crypto.AES.encrypt(chat.message, secretKey).toString();
      this.chat[index].message = encryptedMessage;
    }
  });
  next();
});

// Decrypt messages when retrieving
privateGroupSchema.methods.decryptMessages = function () {
  this.chat.forEach((chat, index) => {
    if (chat.message.startsWith('U2FsdGVkX1')) {
      const bytes = crypto.AES.decrypt(chat.message, secretKey);
      this.chat[index].message = bytes.toString(crypto.enc.Utf8);
    }
  });
};


module.exports = mongoose.model('privateGroup', privateGroupSchema);