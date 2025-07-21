import { asynHandler } from "../utils/asyncHandler.js";
import {ApiErrors} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponce.js";


const registerUser = asynHandler(async (req, res) => {
    // take data from frontend
    // validate data -notnull
    // check if user already exit
    // check for images - check for avtar
    // store avtar in cludinary
    // check it goes on cloudinary or not
    // create user object
    // store in database
    // send massege to user if register
    // remove password and send user object

    const {fullname, username, email, password} = req.body
    
    if([fullname, username, email, password ].some((feild)=>
       !feild || feild.trim() === "")
    
    ){
        throw new ApiErrors(400, "All feilds are required")
    }

    const existedUser =await  User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser)
    {
        throw new ApiErrors(409 ,"User with email or username already exits")
    }
     

    const avatarLocalPath =await req.files?.avatar[0]?.path
    console.log("running till here.....")
    const coverImageLocalPath = req.files?.coverImage  ?  await  req.files?.coverImage[0]?.path :  "";



    
    if(!avatarLocalPath)
        {
            throw new ApiErrors(400, "Avatar file is required");
        }
        
        const avatar = await uploadOnCloudinary(avatarLocalPath)
       
    const coverImage = null;
    if(coverImageLocalPath !== "")
    {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    if(!avatar)
    {
         throw new ApiErrors(400, "Avatar file is not save in cloudinary");
    }


   const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username 
    })

    const createsUser =  await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createsUser)
    {
        throw new ApiErrors(500, "Something went wrong while registiring the user")
    }
 
    return res.status(201).json( 
        new ApiResponse (200, createsUser, "User register successfully")
    )

});

export { registerUser };
