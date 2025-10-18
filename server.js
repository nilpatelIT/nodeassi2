require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const { RedisStore } = require("connect-redis");
const Redis = require("ioredis");

const app = express();

// Ensure upload directories exist
const ensureDir = (p) => {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
};
const uploadsBase = path.join(__dirname, "public", "uploads");
ensureDir(path.join(uploadsBase, "profile"));
ensureDir(path.join(uploadsBase, "others"));

// View engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
const registerRouter = require("./src/routes/register");
app.use("/", registerRouter);

// File-session auth router
const fileSessionRouterFactory = require("./src/routes/auth-file");
const fileSessionRouter = fileSessionRouterFactory(
  session,
  new FileStore({ path: path.join(__dirname, ".sessions") })
);
app.use("/file", fileSessionRouter);

// Redis-session auth router (only initialize if REDIS_URL provided)
const redisUrl = process.env.REDIS_URL;
let redisClient = null;
let redisStore = null;
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      retryStrategy: () => null,
    });
    // Avoid noisy unhandled error logs if Redis is down
    redisClient.on("error", () => {});
    redisStore = new RedisStore({ client: redisClient });
  } catch (e) {
    redisClient = null;
    redisStore = null;
  }
}
const redisSessionRouterFactory = require("./src/routes/auth-redis");
const redisSessionRouter = redisSessionRouterFactory(session, redisStore);
app.use("/redis", redisSessionRouter);

// Admin routes (simple role-protected area)
const adminRouterFactory = require("./src/routes/admin");
app.use(
  "/admin",
  adminRouterFactory(
    session,
    new FileStore({ path: path.join(__dirname, ".admin-sessions") })
  )
);

// Download route (serve uploaded files by filename)
app.get("/download/:type/:filename", (req, res) => {
  const { type, filename } = req.params;
  const safeType = type === "profile" ? "profile" : "others";
  const filePath = path.join(uploadsBase, safeType, path.basename(filename));
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  return res.download(filePath);
});

// Home redirect
app.get("/", (req, res) => {
  return res.redirect("/register");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
