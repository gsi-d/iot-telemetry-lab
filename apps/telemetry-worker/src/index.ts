import amqp from "amqplib";
import {
  telemetrySchema,
  type Telemetry
} from "@iot/contracts";
import { trace } from "@opentelemetry/api";
import {
  telemetryProcessedCounter,
  telemetryProcessingErrorCounter,
} from "./observability/metrics.js";
import { logger } from "./observability/logger.js";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  "amqp://guest:guest@localhost:5672";

const TELEMETRY_QUEUE = "telemetry.processing";

const TELEMETRY_EXCHANGE =
  "telemetry.events";

  const TELEMETRY_BINDING =
  "telemetry.#";

  const DEAD_LETTER_EXCHANGE =
  "dead-letter.events";

const DEAD_LETTER_QUEUE =
  "telemetry.processing.dlq";

const DEAD_LETTER_ROUTING_KEY =
  "telemetry.processing.failed";

async function processTelemetry(
  telemetry: Telemetry
): Promise<void> {
  console.log(
    [
      "Processed:",
      telemetry.deviceId,
      telemetry.type,
      telemetry.value
    ].join(" ")
  );
}

async function start(): Promise<void> {
  const connection =
    await amqp.connect(RABBITMQ_URL);

  const channel =
    await connection.createChannel();

    await channel.prefetch(10);

    await channel.assertExchange(
      DEAD_LETTER_EXCHANGE,
      "direct",
      {
        durable: true
      }
    );

    await channel.assertQueue(
      DEAD_LETTER_QUEUE,
      {
        durable: true
      }
    );

    await channel.bindQueue(
      DEAD_LETTER_QUEUE,
      DEAD_LETTER_EXCHANGE,
      DEAD_LETTER_ROUTING_KEY
    );

    await channel.assertExchange(
    TELEMETRY_EXCHANGE,
    "topic",
    {
      durable: true
    }
  );

  await channel.assertQueue(
    TELEMETRY_QUEUE,
    {
      durable: true,
      arguments: {
        "x-dead-letter-exchange":
          DEAD_LETTER_EXCHANGE,

        "x-dead-letter-routing-key":
          DEAD_LETTER_ROUTING_KEY
      }
    }
  );

  await channel.bindQueue(
    TELEMETRY_QUEUE,
    TELEMETRY_EXCHANGE,
    TELEMETRY_BINDING
  );

  console.log(
    `Waiting for ${TELEMETRY_BINDING} on ${TELEMETRY_QUEUE}`
  );

  await channel.consume(
    TELEMETRY_QUEUE,
    async (message) => {
      if (!message) {
        return;
      }

      const activeSpan = trace.getActiveSpan();

      const traceId =
        activeSpan?.spanContext().traceId ?? "no-active-trace";

      

      try {
        const routingKey =
          message.fields.routingKey;

        const content =
          message.content.toString();

        const data =
          JSON.parse(content);

        const telemetry =
          telemetrySchema.parse(data);

          logger.info(
            {
              deviceId: telemetry.deviceId,
              telemetryType: telemetry.type,
              telemetryValue: telemetry.value,
            },
            "Processing telemetry",
          );

        console.log(
          `Routing key: ${routingKey}`
        );

        await processTelemetry(
          telemetry
        );

        telemetryProcessedCounter.add(1, {
          "telemetry.type": telemetry.type,
        });

        logger.info(
          {
            deviceId: telemetry.deviceId,
            telemetryType: telemetry.type,
          },
          "Telemetry processed successfully",
        );

        channel.ack(message); // Indica que a mensagem foi processada e pode ser removida da fila
      } catch (error) {
        telemetryProcessingErrorCounter.add(1);
        logger.error(
          {
            err: error,
          },
          "Failed to process telemetry",
        );

        // Informa ao rabbitmq que a mensagem falhou e que não deve ser removida da fila
        channel.nack(
          message,
          false,
          false
        );
      }
    },
    {
      noAck: false // Indica que o aviso de processamento precisa ser manual
    }
  );
}

start().catch((error) => {
  console.error(
    "Telemetry worker failed:",
    error
  );

  process.exit(1);
});