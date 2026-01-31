import "dotenv/config";
import { app } from "@/app.js";
import { config, logger } from "@/config/index.js";

app.listen(config.port, "0.0.0.0", () => {
  logger.info({ port: config.port }, "Server started");
});
