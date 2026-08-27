import Fastify from "fastify";
import { telemetryRoutes } from "./routes/telemetry.js";

const app = Fastify({
  logger: true
});

app.get("/health", async () => {
  return {
    status: "ok"
  };
});

await app.register(telemetryRoutes);

try {
  await app.listen({
    port: 3000,
    host: "0.0.0.0"
  });

  app.log.info("Ingestion API running on port 3000");
} catch (error) {
  app.log.error(error);
  process.exit(1);
}