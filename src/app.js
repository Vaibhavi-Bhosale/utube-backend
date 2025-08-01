import express, { urlencoded } from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    Credential : true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"));
app.use(cookieParser())


//routes

import userRouter from "./routes/user.routes.js"

//route declaration

app.use("/api/v1/users",userRouter)


export default app;