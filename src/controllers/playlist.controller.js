import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiErrors} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const owner = req.user._id
    //TODO: create playlist

    if(!name)
    {
        throw new ApiErrors(400, "Playlist name is required")
    } 
    
   const playlist =  await Playlist.create({
        name : name,
        description : description || null,
        owner : owner
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist created"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    const userPlayList = await Playlist.find({
        owner : userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlayList, "User playlist fetch successfully")
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    const playlist = await Playlist.aggregate([
        {
            $match :  {
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup : {
                from: "playlists",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                  {
                    $project : {
                         thumbnail : 1,
                         duration : 1,
                         title : 1
                    }
                }
                ]
            },
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetch successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id  },
        { $push: { videos: videoId } },
        { new: true } // return updated document
    );

    if (!updatedPlaylist) {
        throw new ApiErrors(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
        );
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    const result = await Playlist.findByIdAndUpdate(
        {
            _id :  playlistId,
             owner: req.user._id 
        },
        {
            $pull : { videos : videoId}
        },
        {new:true}
    )

    if (!result) {
        throw new ApiErrors(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, result, "Video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    const isDelete = await Playlist.deleteOne(
        {
            _id : playlistId,
            owner : req.user._id
        }
    )

    if(!isDelete)
    {
        throw new ApiErrors("401", "Playlist Not deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse("200", "Playlist deleted Successfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!name)
    {
        throw new ApiErrors(400, "No name found")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        {
            _id : playlistId,
            owner : req.user._id
        },
        {
            name : name,
            description : description || null
        },
        {
            new:true
        }
    )

    if(!updatedPlaylist)
    {
        throw new ApiErrors(500, "There is issue while updating playlistt")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated succcessfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}