import amqp from "amqplib";
import {
  telemetrySchema,
  type Telemetry
} from "@iot/contracts";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  "amqp://guest:guest@localhost:5672";

const TELEMETRY_QUEUE = "telemetry.processing";

const TELEMETRY_EXCHANGE =
  "telemetry.events";

  const TELEMETRY_BINDING =
  "telemetry.#";

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
      durable: true
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

      try {
        const routingKey =
          message.fields.routingKey;

        const content =
          message.content.toString();

        const data =
          JSON.parse(content);

        const telemetry =
          telemetrySchema.parse(data);

        console.log(
          `Routing key: ${routingKey}`
        );

        await processTelemetry(
          telemetry
        );

        channel.ack(message); // Indica que a mensagem foi processada e pode ser removida da fila
      } catch (error) {
        console.error(
          "Failed to process telemetry",
          error
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