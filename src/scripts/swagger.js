const logger = require("../utils/logger");
const swaggerAutogen = require("swagger-autogen")({
  disableLogs: true,
});
const { swaggerOptions } = require("../options");
const outputFile = "../swagger.json";
const endpointsFiles = ["../routes.js"];

swaggerAutogen(outputFile, endpointsFiles, swaggerOptions).then(() => {
  logger.info("Swagger documentation generated successfully.");
});
