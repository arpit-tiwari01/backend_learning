
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
    .catch((err)=> next(err));
};



/*
// Async handler to catch errors in async functions
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res
      .status(err.code || 500)
      .json({
        success: false,
        message: err.message || "An unknown error occurred!" });
  }
};
*/

export { asyncHandler };
