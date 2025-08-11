import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    // TODO: toggle subscription

    const isSubscribed = await Subscription.exists({
        subscriber : userId,
        channel : channelId
    })

    if(isSubscribed)
    {
        const unsubscribe = await Subscription.deleteOne({
             subscriber : userId,
             channel : channelId
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


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscriber = await Subscription.find({
        channel : channelId
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
    }).populate("subscriber", "username fullname avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribed, "successfully fetch the channel subscriber")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}