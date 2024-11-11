import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const validObjectId = (id, entity) => {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${entity} ID`);
  }
};

//create Tweet
const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user;
  const content = req.body.content;

  if (!content) throw new ApiError(400, "Tweet content is required");
  validObjectId(userId, "User");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const tweet = await Tweet.create({ content, owner: userId });
  if (!tweet) throw new ApiError(400, "Tweet not created");

  res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

//get user tweet
const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user;
  validObjectId(userId, "User");

  const userTweets = await Tweet.find({ owner: userId });
  res
    .status(200)
    .json(
      new ApiResponse(200, userTweets, "Retrieved all tweets successfully")
    );
});

//updated tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  validObjectId(tweetId, "Tweet");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true }
  );

  if (!updatedTweet) throw new ApiError(404, "Tweet not found");

  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

//deleted tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;

  validObjectId(tweetId, "Tweet");

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) throw new ApiError(404, "Tweet not found");

  res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
