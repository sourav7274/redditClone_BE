const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  imgUrl: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  likeCount :{
    type:Number,
    default: 0
  }
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
