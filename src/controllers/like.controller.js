import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
            video: videoId,
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
    //TODO: get all liked videos

    const likeVideos = await Like.find({
        likedBy: req.user._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, likeVideos, "Like videos fetch Successfull")
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
