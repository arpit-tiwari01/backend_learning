// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:'/.env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.error("MONGO DB connection failed !!! :", err)
    throw err
})




























/*
import express from "express"
const app = express()

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log();
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port on ${process.env.PORT}`)
        })

        
    } catch (error) {
        console.error("ERROR:", error)
        throw err
    }
})()
*/