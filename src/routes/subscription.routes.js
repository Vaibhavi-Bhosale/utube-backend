import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    isSubscribed
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/c/:channelId")
//     .get(getSubscribedChannels)
//     .post(toggleSubscription);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);

router
	.route("/c/:channelId")
	.get(getUserChannelSubscribers)
	.post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

router.route("/s/:channelId").get(isSubscribed);



export default router 