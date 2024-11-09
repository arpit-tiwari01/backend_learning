import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//Helper function to toggle like
const toggleLike = async (userId, targetId, targetField) => {
  const query = { [targetField]: targetId, likedBy: userId };
  const existingLike = await Like.findOne(query);
  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return { liked: false };
  } else {
    await Like.create({ [targetField]: targetId, likedBy: userId });
    return { liked: true };
  }
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { user } = req.user;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const result = await toggleLike(user, videoId, "video");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.liked ? "Liked video" : "Unliked video",
        "Like toggled successfully"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { user } = req.user_id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const result = await toggleLike(user, commentId, "comment");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.liked ? "Liked comment" : "Unliked comment",
        "Like toggled successfully"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { user } = req.user_id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const result = await toggleLike(user, tweetId, "tweet");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.liked ? "Liked tweet" : "Unliked tweet",
        "Tweet toggled successfully"
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const likedVideo = await Like.find({
    likedBy: user,
    video: {
      $exists: true,
    },
  })
    .populate("video")
    .exec();

  res
    .status(200)
    .json(new ApiResponse(200, likedVideo, "Liked videos retrieved"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
