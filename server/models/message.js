var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var logger = require('../../config/logger');

/*
 * Things to add...
 * Salt
 * MD5 Hash of Original Message
 *
 * These messages could still be changed at the server so this might should be
 * based on the admin certificate in some way. Short messages would be much easier
 * to brute force without a salt but the salt would also be stored so it makes this
 * difficult.
 */

var messageSchema = new Schema({
  date: { type: Date, default: new Date() },
  messageId: { type: String },
  type: { type: String },
  _room: { type: mongoose.SchemaTypes.ObjectId, ref: "room", index: true },
  _chat: { type: mongoose.SchemaTypes.ObjectId, ref: "chat", index: true },
  _fromUser: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  _toUsers: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User", default: [] }],
  //_toChat: { type: mongoose.SchemaTypes.ObjectId, ref: "Chat" },
  encryptedMessage: { type: String }
});


messageSchema.statics.sanatize = function sanatize(message, callback) {
  var toUsersArray = [];

  this.populate(message, { path: '_fromUser _toUsers' }, function(err, populatedMessage) {

    if (populatedMessage._toUsers.length > 0) {
      populatedMessage._toUsers.forEach(function(toUser) {
        toUsersArray.push(toUser._id.toString());
      });
    }

    // Consider changing messageId to id
    var sanatizedMessage = {
      date: populatedMessage.date,
      messageId: message.messageId,
      fromUser: populatedMessage._fromUser._id.toString(),
      toUsers: toUsersArray,
      //toChat: populatedMessage._toChat._id.toString(),
      encryptedMessage: populatedMessage.encryptedMessage
    };

    return callback(sanatizedMessage);
  });
};

messageSchema.statics.bulkSanatize = function bulkSanatize(messages, callback) {
  var self = this;
  var sanatizedMessages = [];
  var count = 0;

  messages.forEach(function(message) {
    self.sanatize(message, function(sanatizedMessage) {
      sanatizedMessages.push(sanatizedMessage);
      count++;

      if (count == messages.length) {
        finish();
      };
    });
  });

  var finish = function() {
    return callback(sanatizedMessages);
  };
};

module.exports = mongoose.model('Message', messageSchema);
