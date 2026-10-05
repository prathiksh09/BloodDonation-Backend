import express from "express";
import cors from "cors";

import { connectDb } from "./config/database.js";
import { redisConnect } from "./config/redis.js";

import donorRouter from "./router/donorRouter.js";
import userRouter from "./router/userRouter.js";
import registerRouter from "./router/registerRouter.js";
import serviceRouter from "./router/serviceRouter.js";
import feedbackRouter from "./router/feedbackRoute.js";
import adminRouter from "./router/adminRouter.js";
import highlightRouter from "./router/highlightRouter.js";
import contactRouter from "./router/contactRouter.js";

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "token", "Authorization"],
  }),
);

// ==========================================
// JSON
// ==========================================

app.use(express.json());

// ==========================================
// UPLOADS
// ==========================================

app.use("/uploads", express.static("uploads"));

// ==========================================
// DATABASE + REDIS
// ==========================================

connectDb();
redisConnect();

// ==========================================
// API ROUTES
// ==========================================

app.use("/api", donorRouter);

app.use("/api", userRouter);

app.use("/api", registerRouter);

app.use("/api", serviceRouter);

app.use("/api", feedbackRouter);

app.use("/api", adminRouter);

app.use("/api/contact", contactRouter);

// ==========================================
// HIGHLIGHT ROUTES
// ==========================================

app.use("/api/highlights", highlightRouter);

// ==========================================
// HOME / HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Blood donation backend is running",
  });
});

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
