import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Validate channel ID
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  try {
    // Find existing subscription
    const existingSubscription = await Subscription.findOne({
      channel: channelId,
    });

    if (existingSubscription) {
      // Unsubscribe
      await existingSubscription.deleteOne();
      res.status(200).json(new ApiResponse(200, "Unsubscribed successfully"));
    } else {
      // Subscribe
      const newSubscription = await Subscription.create({ channel: channelId });
      res
        .status(201)
        .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
    }
  } catch (error) {
    console.error("Error toggling subscription:", error); // Log error for debugging
    throw new ApiError(500, "Internal server error");
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Validate channel ID
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  try {
    const subscribers = await Subscription.find({
      channel: channelId,
    }).populate("subscriber");
    res
      .status(200)
      .json(
        new ApiResponse(200, subscribers, "Subscribers retrieved successfully")
      );
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    throw new ApiError(500, "Internal server error");
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  // Validate subscriber ID
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  try {
    const subscribedChannels = await Subscription.find({
      subscriber: subscriberId,
    }).populate("channel");
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          "Subscribed channels retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching subscribed channels:", error);
    throw new ApiError(500, "Internal server error");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
