import { FastifyInstance } from "fastify";
import { telemetrySchema } from "@iot/contracts";

export async function telemetryRoutes(app: FastifyInstance) {
  app.post("/telemetry", async (request, reply) => {
    const result = telemetrySchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: "Invalid telemetry",
        errors: result.error.flatten()
      });
    }

    const telemetry = result.data;

    request.log.info(
      {
        deviceId: telemetry.deviceId,
        type: telemetry.type,
        value: telemetry.value,
        timestamp: telemetry.timestamp
      },
      "Telemetry received"
    );

    return reply.status(202).send({
      message: "Telemetry accepted"
    });
  });
}