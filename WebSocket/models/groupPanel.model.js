const mongoose = require('mongoose');
const objectId = mongoose.Schema.Types.ObjectId;

const groupPanelSchema = mongoose.Schema(
  {
    panel: {
      type: String,
      required: true,
    },
    groupId: {
      type: objectId,
      ref: 'group',
      required: true,
    },
    membersInPanel: [
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
    comments: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  },
  {
    collection: 'groupPanel',
  }
);

module.exports = mongoose.model('groupPanel', groupPanelSchema);
