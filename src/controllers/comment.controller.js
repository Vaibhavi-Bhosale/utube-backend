import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const allComment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                isLiked: {
                    $in: [
                        new mongoose.Types.ObjectId(req.user._id),
                        "$likes.likedBy",
                    ],
                },
            },
        },

        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner.username": 1,
                "owner.avatar": 1,
                "owner._id":1,
                likeCount: 1,
                isLiked : 1
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $skip: skip,
        },
        {
            $limit: Number(limit),
        },
    ]);

    const totalCount = await Comment.countDocuments({
        videoId: new mongoose.Types.ObjectId(videoId),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { allComment, totalCount },
                "Comments fetched successfully"
            )
        );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content) {
        throw new ApiErrors(400, "No comment is there");
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfullys"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiErrors(400, "No comment is there");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        { _id: commentId },
        {
            content: content,
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params;

    const isCommentDelete = await Comment.deleteOne({
        _id: commentId,
        owner: req.user._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                isCommentDelete,
                "Comment deleted successfully"
            )
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
