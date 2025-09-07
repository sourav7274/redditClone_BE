require("./db/db.connect");
require("dotenv").config();

const { Server } = require("socket.io");
const JWT = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const http = require("http");

const app = express();
const server = http.createServer(app);
const corsOption = {
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
};
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.use(cors(corsOption));
app.use(express.json());

const jwtSecret = "trailsecret";

const Post = require("./models/post.model");
const User = require("./models/user.model");
const Like = require("./models/like.model");
const Comment = require("./models/comments.model");
const Friend = require("./models/friend.model");
const Message = require("./models/messages.model");
const { error } = require("console");

app.get("/", (req, res) => {
  res.json({ message: "Testing" });
});

async function getUserByID(id) {
  const user = await User.findById(id)
    .populate({
      path: "posts",
      populate: {
        path: "author",
        select: "name usrImgUrl",
      },
    })
    .populate({
      path: "comments",
      populate: {
        path: "postId",
        select: "title author",
        populate: {
          path: "author",
          select: "name",
        },
      },
    })
    .populate({
      path: "likedPosts",
      select: "title author",
      populate: { path: "author", select: "name usrImgUrl" },
    })

    .populate("requests");
  if (user) {
    return user;
  } else {
    return "User not found";
  }
}

async function getUserByEmail(email) {
  const user = await User.findOne({ email })
    .populate("posts")
    .populate({
      path: "comments",
      populate: {
        path: "postId",
        select: "title author",
        populate: {
          path: "author",
          select: "name",
        },
      },
    })
    .populate({
      path: "likedPosts",
      select: "title author",
      populate: { path: "author", select: "name usrImgUrl" },
    })
    .populate("requests")
    .populate("friends", "name usrImgUrl");
  if (user) {
    return user;
  } else {
    return "User not found";
  }
}

async function getPostById(id) {
  const post = await Post.findById(id)
    .populate({
      path: "author",
      select: "_id name email usrImgUrl ",
    })
    .populate({
      path: "comments",
      populate: {
        path: "userId",
        select: "name usrImgUrl",
      },
    });
  if (post) {
    return post;
  } else {
    return "Post Not Found";
  }
}

