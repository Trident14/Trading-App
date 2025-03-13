import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import mockRouter from "./routes/mockRoutes.js";
import authRouter from "./routes/authRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import tradeRouter from "./routes/tradeRoutes.js";
import updateRouter from "./routes/updateRoute.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Fix Route Prefixes
app.use("/mock", mockRouter);
app.use("/auth", authRouter);
app.use("/events", eventRouter);
app.use("/trade", tradeRouter);
app.use("/update", updateRouter);

app.get("/", (req, res) => {
    console.log("✅ GET / request received");
    res.json({ message: "API is running..." });
});

export default app;
