import mongoose from "mongoose";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          status: "OK",
          database: dbStatus,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        "Server is healthy"
      )
    );
  } catch (error) {
    return res
      .status(503)
      .json(new ApiResponse(503, { status: "ERROR" }, "Server is unhealthy"));
  }
});

export { healthcheck };
