const express = require("express");
const systemController = require("../controllers/systemController");
const router = express.Router();

router.get("/health", systemController.getHealth);
router.get("/info", systemController.getSystemInfo);
router.get("/version", systemController.getApiVersion);

module.exports = router;
