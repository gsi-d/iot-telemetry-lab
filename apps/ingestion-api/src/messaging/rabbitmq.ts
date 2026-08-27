import amqp from "amqplib";
import type { Telemetry } from "@iot/contracts";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  "amqp://guest:guest@localhost:5672";

const TELEMETRY_QUEUE = "telemetry.raw";

const TELEMETRY_EXCHANGE =
  "telemetry.events";

let connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;
let channel: Awaited<ReturnType<typeof createChannel>> | null = null;

async function createChannel() {
  if (!connection) {
    throw new Error("RabbitMQ connection has not been created");
  }

  return connection.createChannel();
}

export async function connectRabbitMQ(): Promise<void> {
  connection = await amqp.connect(RABBITMQ_URL); // Criação da conexão TCP/AMQP com RabbitMQ

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error);
  });

  connection.on("close", () => {
    console.warn("RabbitMQ connection closed");
  });

  channel = await createChannel();

  // Criação da exchange no rabbitmq
  await channel.assertExchange(
    TELEMETRY_EXCHANGE,
    "topic",
    {
      durable: true
    }
  );

  console.log(
    `Connected to RabbitMQ - exchange: ${TELEMETRY_EXCHANGE}`
  );
}

export function publishTelemetry(
  telemetry: Telemetry
): void {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  const routingKey =
    `telemetry.${telemetry.type}`;

  const message = Buffer.from(
    JSON.stringify(telemetry)
  );

  channel.publish(
    TELEMETRY_EXCHANGE,
    routingKey,
    message,
    {
      persistent: true,
      contentType: "application/json"
    }
  );
}