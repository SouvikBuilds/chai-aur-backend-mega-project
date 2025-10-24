import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getAllTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getAllTweets).post(createTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
