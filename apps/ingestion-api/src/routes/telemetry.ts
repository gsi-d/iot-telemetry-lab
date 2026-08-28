import type { FastifyInstance } from "fastify";
import { telemetrySchema } from "@iot/contracts";
import { publishTelemetry } from "../messaging/rabbitmq.js";
import { telemetryReceivedCounter } from "../observability/metrics.js";

export async function telemetryRoutes(
  app: FastifyInstance
) {
  app.post("/telemetry", async (request, reply) => {
    const result = telemetrySchema.safeParse(
      request.body
    );

    if (!result.success) {
      return reply.status(400).send({
        message: "Invalid telemetry",
        errors: result.error.flatten()
      });
    }

    const telemetry = result.data;

    publishTelemetry(telemetry);

    telemetryReceivedCounter.add(1);

    request.log.info(
      {
        deviceId: telemetry.deviceId,
        telemetryType: telemetry.type,
        telemetryValue: telemetry.value,
      },
      "Telemetry received",
    );

    return reply.status(202).send({
      message: "Telemetry accepted"
    });
  });
}