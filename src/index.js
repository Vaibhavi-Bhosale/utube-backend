// require('dotenv').config({path : "./env"})

import dotenv from 'dotenv';
import connectDB from './db/index.js';
 
import app from './app.js';

dotenv.config()
 
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{

        console.log("Server is running at PORT : ", process.env.PORT)
    });
})
.catch((err)=>{
    console.log("MongoDB connection fail !!! Error : ", err)
})