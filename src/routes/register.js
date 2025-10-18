const path = require("path");
const fs = require("fs");
const express = require("express");
const { body, validationResult } = require("express-validator");
const multer = require("multer");

const router = express.Router();

const uploadsBase = path.join(process.cwd(), "public", "uploads");
const profileDir = path.join(uploadsBase, "profile");
const othersDir = path.join(uploadsBase, "others");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePic") {
      cb(null, profileDir);
    } else {
      cb(null, othersDir);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const clean = path.basename(file.originalname);
    cb(null, unique + "-" + clean);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // basic image/pdf filter
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Allowed: jpg, png, gif, pdf"));
    }
    cb(null, true);
  },
});

const registrationValidators = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Select a gender"),
  body("hobbies").custom((v) => {
    if (!v) return true; // optional
    const arr = Array.isArray(v) ? v : [v];
    const allowed = ["sports", "music", "reading", "coding"];
    if (arr.some((x) => !allowed.includes(x))) throw new Error("Invalid hobby");
    return true;
  }),
];

router.get("/register", (req, res) => {
  res.render("register", { errors: {}, data: {}, files: {} });
});

router.post(
  "/register",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "otherPics", maxCount: 5 },
  ]),
  registrationValidators,
  (req, res) => {
    const errors = validationResult(req);
    const mappedErrors = {};
    if (!errors.isEmpty()) {
      for (const err of errors.array()) {
        mappedErrors[err.path] = err.msg;
      }
      return res.status(400).render("register", {
        errors: mappedErrors,
        data: req.body,
        files: {},
      });
    }

    // File presence validation post-multer
    const profile = req.files?.profilePic?.[0] || null;
    if (!profile) {
      mappedErrors.profilePic = "Profile picture is required";
      return res.status(400).render("register", {
        errors: mappedErrors,
        data: req.body,
        files: {},
      });
    }

    // Success: show summary page
    const others = req.files?.otherPics || [];
    let hobbies = [];
    if (Array.isArray(req.body.hobbies)) {
      hobbies = req.body.hobbies;
    } else if (req.body.hobbies) {
      hobbies = [req.body.hobbies];
    }
    const summary = {
      username: req.body.username,
      email: req.body.email,
      gender: req.body.gender,
      hobbies,
      profilePic: "/uploads/profile/" + path.basename(profile.filename),
      otherPics: others.map(
        (f) => "/uploads/others/" + path.basename(f.filename)
      ),
    };
    return res.render("register-success", { data: summary });
  }
);

module.exports = router;
