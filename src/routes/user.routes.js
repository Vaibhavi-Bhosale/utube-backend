import { Router } from "express";
import {loginUser, logoutUser, refreshAccessToken, registerUser, changeCurrentPasssword, updateAccountDetail, getCurrentUser, updateUserCoverImage, updateUserAvatar} from "../controllers/user.controller.js"
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)

    router.route("/login").post(loginUser)

    //Secured Routes

    router.route("/logout").post(verifyJWT, logoutUser)

    router.route("/refresh-token").post(refreshAccessToken)

    router.route("/change-current-password").post(
        verifyJWT,changeCurrentPasssword)
        router.route("/update-account-details").post(verifyJWT,updateAccountDetail)

    router.route("/get-current-user").get(verifyJWT, getCurrentUser)

    router.route("/update-user-coverImage").
    post(verifyJWT,
          upload.single("coverImage"),
          updateUserCoverImage)

    router.route("/update-user-avatar").
    post(verifyJWT,
          upload.single("avatar"),
          updateUserAvatar)

export default router