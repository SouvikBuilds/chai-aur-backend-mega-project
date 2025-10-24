import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { user as User } from "../models/user.model.js";

import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      console.log("Content is required");
      throw new ApiErrors(400, "Content is required");
    }

    if (content.trim().length > 400) {
      console.log("Content cannot exceed 400 characters");
      throw new ApiErrors(400, "Content cannot exceed 400 characters");
    }

    const newTweet = await Tweet.create({
      content: content.trim(), // ✅ Trim before saving
      owner: req.user?._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
  } catch (error) {
    console.log("Error: ", error?.message);
    throw new ApiErrors(500, error?.message);
  }
});

const updateTweet = asyncHandler(async (req, res, next) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiErrors(400, "Invalid tweet id");
  }

  if (!content || content.trim() === "") {
    throw new ApiErrors(400, "Content is required");
  }

  if (content.trim().length > 400) {
    throw new ApiErrors(400, "Content cannot exceed 400 characters");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiErrors(403, "You are not allowed to update this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content.trim(), // ✅ Use trimmed content
      },
    },
    { new: true }
  ).populate("owner", "username fullName avatar"); // ✅ Optional: populate owner

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully")); // ✅ Fixed
});

const deleteTweet = asyncHandler(async (req, res, next) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiErrors(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiErrors(403, "You are not allowed to delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully")); // ✅ Fixed
});

const getAllTweets = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const filter = {};

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiErrors(400, "Invalid user id");
    }
    filter.owner = userId;
  }

  if (query) {
    filter.content = { $regex: query, $options: "i" }; // ✅ Simplified
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const skip = (page - 1) * limit;

  const tweets = await Tweet.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("owner", "username fullName avatar");

  const totalTweets = await Tweet.countDocuments(filter);
  const totalPages = Math.ceil(totalTweets / limit);
  const currentPage = parseInt(page);

  return res.status(200).json(
    new ApiResponse( // ✅ Use ApiResponse for consistency
      200,
      { tweets, totalTweets, totalPages, currentPage },
      "Tweets fetched successfully"
    )
  );
});

export { createTweet, updateTweet, deleteTweet, getAllTweets };