app.get("/posts/:id", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate({
        path: "author",
        select: "name usrImgUrl",
      })
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "usrImgUrl",
        },
      });

    const otherPosts = posts.filter((post) => post.author._id != req.params.id);
    const userPosts = posts.filter((post) => post.author._id == req.params.id);

    const allPosts = [...otherPosts, ...userPosts];

    if (posts) {
      res.status(200).json({ message: "Success", posts: allPosts });
    } else {
      res.status(404).json({ message: "No post found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await getUserByID(req.params.id);
    if (user) {
      console.log(user);
      res.status(200).json({ message: "Success", user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", err });
  }
});

app.get("/users", async (req, res) => {
  try {
    const user = await User.find()
      .populate("posts")
      .populate("comments")
      .populate("likedPosts")
      .populate("requests");
    if (user) {
      res.status(200).json({ message: "Success", user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/otherUsers", async (req, res) => {
  const { id } = req.query;
  try {
    const users = await User.find({ _id: { $ne: id } }).select(
      "name email usrImgUrl"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/comments/:postId", async (req, res) => {
  try {
    const id = req.params.postId;
    const comments = await Comment.find({ id });
    if (comments) {
      res.status(200).json({ message: "Success", comments });
    } else {
      res.status(404).json({ message: "No comments found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/likes", async (req, res) => {
  try {
    const likes = await Like.find();
    if (likes) {
      res.status(200).json({ message: "Success", likes });
    } else {
      res.status(404).json({ message: "No likes found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/signIn", async (req, res) => {
  // console.log(req.body)
  try {
    const email = req.body.email;
    const pass = req.body.password;
    const user = await getUserByEmail(email);
    if (user) {
      if (user.password === pass) {
        //    console.log(user) // Not commented out
        res.status(200).json({ message: "Success", user });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error", err: err.message });
  }
});

// app.post("/like", async (req, res) => {
//   try {
//     const {postId,userId} = req.body

//     const existingLike = await Like.findOne({postId,userId})
//     if(existingLike)
//     {
//       await Like.deleteOne({postId,userId})
//       const likeCount = await Like.countDocuments({postId})
//       return res.json(200).json({message:"Unliked",liked:false,likeCount})
//     }
//     else{
//         const like = new Like(req.body);
//         await like.save();
//         const likeCount = await Like.countDocuments({postId})
//         res.status(201).json({ message: "Like added successfully",liked:true,likeCount });
//     }
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// });

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

app.post("/comment", async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();

    const post = await getPostById(req.body.postId);
    post.comments.push(comment._id);
    await post.save();

    const user = await getUserByID(req.body.userId);
    user.comments.push(comment._id);
    await user.save();

    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/signUp", async (req, res) => {
  console.log(req.body); // Not commented out
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: "User created successfully", newUser });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/postById/:id", async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (post) {
      res.status(201).json({ message: "Post Found", post });
    } else {
      res.status(404).json({ error: "Post Found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", err: err.message });
  }
});

app.post("/likepost", async (req, res) => {
  try {
    const { userId, postId } = req.body;
    if (!userId || !postId) {
      return res.status(400).json({ error: "Missing userId or postId" });
    }
    const existLike = await Like.findOne({ postId, userId });
    const user = await User.findById(userId);
    const post = await Post.findById(postId).select("likeCount");
    if (!userId || !postId) {
      return res.status(400).json({ error: "Missing userId or postId" });
    }
    if (existLike) {
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      await Like.deleteOne({ userId, postId });

      post.likeCount -= 1;
      await post.save();

      res.status(201).json({
        message: "Unliked the post",
      });
    } else {
      const newLike = new Like(req.body);
      await newLike.save();

      post.likeCount += 1;
      await post.save();

      user.likedPosts.push(postId);
      await user.save();
      const likeCount = await Like.countDocuments({ postId });
      res.status(201).json({
        message: "Liked the post",
        liked: true,
        likeCount,
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", err });
  }
});

app.get("/user/:id/like-posts", async (req, res) => {
  const user = await User.findById(req.params.id);
  const likedPostIds = user.likedPosts.map((post) => post._id.toString());
  res.status(200).json({ message: "data fetched", likedPostIds });
});

app.get("/commentByPostId/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const comment = await Comment.find({ postId: id }).populate({
      path: "userId",
      select: "name usrImgUrl",
    });
    // console.log(comment)
    if (comment) {
      res.status(200).json({ message: "Success", comment });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", err });
  }
});

app.put("/user/:id/updateDetails", async (req, res) => {
  try {
    const params = req.body;
    const id = req.params.id;
    console.log(params);
    const user = await User.findByIdAndUpdate(id, params, { new: true });
    if (user) {
      res.status(201).json({ message: "user updated succesfuuly" });
    } else {
      res.status(400).json({ error: "error while updating user" });
    }
  } catch (err) {
    console.log("some error occured", err);
    res.status(500).json({ error: "Internal server error", err });
  }
});

app.post("/friend-request", async (req, res) => {
  try {
    const { sendingUserId, recievingUserId, note } = req.body;

    if (sendingUserId === recievingUserId) {
      return res
        .status(400)
        .json({ message: "You cannot send a request to yourself" });
    }

    // Check if a request already exists
    const existingRequest = await Friend.findOne({
      sendingUserId,
      recievingUserId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const newRequest = new Friend({ sendingUserId, recievingUserId, note });
    await newRequest.save();

    res.status(201).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.get("/friend-requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await Friend.find({
      recievingUserId: userId,
      status: "pending",
    }).populate("sendingUserId", "name usrImgUrl");

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.get("/sent-friend-requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await Friend.find({
      sendingUserId: userId,
      status: "pending",
    })
      .select("recievingUserId _id")
      .populate("recievingUserId", "name usrImgUrl");

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.put("/friend-request-status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // accepted / rejected

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const friendRequest = await Friend.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    friendRequest.status = status;
    await friendRequest.save();

    // If accepted, add each other to friends list
    if (status === "accepted") {
      const sender = await User.findById(friendRequest.sendingUserId);
      const receiver = await User.findById(friendRequest.recievingUserId);

      if (sender && receiver) {
        sender.friends.push(receiver._id);
        receiver.friends.push(sender._id);
        await sender.save();
        await receiver.save();
      }
    }

    res
      .status(200)
      .json({ message: `Friend request ${status}`, friendRequest });
  } catch (err) {
    console.error("Error updating friend request:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Allow a sender to unsend (delete) a pending friend request
app.delete("/friend-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { sender } = req.query; // sender must match the request's sendingUserId

    const request = await Friend.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be unsent" });
    }

    if (sender && String(request.sendingUserId) !== String(sender)) {
      return res
        .status(403)
        .json({ message: "Not authorized to unsend this request" });
    }

    await Friend.deleteOne({ _id: requestId });
    return res.status(200).json({ message: "Friend request unsent" });
  } catch (err) {
    console.error("Error unsending friend request:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Message Part

// io.on("connection", (socket) => {
//   console.log("Socket Connected", socket.id);

//   // ✅ Join room for private signaling
//   socket.on("join", (userId) => {
//     socket.join(userId);
//     console.log(`User ${userId} joined their own room`);
//   });

//   // ✅ Signaling: Offer
//   socket.on("offer", ({ target, offer, sender }) => {
//     io.to(target).emit("offer", { offer, sender });
//   });

//   // ✅ Signaling: Answer
//   socket.on("answer", ({ target, answer }) => {
//     io.to(target).emit("answer", { answer });
//   });

//   // ✅ Signaling: ICE Candidates
//   socket.on("ice-candidate", ({ target, candidate }) => {
//     io.to(target).emit("ice-candidate", { candidate });
//   });

//   // ✅ Disconnect call handler
//   socket.on("disconnect-call", ({ to }) => {
//     io.to(to).emit("disconnect-call");
//   });

//   // ✅ (Optional) Disconnect log
//   socket.on("disconnect", () => {
//     console.log("User disconnected", socket.id);
//   });

//   // ✅ Chat message handler (leave it as is if working)
//   socket.on("send_message", async (data) => {
//     const { sender, receiver, message } = data;
//     try {
//       const newMessage = new Message({ sender, receiver, message });
//       await newMessage.save();

//       // Send to receiver only
//       io.to(receiver).emit("receive_message", data);
//     } catch (err) {
//       console.log("Error Server");
//       socket.emit("error_message", { error: "server error" });
//     }
//   });
// });

// app.get("/messages", async (req, res) => {
//   const { sender, receiver } = req.query;
//   try {
//     const message = await Message.find({
//       $or: [
//         { sender, receiver },
//         {
//           sender: receiver,
//           receiver: sender,
//         },
//       ],
//     }).sort({ createdAt: 1 });
//     res.json(message);
//   } catch (err) {
//     res.status(500).json({ error: "Server Error".err });
//   }
// });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); // Not commented out
});
