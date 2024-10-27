import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Initialize express
const app = express();

// Middleware setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16Kb",
  })
);
app.use(cookieParser());

// Routes import
import userRouter from "./routes/user.routes.js";

// Route declaration
app.use("/api/v1/users", userRouter);  

export { app };
