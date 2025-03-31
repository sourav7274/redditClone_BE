const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    age:Number,
    usrImgUrl:String,
    posts:[{type: mongoose.Schema.Types.ObjectId,ref:'Post'}],
    friends:[String],
    interests:[{
        enum:["sports","science","music","art","technology","politics","history","food","travel","fashion","fitness","photography","movies","books","gaming","nature","animals","culture","education","health","lifestyle","beauty","business","finance","career","family","relationships","spirituality","self-improvement","hobbies","outdoors","social","entertainment","other"],
        type:String
    }],
    likedPosts:[{type: mongoose.Schema.Types.ObjectId,ref:'Like'}],
    comments:[{type: mongoose.Schema.Types.ObjectId,ref:'Comment'}],
    requests:[{type: mongoose.Schema.Types.ObjectId,ref:'User'}],
})

const User = mongoose.model('User',userSchema)

module.exports = User