import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Define the aggregation pipeline
  const pipeline = [
    {
      $match: {
        video: mongoose.Types.ObjectId(videoId), // Filter comments by video ID
      },
    },
    {
      $sort: {
        createdAt: -1, // Sort by creation date, newest first
      },
    },
  ];

  // Define pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  try {
    // Execute aggregate pagination
    const result = await Comment.aggregatePaginate(
      Comment.aggregate(pipeline),
      options
    );

    // Send response with paginated comments
    res.status(200).json(
      new ApiResponse(
        200,
        {
          comments: result.docs, // Array of comments for the current page
          totalPages: result.totalPages, // Total number of pages
          currentPage: result.page, // Current page number
        },
        "Comments fetched successfully"
      )
    );
  } catch (error) {
    // Handle any errors that occur during execution
    throw new ApiError(500, "Failed to fetch comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content, userID } = req.body;

  if (!content || !userID) {
    throw new ApiError(400, "Content and user ID are required");
  }

  try {
    const newComment = await Comment.create({
      content,
      video: videoId,
      owner: userID,
      createdAt: new Data(),
    });

    res
      .status(200)
      .json(new ApiResponse(200, newComment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to add comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required to update the comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content: content },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  res
    .status(201)
    .json(new ApiResponse(201, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  //find comment
  const { commentId } = req.params;

  try {
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    // If no comment was found with the provided ID, return a 404 error
    if (!deletedComment) {
      throw new ApiError(404, "Comment not found");
    }
  } catch (error) {
    throw new ApiError(500, "Failed to delete comment");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
