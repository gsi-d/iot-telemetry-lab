import { randomUUID } from "node:crypto";
import amqp from "amqplib";

import {
  telemetrySchema,
  type AlertCreated,
  type Telemetry
} from "@iot/contracts";

import {
  devices,
  type SensorRange
} from "@iot/device-catalog";
import { anomalyDetectedCounter, anomalyProcessedCounter } from "./observability/metrics.js";
import { logger } from "./observability/logger.js";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  "amqp://guest:guest@localhost:5672";

const TELEMETRY_EXCHANGE =
  "telemetry.events";

const TELEMETRY_QUEUE =
  "anomaly.detection";

const ALERT_EXCHANGE =
  "alert.events";

  const DEAD_LETTER_EXCHANGE =
  "dead-letter.events";

  const DEAD_LETTER_QUEUE =
    "anomaly.detection.dlq";

  const DEAD_LETTER_ROUTING_KEY =
    "anomaly.detection.failed";

function findSensorRule(
  telemetry: Telemetry
): SensorRange | undefined {
  const device =
    devices.find(
      device => device.id === telemetry.deviceId
    );

  if (!device) {
    return undefined;
  }

  return device.sensors.find(
    sensor => sensor.type === telemetry.type
  );
}

function isAnomaly(
  telemetry: Telemetry,
  sensor: SensorRange
): boolean {
  return (
    telemetry.value < sensor.normal.min ||
    telemetry.value > sensor.normal.max
  );
}

function determineSeverity(
  telemetry: Telemetry,
  sensor: SensorRange
): "warning" | "critical" {
  const isCritical =
    telemetry.value >= sensor.anomaly.min &&
    telemetry.value <= sensor.anomaly.max;

  return isCritical
    ? "critical"
    : "warning";
}

function createAlert(
  telemetry: Telemetry,
  sensor: SensorRange
): AlertCreated {
  return {
    id: randomUUID(),

    deviceId:
      telemetry.deviceId,

    telemetryType:
      telemetry.type,

    value:
      telemetry.value,

    expectedRange: {
      min: sensor.normal.min,
      max: sensor.normal.max
    },

    severity:
      determineSeverity(
        telemetry,
        sensor
      ),

    telemetryTimestamp:
      telemetry.timestamp,

    createdAt:
      new Date().toISOString()
  };
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

  await channel.assertExchange(
    ALERT_EXCHANGE,
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
    "telemetry.#"
  );

  console.log(
    "Anomaly worker waiting for telemetry"
  );

  await channel.consume(
    TELEMETRY_QUEUE,
    async message => {
      if (!message) {
        return;
      }

      try {
        const data =
          JSON.parse(
            message.content.toString()
          );

        const telemetry =
          telemetrySchema.parse(data);

          logger.info(
            {
              deviceId: telemetry.deviceId,
              telemetryType: telemetry.type,
              telemetryValue: telemetry.value,
            },
            "Analyzing telemetry for anomaly",
          );

        const sensor =
          findSensorRule(telemetry);

        if (!sensor) {
          console.warn(
            `No sensor rule found for ${telemetry.deviceId}/${telemetry.type}`
          );

          channel.nack(
            message,
            false,
            false
          );

          return;
        }

         anomalyProcessedCounter.add(1);

        if (
          !isAnomaly(
            telemetry,
            sensor
          )
        ) {
          console.log(
            `Normal telemetry: ${telemetry.deviceId} ${telemetry.type} ${telemetry.value}`
          );

          channel.ack(message);

          return;
        }

        const alert =
          createAlert(
            telemetry,
            sensor
          );

        const published =
          channel.publish(
            ALERT_EXCHANGE,
            "alert.created",
            Buffer.from(
              JSON.stringify(alert)
            ),
            {
              persistent: true,
              contentType: "application/json"
            }
          );

        anomalyDetectedCounter.add(1);

        logger.warn(
          {
            deviceId: telemetry.deviceId,
            telemetryType: telemetry.type,
            telemetryValue: telemetry.value,
          },
          "Anomaly detected",
        );

        console.log(
          `ALERT ${alert.severity}: ${alert.deviceId} ${alert.telemetryType}=${alert.value}`
        );

        console.log(
          `Alert published: ${published}`
        );

        channel.ack(message);
      } catch (error) {
        console.error(
          "Failed to process telemetry:",
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
    "Anomaly worker failed:",
    error
  );

  process.exit(1);
});