import jwt from "jsonwebtoken";
import { ApiErrors } from "../utils/apiErrors.js";
import { asynHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asynHandler(async (req, res, next)=>{

     try {
         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
   
         if(!token)
         {
           throw new ApiErrors(401, "Unathorized Request")
         }
   
         const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
   
         const user = await User.findById(decodedToken._id).select(
           "-password -refreshToken"
         )
   
         if(!user)
         {
           throw new ApiErrors(401, "Invalid Access Token")
         }
   
         req.user = user;;;
   
         next()
     } catch (error) {
        throw new ApiErrors(401, error?.message ||  "Invalid access Token")
     }

})