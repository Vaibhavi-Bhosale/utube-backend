import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiErrors} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
   
    const {content} = req.body;
    const userId = req.user._id;

    if(!content || !content.trim())
    {
        throw new ApiErrors(400, "No content found")
    }

   const tweet =  await Tweet.create({
        content : content,
        owner : userId
    }) 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet created successfully"
        )
    )

})
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const allTweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1,
                "ownerDetails.fullname": 1,
                likeCount: 1,
                isLiked: 1
            }
        }
    ]);

    if (allTweet.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No tweets found for this user")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, allTweet, "All tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const {tweetId} = req.params;

    const {content} = req.body

    if(!content)
    {
         throw new ApiErrors(404, "Tweet must not empty");
    }

    console.log("BODY RECEIVED:", req.body);


    const updatedTweet = await Tweet.findOneAndUpdate(
        {  _id: tweetId, owner: userId },
        { content: content },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiErrors(404, "Tweet not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "Tweet updated successfully"
            )
        );
})

const deleteTweet = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const {tweetId} = req.params
 
    const  result = await Tweet.deleteOne( 
        {
            _id:tweetId ,
             owner : userId
        }
     )

    if(result.deletedCount === 0)
    {
        throw new ApiErrors(401, "Unable to delete the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted !"
        )
    )
})

const getTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params
    const tweet = await Tweet.aggregate([
        {
            $match : {_id :  new mongoose.Types.ObjectId(tweetId)}
        },
        {
            $lookup : {
               from:"users",
               localField : "owner",
               foreignField : "_id",
               as : "ownerDetails"
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
            $addFields : {
                username : "$ownerDetails.username",
                avatar : "$ownerDetails.avatar",
                fullname : "$ownerDetails.fullname"
            }
        },
        {
            $project : {
                content : 1,
                username : 1,
                avatar : 1,
                fullname :1,
                 
            }
        }

   ] )

    if(tweet.length ===0)
    {
        throw new ApiErrors(404, "No Tweet Found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {tweet : tweet[0]}, "Tweet Fetch Successfully")
    )
})

const getAllTweet = asyncHandler(async(req, res)=>{
    const allTweet = await Tweet.aggregate([
        {
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails"
            }
        },
         {
            $unwind: "$ownerDetails"
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "likes"
            }
        },
        {
            $addFields : {
                username : "$ownerDetails.username",
                avatar : "$ownerDetails.avatar",
                likeCount : {$size : "$likes"},
                isLiked : {$in : [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]}
            }
        },
        {
            $project : {
                content : 1,
                avatar :1,
                username : 1,
                likeCount : 1,
                isLiked : 1,
                owner : 1
            }
        }

    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allTweet,
             allTweet.length ? "All tweets fetched successfully" : "No tweets found"
        )
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    getTweet,
    deleteTweet,
    getAllTweet
}