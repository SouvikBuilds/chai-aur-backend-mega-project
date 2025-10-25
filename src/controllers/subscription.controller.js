import mongoose, { isValidObjectId } from "mongoose";
import { user as User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!req.user) {
      throw new ApiErrors(401, "Unauthorized");
    }
    if (!isValidObjectId(channelId)) {
      throw new ApiErrors(400, "Invalid Channel Id");
    }
    if (req.user._id.toString() === channelId) {
      throw new ApiErrors(400, "You cannot subscribe to your own channel");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
      throw new ApiErrors(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (existingSubscription) {
      await Subscription.findByIdAndDelete(existingSubscription._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Channel Unsubscribed"));
    } else {
      const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, newSubscription, "Channel Subscribed"));
    }
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { subscriberId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(subscriberId)) {
      throw new ApiErrors(400, "Invalid Subscriber Id");
    }
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
      throw new ApiErrors(404, "Subscriber not found");
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const subscribedChannels = await Subscription.find({
      subscriber: subscriberId,
    })
      .skip(skip)
      .limit(limitNum)
      .populate("channel", "username fullName avatar");
    const totalSubscriptions = await Subscription.countDocuments({
      subscriber: subscriberId,
    });
    const totalPages = Math.ceil(totalSubscriptions / limitNum);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          channels: subscribedChannels.map((sub) => sub.channel),
          totalSubscriptions,
          totalPages,
          currentPage: pageNum,
        },
        "All Subscribed Channels Fetched Successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(channelId)) {
      throw new ApiErrors(400, "Invalid Channel Id");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
      throw new ApiErrors(404, "Channel not found");
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const subscribers = await Subscription.find({ channel: channelId })
      .skip(skip)
      .limit(limitNum)
      .populate("subscriber", "username fullName avatar");
    const totalSubscribers = await Subscription.countDocuments({
      channel: channelId,
    });
    const totalPages = Math.ceil(totalSubscribers / limitNum);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscribers: subscribers.map((sub) => sub.subscriber),
          totalSubscribers,
          totalPages,
          currentPage: pageNum,
        },
        "All Subscribers Fetched Successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});
export { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers };
