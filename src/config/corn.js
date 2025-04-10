const cron = require("node-cron");
const logger = require("../utils/logger");
const { clearAllCache } = require("./cache");

cron.schedule("0 3 * * *", () => clearAllCache(), {
  timezone: "Asia/Dhaka",
});

logger.info("Cache invalidation time : 🕒 3:00 AM daily.");
