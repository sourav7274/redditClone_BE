const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema({
    postId:{type: mongoose.Schema.Types.ObjectId,ref:"Post"},
    userId:{type: mongoose.Schema.Types.ObjectId,ref:"User"},
    content:String, 
})

const Comment = mongoose.model('Comment',commentSchema)

module.exports = Comment