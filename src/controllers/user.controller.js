import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponce.js";
import jsonwebtoken from "jsonwebtoken";
import jwt from "jsonwebtoken";
import req from "express/lib/request.js";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        throw new ApiErrors(
            500,
            "Something went wrong while generating access and refreshing tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // take data from frontend
    // validate data -notnull
    // check if user already exit
    // check for images - check for avtar
    // store avtar in cludinary
    // check it goes on cloudinary or not
    // create user object
    // store in database
    // send massege to user if register
    // remove password and send user object

    const { fullname, username, email, password } = req.body;

    if (
        [fullname, username, email, password].some(
            (feild) => !feild || feild.trim() === ""
        )
    ) {
        throw new ApiErrors(400, "All feilds are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiErrors(409, "User with email or username already exits");
    }

    const avatarLocalPath = await req.files?.avatar[0]?.path;
    console.log("running till here.....");
    const coverImageLocalPath = req.files?.coverImage
        ? await req.files?.coverImage[0]?.path
        : "";

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    let coverImage = null;
    if (coverImageLocalPath !== "") {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        throw new ApiErrors(400, "Avatar file is not save in cloudinary");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
        coverImage: coverImage?.url || "",
        coverImagePublicId: coverImage?.public_id || "",
        email,
        password,
        username: username,
    });

    const createsUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createsUser) {
        throw new ApiErrors(
            500,
            "Something went wrong while registiring the user"
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createsUser, "User register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    //1. check if access token is there
    //2. if not then get it again using refresh token
    //3. if refreshToken is expire then take login creditials
    //4. search if the useer is present in databas
    //5. check password is match
    //6. if password match then send both tokens and login successfully

    console.log("\n\n ", req.body, "\n\n");

    const { email, username, password } = req.body;

    if (!(email || username)) {
        throw new ApiErrors(400, "Username or Email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiErrors(400, "Usser doesnot exits");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiErrors(401, "Invalid user credintials");
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User Login Successfully !"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
        userId,
        {
            $unset: { refreshToken: 1 },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logout !"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiErrors(401, "Unathorized Token");
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiErrors(401, "No user found with this refresh token");
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiErrors(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessTokenAndRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        return res
            .status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        newRefreshToken,
                        accessToken,
                    },
                    "Access Token refresh successfully"
                )
            );
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid refresh Token");
    }
});

const changeCurrentPasssword = asyncHandler(async (req, res) => {
    //1. Take Email/username
    //2. check email/username is exsting
    //3. take old password
    //4. varify old password is correct
    //5. take new password
    //6. store it with encoding it in database
    //7. logout from all device by deleting refresh and access token

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiErrors(400, "Password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validation: false });

    return res
        .status(200)
        .json(new ApiResponse("200", {}, "Password change Successfully "));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!(fullname || email)) {
        throw new ApiErrors(401, "fullname and email both are required ");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname,
            email,
        },
    }).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account detail updatad successfully")
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiErrors(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) {
        throw new ApiErrors(400, "Error while Uploading on Cover Image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        { new: true }
    ).select("-password");

    const deleteResult = deleteFromCloudinary(user?.coverImagePublicId);

    if (!deleteResult) {
        throw new ApiErrors(
            401,
            "Error while Deleting old image from the cludinary"
        );
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImagePublicId: coverImage.public_id,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar image file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiErrors(400, "Error while Uploading on Avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true }
    ).select("-password");

    const deleteResult = deleteFromCloudinary(user?.avatarPublicId);

    if (!deleteResult) {
        throw new ApiErrors(
            401,
            "Error while Deleting old image from the cludinary"
        );
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatarPublicId: avatar.public_id,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const id = req.params.userId; // coming from URL
    const userId = new mongoose.Types.ObjectId(req.user?._id); // current logged-in user

    if (!id?.trim()) {
        throw new ApiErrors(400, "User ID is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscriber" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribe: {
                    $cond: {
                        if: { $in: [userId, "$subscriber.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                email: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribe: 1,
                avatar: 1,
                coverImage: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiErrors(404, "No Channel Exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        );
});


const getWacthHistory = asyncHandler(async (req, res) => {
    //to easy for me

    //  const userId = req.params.user._id;

     

    const user= await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",

                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields:{
                            owner: {
                                $first : "$owner"
                            }
                        }
                    }
                ],
            },
        },
    ]);

    return res
    .status(200)
    .json(
           
         new ApiResponse(200, user[0]?.watchHistory, "Wacth History Fetch Succefuly")
    )
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPasssword,
    updateAccountDetail,
    getCurrentUser,
    updateUserCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWacthHistory,
};
