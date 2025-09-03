const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
  sendingUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recievingUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  note: String,
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
}, { timestamps: true });

const Friend = mongoose.model("Friend", friendSchema);

module.exports = Friend;
