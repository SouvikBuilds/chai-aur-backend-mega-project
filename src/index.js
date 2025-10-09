import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";

// 2nd approach - practical approach
import { connectDB } from "./db/index.js";
import app from "./app.js";
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `🚀🚀🚀 App is running on: http://localhost:${process.env.PORT || 8000}`
      );
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed", error);
    throw error;
  });
// 1st approach for db connection
// const app = express();
// {
//   ("");
// }
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("Error: ", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`App is running on: http://localhost:${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("Error connecting to the database", error);
//     throw error;
//   }
// })();
