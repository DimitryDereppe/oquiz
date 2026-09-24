export const config = {
  port: parseInt(process.env.PORT || "0"),
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  databaseUrl: process.env.DATABASE_URL || ""
};
