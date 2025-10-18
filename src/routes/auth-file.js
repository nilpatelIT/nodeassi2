const express = require("express");

module.exports = (session, fileStore) => {
  const router = express.Router();
  router.use(
    session({
      store: fileStore,
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 30 },
    })
  );

  const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) return next();
    return res.redirect("/file/login");
  };

  router.get("/login", (req, res) => {
    res.render("login", { base: "/file", error: "" });
  });

  router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    if (username === "user" && password === "password") {
      req.session.user = { username };
      return res.redirect("/file/dashboard");
    }
    return res
      .status(401)
      .render("login", { base: "/file", error: "Invalid credentials" });
  });

  router.get("/dashboard", requireAuth, (req, res) => {
    res.render("dashboard", { base: "/file", user: req.session.user });
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/file/login");
    });
  });

  return router;
};
