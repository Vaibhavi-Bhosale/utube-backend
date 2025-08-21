import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    const isLike = await Like.exists({
        video: videoId,
        likedBy: req.user._id,
    });

    if (isLike) {
        await Like.deleteOne({
            video: videoId,
            likedBy: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Remove Like Successfully"));
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Like Successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment

    const isLike = await Like.exists({
        comment: commentId,
        likedBy: req.user._id,
    });

    if (isLike) { 
        await Like.deleteOne({
            comment: commentId,
            likedBy: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Remove Like Successfully"));
    } else {
        await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Like Successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet

    const isLike = await Like.exists({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    if (isLike) {
        await Like.deleteOne({
            tweet: tweetId,
            likedBy: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Remove Like Successfully"));
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Like Successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        { $unwind: "$videoDetails" },
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                _id: 0,
                videoId: "$videoDetails._id",
                title: "$videoDetails.title",
                thumbnail: "$videoDetails.thumbnail",
                ownerId: "$ownerDetails._id",
                ownerAvatar: "$ownerDetails.avatar"
            }
        }
    ]);

     if (!likedVideos || likedVideos.length === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, [], "No liked videos found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});


export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
