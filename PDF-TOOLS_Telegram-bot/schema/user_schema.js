const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    unique: true,
    required: true
  },
  username: String,
  firstName: String,
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
