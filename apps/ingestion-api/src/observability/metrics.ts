import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("ingestion-api");

export const telemetryReceivedCounter = meter.createCounter(
  "iot.telemetry.received",
  {
    description: "Quantidade de telemetrias recebidas pela ingestion API",
    unit: "{telemetry}",
  },
);