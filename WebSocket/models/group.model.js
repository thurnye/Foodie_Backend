const mongoose = require('mongoose');
const objectId = mongoose.Schema.Types.ObjectId;

const groupSchema = mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
    },
    groupAvatar: {
      type: String,
    },
    groupDescription: {
      type: String,
    },
    groupTotalPosts: {
        type: Number,
        default: 0
      },
    forumId: {
      type: objectId,
      ref: 'Forums',
      required: true,
    },
    groupMembers: [
      {
        type: objectId,
        ref: 'User',
      },
    ],
    pendingGroupMembers: [
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
  },
  {
    timestamps: true,
  },
  {
    collection: 'group',
  }
);

module.exports = mongoose.model('group', groupSchema);
