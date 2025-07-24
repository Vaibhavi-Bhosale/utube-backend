import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiErrors} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponce.js";
import jsonwebtoken from "jsonwebtoken";
import jwt from "jsonwebtoken"
import req from "express/lib/request.js";

const generateAccessTokenAndRefreshToken =async (userId)=>{
     try{
          const user =await User.findById(userId);
          const accessToken = user.generateAccessToken()
          const refreshToken = user.generateRefreshToken()

          user.refreshToken = refreshToken;
          user.save({validateBeforeSave : false})

          return {accessToken, refreshToken};
     }
     catch(err)
     {
        throw new ApiErrors(500, "Something went wrong while generating access and refreshing tokens");
     }
}

const registerUser = asyncHandler(async (req, res) => {
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


const loginUser = asyncHandler(async (req, res)=>{
     //1. check if access token is there
     //2. if not then get it again using refresh token
     //3. if refreshToken is expire then take login creditials 
     //4. search if the useer is present in databas
     //5. check password is match
     //6. if password match then send both tokens and login successfully


     console.log("\n\n ", req.body ,"\n\n")

     const {email, username, password} = req.body

     if(!(email || username))
     {
        throw new ApiErrors(400, "Username or Email is required")
     }

     const user =await User.findOne({

        $or : [{username}, {email}] 
     })

     if(!user)
     {
        throw new ApiErrors(400, "Usser doesnot exits")
     }

    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid)
     {
        throw new ApiErrors(401, "Invalid user credintials")
     }

     const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

     const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User Login Successfully !"
        )
        )

})

const logoutUser = asyncHandler(async (req, res)=>{
   const userId =  req.user._id;

   await User.findByIdAndUpdate(userId,
    {
        $set :{ refreshToken : undefined }
    },
    {
        new:true
    }
   )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(
            200,
            {},
            "Logout !"
        ))
})

const refreshAccessToken = asyncHandler(async (req, res)=>{

     const incommingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken

     if(!incommingRefreshToken)
     {
        throw new ApiErrors(401, "Unathorized Token")
     }

    try {
        const decodedToken =  jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user)
        {
            throw new ApiErrors(401, "No user found with this refresh token")
        }
    
        if(incommingRefreshToken !== user?.refreshToken)
        {
           throw new ApiErrors(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
      const {accessToken,newRefreshToken=refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("refreshToken",newRefreshToken,options)
        .cookie("accessToken",accessToken,options)
        .json(
            new ApiResponce(200,
                {
                   newRefreshToken,
                   accessToken
                },
                "Access Token refresh successfully"
            )
        )
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid refresh Token")
    }
})

const changeCurrentPasssword = asyncHandler(async(req, res)=>
{
   //1. Take Email/username
   //2. check email/username is exsting
   //3. take old password
   //4. varify old password is correct
   //5. take new password
   //6. store it with encoding it in database
   //7. logout from all device by deleting refresh and access token

   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user._id);

   const isPasswordCorrect =await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect)
   {
      throw new ApiErrors(400, "Password is incorrect")
   }

   user.password = newPassword;
   await user.save({validation : false});

   return res
   .status(200)
   .json(
    new ApiResponse(
     "200",
     {},
     "Password change Successfully "
    ))
})

const updateAccountDetail = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body

    if(!(fullname || email))
    {
        throw new ApiErrors(401, "fullname and email both are required ");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email
            }
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        ApiResponse(
            200,
            user,
            "Account detail updatad successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    //1. check user is login
    //2. take a image from user
    //3. save at local using mmulter
    //4. upload it at clodinary
    //5. delate old image
    //6. update the image link from the database
    
    const avatarLocalPath = req.file?.path;

    if(avatarLocalPath)
    {
        throw new ApiErrors(400, "Avtar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(avatar)
    {
        throw new ApiErrors(400, "Error while Uploading on Avatar")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPasssword,updateAccountDetail, getCurrentUser };
