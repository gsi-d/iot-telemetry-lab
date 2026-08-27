import amqp from "amqplib";

import {
  alertCreatedSchema
} from "@iot/contracts";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  "amqp://guest:guest@localhost:5672";

const ALERT_EXCHANGE =
  "alert.events";

const ALERT_QUEUE =
  "alerts.processing";

  const DEAD_LETTER_EXCHANGE =
  "dead-letter.events";

  const DEAD_LETTER_QUEUE =
    "alerts.processing.dlq";

  const DEAD_LETTER_ROUTING_KEY =
    "alerts.processing.failed";

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
    ALERT_EXCHANGE,
    "topic",
    {
      durable: true
    }
  );

  await channel.assertQueue(
  ALERT_QUEUE,
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
    ALERT_QUEUE,
    ALERT_EXCHANGE,
    "alert.created"
  );

  console.log(
    "Alert worker waiting for alerts"
  );

  await channel.consume(
    ALERT_QUEUE,
    async message => {
      if (!message) {
        return;
      }

      try {
        const content =
          JSON.parse(
            message.content.toString()
          );

        const alert =
          alertCreatedSchema.parse(
            content
          );

        console.log(
          "================================="
        );

        console.log(
          `ALERT ${alert.severity.toUpperCase()}`
        );

        console.log(
          `Device: ${alert.deviceId}`
        );

        console.log(
          `Sensor: ${alert.telemetryType}`
        );

        console.log(
          `Value: ${alert.value}`
        );

        console.log(
          `Expected: ${alert.expectedRange.min} - ${alert.expectedRange.max}`
        );

        console.log(
          "================================="
        );

        channel.ack(message);
      } catch (error) {
        console.error(
          "Failed to process alert:",
          error
        );

        channel.nack(
          message,
          false,
          false
        );
      }
    },
    {
      noAck: false
    }
  );
}

start().catch(error => {
  console.error(
    "Alert worker failed:",
    error
  );

  process.exit(1);
});