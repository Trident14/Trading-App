import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// Export the app
export default app;
