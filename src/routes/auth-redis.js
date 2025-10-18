const express = require("express");

module.exports = (session, redisStore) => {
  const router = express.Router();
  if (!redisStore) {
    // Express 5+: avoid bare "*"; handle all methods & paths safely
    router.use((req, res) => {
      res
        .status(500)
        .send("Redis not configured. Set REDIS_URL env and restart.");
    });
    return router;
  }

  router.use(
    session({
      store: redisStore,
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 30 },
    })
  );

  const requireAuth = (req, res, next) => {
    if (req.session?.user) return next();
    return res.redirect("/redis/login");
  };

  router.get("/login", (req, res) => {
    res.render("login", { base: "/redis", error: "" });
  });

  router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    if (username === "user" && password === "password") {
      req.session.user = { username };
      return res.redirect("/redis/dashboard");
    }
    return res
      .status(401)
      .render("login", { base: "/redis", error: "Invalid credentials" });
  });

  router.get("/dashboard", requireAuth, (req, res) => {
    res.render("dashboard", { base: "/redis", user: req.session.user });
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/redis/login");
    });
  });

  return router;
};
