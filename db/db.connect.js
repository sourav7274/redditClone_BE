require('dotenv').config()

const mongoose = require('mongoose')

const mongoURI = process.env.MONGODB

mongoose
    .connect(mongoURI)
    .then(() =>{
        console.log('Connected to DB')
    })
    .catch((err) =>{
        console.log('Error connecting to DB',err)
    })