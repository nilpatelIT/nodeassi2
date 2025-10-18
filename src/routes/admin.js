const express = require("express");

module.exports = (session, fileStore) => {
  const router = express.Router();
  router.use(
    session({
      store: fileStore,
      secret:
        process.env.ADMIN_SESSION_SECRET ||
        process.env.SESSION_SECRET ||
        "admin_dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 30 },
    })
  );

  const requireAdmin = (req, res, next) => {
    if (req.session && req.session.admin) return next();
    return res.redirect("/admin/login");
  };

  router.get("/login", (req, res) => {
    res.render("admin-login", { error: "" });
  });

  router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    // Simple hardcoded admin user for demo
    if (username === "admin" && password === "admin123") {
      req.session.admin = { username, role: "ADMIN" };
      return res.redirect("/admin/dashboard");
    }
    return res
      .status(401)
      .render("admin-login", { error: "Invalid admin credentials" });
  });

  router.get("/dashboard", requireAdmin, (req, res) => {
    res.render("admin-dashboard", { admin: req.session.admin });
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/admin/login"));
  });

  return router;
};
