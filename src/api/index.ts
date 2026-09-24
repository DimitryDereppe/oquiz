/**
 * bootstrap de l'application
 */

import "dotenv/config";
import { app } from "./src/app.ts";
import { config } from "./config.ts";
import { logger } from "./src/lib/logger.ts";

app.listen(config.port, () => {

  // log de niveau info
  // message : 🚀 Server ready
  // meta data : { address: `http://localhost:${config.port}` }
  logger.info(`🚀 Server ready`, { address: `http://localhost:${config.port}` });
  // console.log(`🚀 Server ready at http://localhost:${config.port}`);
});
