const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title:String,
    imgUrl:String,
    author:{type: mongoose.Schema.Types.ObjectId,ref:'User'},
    likes:[{type: mongoose.Schema.Types.ObjectId,red:'Like'}],
    isLikedByUser:{
        type:Boolean,
        default:false
    },
    description:String,
    comments:[{type: mongoose.Schema.Types.ObjectId,ref:'Comment'}],
})


const Post = mongoose.model('Post',postSchema)

module.exports = Post