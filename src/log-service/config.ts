export const config = {
  mongodbUrl: process.env.MONGODB_URL ?? "",
  mongodbCollection: process.env.MONGODB_COLLECTION ?? "",
  port: parseInt(process.env.PORT || "0"),
  allowedOrigins: process.env.ALLOWED_ORIGINS
};
