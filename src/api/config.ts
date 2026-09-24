export const config = {
  nodeEnv: process.env.NODE_ENV ?? "",
  port: parseInt(process.env.PORT ?? "3000", 10), // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
  dbUrl: process.env.DATABASE_URL ?? "postgresql://postgres:randompassword@localhost:5432/oquiz",
  jwtSecret: process.env.JWT_SECRET ?? "",
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? "*",
  logLevel: process.env.LOG_LEVEL ?? "http",
  logServiceHost: process.env.LOG_SERVICE_HOST ?? "",
  logServicePort: parseInt(process.env.LOG_SERVICE_PORT ?? "0"),
  fileServiceHost: process.env.FILE_SERVICE_HOST || "",
  fileServicePort: parseInt(process.env.FILE_SERVICE_PORT || "0")
};
