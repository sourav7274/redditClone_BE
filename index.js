require('./db/db.connect')
require("dotenv").config()

const JWT = require('jsonwebtoken')
const express = require('express')
const cors = require('cors')

const app = express()
const corsOption = {
    origin: "*", // Fixed typo from "origni" to "origin"
    credentials: true,
    optionsSuccessStatus: 200 // Fixed typo from "optionSuccessStatus" to "optionsSuccessStatus"
};

app.use(cors(corsOption));
app.use(express.json())


const jwtSecret= "trailsecret"



const Post = require('./models/post.model')
const User = require('./models/user.model')
const Like = require('./models/like.model')
const Comment = require('./models/comments.model')



app.get("/",(req,res) =>{
    res.json({message:"Testing"})
})

async function getUserByID(id){
    const user = await User.findById(id).populate('posts').populate('comments').populate('likedPosts').populate('requests')
    if(user){
        return user
    }
    else{
    return "User not found"
    }
}



async function getUserByEmail(email){
    const user = await User.findOne({email}).populate('posts').populate({
        path:'comments',
        populate:{
            path:'postId',
            select: 'title'
        }
    }).populate({
        path:'likedPosts',
        populate:{
           path:'postId',
           select: 'title' ,
           populate:{
            path:'author',
            select: 'name'
           }
        }
    })    
    .populate('requests') 
    if(user){
        return user
    }
    else{
        return "User not found"
    }
}

async function getPostById(id)
{
    const post = await Post.findById(id).populate('author').populate({
        path:'comments',
        populate:{
            path:'userId',
            select: 'name usrImgUrl'
        }
    })
    if(post)
    {
        return post
    }
    else
    {
        return "Post Not Found"
    }
}



app.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find().populate({
            path:'author',
            select: 'name usrImgUrl'
        }).populate('comments').populate('likes');
       
        if (posts) {
            res.status(200).json({ message: "Success", posts });
        } else {
            res.status(404).json({ message: "No post found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

app.get("/users/:id",async (req,res) =>{
    try{
        const user = await getUserByID(req.params.id)
        if(user)
            {
                res.status(200).json({message:"Success",user})
            } 
        else{
            res.status(404).json({message:"User not found"})
        }      
    } catch(err){
        res.status(500).json({message:"Server Error",user})
    }
})

app.get("/users",async (req,res) =>{
    try{
        const user = await User.find().populate('posts').populate('comments').populate('likedPosts').populate('requests')
        if(user){
            res.status(200).json({message:"Success",user})
        }
        else{
            res.status(404).json({message:"User not found"})
        }
    } catch(err){
        res.status(500).json({message:"Server Error"})
    }

})

app.get("/comments/:postId",async (req,res) =>{
    try{
        const id = req.params.postId
        const comments = await Comment.find({id})
        if(comments){
            res.status(200).json({message:"Success",comments})
        }
        else{
            res.status(404).json({message:"No comments found"})
        }
    } catch(err){
        res.status(500).json({message:"Server Error"})
    }
})

app.get("/likes",async (req,res) =>{
    try{
        const likes = await Like.find()
        if(likes){
            res.status(200).json({message:"Success",likes})
        }
        else{
            res.status(404).json({message:"No likes found"})
        }
    } catch(err){
        res.status(500).json({message:"Server Error"})
    }
})

app.post('/signIn', async(req,res) =>{
    // console.log(req.body)
    try{
        const email = req.body.email
        const pass = req.body.password
        const user = await getUserByEmail(email)
        if(user)
        {
            if(user.password === pass){
            //    console.log(user) // Not commented out
                res.status(200).json({message:"Success",user})
            }
            else{
                res.status(401).json({message:"Invalid password"})
            }
        }
        else{
            res.status(404).json({message:"User not found"})
        }
    }
    catch(err){
        res.status(500).json({message:"Server Error"})
    }
})


app.post("/like",async (req,res) =>{
    try{
        const like = new Like(req.body)
        await like.save()
        res.status(201).json({message:"Like added successfully"})
    } catch(err){
        res.status(500).json({message:"Server Error"})
    }
})

app.post("/post", async (req, res) => {
    // console.log("Request body:", req.body); // Log the request body
    const author = req.body.author;
    try {
       const newPost = new Post(req.body);
        await newPost.save();

        if (newPost) {
            const user = await User.findById(author);
            user.posts.push(newPost._id);
            await user.save();
        }

        res.status(201).json({ message: "Post created successfully", newPost });
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

app.post("/comment",async (req,res) =>{
    try{
        const comment = new Comment(req.body)
        await comment.save()

        const post = await getPostById(req.body.postId)
        post.comments.push(comment._id)
        await post.save()

        const user = await getUserByID(req.body.userId)
        user.comments.push(comment._id)
        await user.save()
        
        res.status(201).json({message:"Comment added successfully"})
       
      
    } catch(err){
        res.status(500).json({message:"Server Error"})
    }
})

app.post("/signUp",async(req,res) =>{
    // console.log(req.body) // Not commented out
    try{
        const newUser = new User(req.body)
        await newUser.save()
        res.status(201).json({message:"User created successfully"})
    }
   catch(err){
        res.status(500).json({message:"Server Error"})
    }
})



app.get("/posts/:id",async (req,res) =>{
    try{
        const post = await getPostById(req.params.id)

        if(post)
        {
            res.status(201).json({message:"Post Found",post})
        }
        else
        {
            res.status(404).json({error:"Post Found"})
        }
    }
    catch(err)
    {
        res.status(500).json({error:"Internal Server Error",err})
    }
})




app.post("/likepost",async (req,res) =>{
    try{
     
        const newLike = new Like(req.body)
        await newLike.save()

      
        if(newLike)
        {
            const post = await getPostById(req.body.postId)
            const user = await getUserByID(req.body.userId)

            if(post && user)
            {
                post.likes.push(newLike._id)
                await post.save()
    
                user.likedPosts.push(newLike._id)
                await user.save()
    
    
                // console.log(user,post)   
            }
            else{
                console.log("Not Found")
            }

            res.status(201).json({message:"Liked the post"})
        }
    }
    catch(err)
    {
        res.status(500).json({error:"Internal Server Error",err})
    }
})


app.get('/commentByPostId/:id',async (req,res) => {
    const id = req.params.id
    try{
        const comment = await Comment.find({postId:id}).populate({
            path:'userId',
            select: 'name usrImgUrl'
        })
        // console.log(comment)
        if(comment)
        {
            res.status(200).json({message:"Success",comment})
        }
    }
    catch(err)
    {
        res.status(500).json({error:"Internal Server Error",err})
    }
})




const PORT = process.env.PORT || 5000
app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`) // Not commented out
})