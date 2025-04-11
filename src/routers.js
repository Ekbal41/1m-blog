const express = require("express");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const systemRoutes = require("./routes/system");

const router = express.Router();

router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/posts", postRoutes);
router.use("/api/v1", systemRoutes);

module.exports = router;
