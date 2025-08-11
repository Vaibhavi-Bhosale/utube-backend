import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
 
    const Videos = await Video.find({_id: req.user._id}, "views _id")
    const totalVideos = Videos.length;
    const totalViews = Videos.reduce((sum, v)=> sum + (v.views || 0), 0 )
    
    const videosId = Videos.map(v => (v._id));

    const totalLikes =  await Like.countDocuments(
        {
            video : { $in: {videosId}}
        }
    )

    const totalSubscriber = await Subscription.countDocuments({
        channel : req.user._id
    })
    

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalLikes,
                totalSubscriber
            },
            "Channel states fetch successfully"
        )
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const channelVideos = await Video.find({owner:req.user._id})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelVideos,
            "channel Videos fectch sussessfully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }