import mongoose ,{Mongoose, Schema, model} from "mongoose";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username : {
            type : String,
            unique : true,
            lowercase : true,
            required : true,
            trim:true,
            index:true
        },
        email : {
            type : String,
            unique : true,
            lowercase : true,
            required : true,
            trim:true,
             
        },
        fullname : {
            type : String,
            required : true,
            trim:true,
            index:true
        },
        avatar : {
            type : String, //cloudinary url
            required : true

        },
        coverImage : {
            type : String, //cloudinary url
        },
        watchHistory :[
            {
                type : Schema.Types.ObjectId,
                ref : "ref"
            }
        ],
        password : {
            type : String,
            required :[true, "Password is reqiuired"]
        },
        refreshToken : {
            type : String
        }
    },
    {
        timestamps :true
    }
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password"))   return next();

    this.password =await bcrypt.hash(this.password, 10)

    next()    
})

userSchema.methods.isPasswordCorrect = async function(password){
     return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
      {
        _id : this.id,
        emial : this.email,
        username : this.username,
        fullname : this.fullname
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn : process.env.ACCESS_TOKEN_EXPIRY
      })
}
userSchema.methods.generateRefreshToken = async function(){
      return jwt.sign(
      {
        _id : this.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn : process.env.REFRESH_TOKEN_EXPIRY
      })
}

export const User = model("User", userSchema)