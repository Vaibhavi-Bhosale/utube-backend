import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiErrors} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    // TODO: toggle subscription

    const isSubscribed = await Subscription.exists({
         subscriber: new mongoose.Types.ObjectId(userId),
         channel: new mongoose.Types.ObjectId(channelId)
    })

    if(isSubscribed)
    {
        const unsubscribe = await Subscription.deleteOne({
              subscriber: new mongoose.Types.ObjectId(userId),
              channel: new mongoose.Types.ObjectId(channelId)
        })

        if(!unsubscribe)
        {
            throw new ApiErrors(200, "Not able to unsubscribe")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, true, "Unsubscribed successfully" )
        )
        
    }
    else{
         const subscribe = await Subscription.create({
            subscriber : userId,
             channel : channelId
         })

          if(!subscribe)
        {
            throw new ApiErrors(200, "Not able to subscribe")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, true, "Subscribed successfully" )
        )
    }

})


const isSubscribed = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    
    const isSubscribed = await Subscription.exists({
         subscriber: new mongoose.Types.ObjectId(userId),
         channel: new mongoose.Types.ObjectId(channelId)
    })

    if(isSubscribed)
    {

        return res
            .status(200)
            .json(
                new ApiResponse(200, true, "Subscribe" )
            )
    }
    else{
         return res
            .status(200)
            .json(
                new ApiResponse(200, false, "No Subscribe" )
            )
    }
        

})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscriber = await Subscription.find({
        channel : new mongoose.Types.ObjectId(channelId)
    }).populate("subscriber", "username fullname avatar")
 
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscriber, "successfully fetch the channel subscriber")
        
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscribed = await Subscription.find({
         subscriber : subscriberId
    }).populate("channel", "username fullname avatar")


    
    const subs = await Subscription.find();
    console.log(subs)
   
   
   
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribed, "successfully fetch the subscirbed channel")
    )
 

})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isSubscribed
}