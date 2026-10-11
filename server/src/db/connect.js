import mongoose from "mongoose";
import { config } from "../config.js";

/*
  MongoDB connection lifecycle.

  Mongoose buffers operations issued before the connection is ready, so
  routes can be registered immediately; index.js still awaits connect()
  at startup so a bad URI fails loudly instead of hanging requests.
*/

mongoose.set("strictQuery", true);

export async function connectDb() {
  mongoose.connection.on("connected", () => console.log(`MongoDB connected: ${config.mongoDbName}`));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));

  await mongoose.connect(config.mongoUri, {
    dbName: config.mongoDbName,
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.connection.close();
}

export { mongoose };
