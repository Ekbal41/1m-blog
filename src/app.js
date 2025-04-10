require("./config/corn");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const logger = require("./utils/logger");
const sUI = require("swagger-ui-express");
const { PrismaClient } = require("@prisma/client");
const errorHandler = require("./middleware/errorHandler");
const { corsOptions } = require("./options");
const sFile = require("./swagger.json");

const router = require("./routes");
const prisma = new PrismaClient();
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(router);

app.use("/", sUI.serve, sUI.setup(sFile));

app.use(errorHandler);

prisma
  .$connect()
  .then(() => logger.info("Connected to SQLite database!"))
  .catch((err) => logger.error("Database connection error", err));

module.exports = app;
