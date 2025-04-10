exports.swaggerOptions = {
  swagger: "2.0",
  info: {
    title: "1M Blog API",
    version: "1.0.0",
    description: "API Documentation",
  },
  host: "localhost:3000",
  basePath: "/api/v1",
  schemes: ["http", "https"],

  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "JWT Authorization. Example: 'Bearer {token}'",
    },
  },
  security: [{ bearerAuth: [] }],
};

exports.corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = [
      undefined, // Same-origin
      "http://localhost:3000",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked: Origin not allowed!"));
    }
  },
};
