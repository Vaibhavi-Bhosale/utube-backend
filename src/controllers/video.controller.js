import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, userId, query, sortBy, sortType } = req.query;

    const filter = {};
    if (userId) {
        filter.owner = userId;
    }

    if (query) {
        filter.$or = [
            {
                title: { $regex: query, $options: "i" },
            },
            {
                description: { $regex: query, $options: "i" },
            },
        ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};

    const sortTypeValue = sortType || "desc";
    const sortByValue = sortBy || "createdAt";

    if (sortByValue) {
        sortOption[sortByValue] = sortTypeValue === "desc" ? -1 : 1;
    }

    const allVideos = await Video.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { allVideos: allVideos, totalVideos: allVideos.length },
                "Video Fetch Succcessfully"
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { title, description } = req.body;

    const videoFile = req.files?.videoFile?.[0];
    const thumbnail = req.files?.thumbnail?.[0];
    
    if (!title) {
        throw new ApiErrors(400, "title is required");
    }

    if (!videoFile) {
        throw new ApiErrors(400, "Video file is missing");
    }

    const videoUpload = await uploadOnCloudinary(videoFile.path);

    if (!videoUpload) {
        throw new ApiErrors(500, "Something wrong at uploading video");
    }

    let thumbnailUrl;
    let thumbnailUpload;
    if (thumbnail) {
        thumbnailUpload = await uploadOnCloudinary(thumbnail.path);
        if (!thumbnailUpload) {
            throw new ApiErrors(500, "Something wrong at uploading thumbnail");
        }
    } else {
        thumbnailUrl = cloudinary.url(videoUpload.public_id , {
            resource_type: "video",
            format: "jpg",
            width: 300,
            height: 200,
            crop: "fill",
        });

        if (!thumbnailUrl) {
            throw new ApiErrors(500, "Not able to create thumbnail");
        }
    }

    const newVideo = await Video.create({
        videoFile: videoUpload.secure_url,
        videoPublicId: videoUpload.public_id,
        thumbnail: thumbnailUpload ? thumbnailUpload?.secure_url : thumbnailUrl,
        thumbnailPublicId: thumbnailUpload?.public_id || null,

        duration: videoUpload.duration,
        title: title,
        description: description || null,
        owner: userId,
    });

    if (!newVideo) {
        throw new ApiErrors(500, "DB Failuler");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newVideo, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id; // logged-in user from auth middleware

    if (!videoId) {
        throw new ApiErrors(400, "No video id is found");
    }

    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) }
        },
        // lookup likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        // lookup owner (user info)
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" }, // convert owner array → object
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(userId), "$likes.likedBy"]
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                videoPublicId: 1,
                thumbnail: 1,
                thumbnailPublicId: 1,
                title: 1,
                description: 1,
                duration: 1,
                isPublish: 1,
                views: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                "owner.username": 1,
                "owner.avatar": 1,
                "owner._id" : 1
            }
        }
    ]);

    if (!video || video.length === 0) {
        throw new ApiErrors(404, "No video found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video Fetch Successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiErrors(400, "No Video id found");
    }

    const video = await Video.findById(videoId);

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiErrors(401, "User is not alllow to update video details");
    }

    const { title, description } = req.body;

    if (!title) {
        throw new ApiErrors(400, "title is required");
    }
    const thumbnail = req.file?.path;

    if (!thumbnail) {
        console.log("No thumnil want to update--testing purpose");
    }

    let uploadThumnail = undefined;
    if (thumbnail) {
        uploadThumnail = await uploadOnCloudinary(thumbnail);
        if (!uploadThumnail) {
            throw new ApiErrors(401, "unable to upload thumnail on cloudinary");
        }

        if (video.thumbnailPublicId) {
            const isThumbnailDeleted = await deleteFromCloudinary(
                video.thumbnailPublicId
            );

            if (!isThumbnailDeleted) {
                throw new ApiErrors(401, "not abal");
            }
        }
    }
    let updatedVideo

    if(uploadThumnail?.public_id)
    {

           updatedVideo = await Video.findByIdAndUpdate(
            {
                _id: videoId,
            },
            {
                title: title,
                description: description,
                thumbnail: uploadThumnail?.secure_url,
                thumbnailPublicId: uploadThumnail?.public_id,
            },
            { new: true }
        );
    }
    else{
         updatedVideo = await Video.findByIdAndUpdate(
            {
                _id: videoId,
            },
            {
                title: title,
                description: description,
              
            },
            { new: true }
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video Updated successfully"));
});

 
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiErrors(404, "No Video id found");
    }

    const video = await Video.findById(videoId);

    if (!video) {
    throw new ApiErrors(404, "Video not found");
    }


    if (video.owner.toString() !== userId.toString()) {
        throw new ApiErrors(403, "User is not alllow to update video details");
    }

    const isVideoDeleted = await deleteFromCloudinary(video.videoPublicId);

    if (!isVideoDeleted) {
        throw new ApiErrors(500, "Unabel to delete a Video");
    }
    if (video.thumbnailPublicId) {
        const isThumbnailDeleted = await  deleteFromCloudinary(video.thumbnailPublicId);
        if (!isThumbnailDeleted) {
            throw new ApiErrors(500, "Unabel to delete a thumnail");
        }
    }

    const videoDeletDB =  await Video.deleteOne({_id: videoId})

    if(!videoDeletDB)
    {
        throw new ApiErrors(500, "Unabel video data from DB")
    }

    return res
    .status(200)
    .json(
        200,
        {},
        "Video Deleted Successfull!"
    )
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiErrors(400, "No Video id found");
    }
    
    const video = await Video.findById(videoId);

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiErrors(401, "User is not alllow to toggle the status");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      {_id : videoId},
      {
        isPublish : !video.isPublish
      },
      {
        new: true
      }
    )

    return res
    .status(200)
    .json(
        200,
        updatedVideo,
        "Video publish status change successfully !!"
    )
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
