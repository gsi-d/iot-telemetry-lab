import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("telemetry-worker");

export const telemetryProcessedCounter =
  meter.createCounter(
    "iot.telemetry.processed",
    {
      description:
        "Quantidade de telemetrias processadas pelo worker",
      unit: "{telemetry}",
    },
  );

export const telemetryProcessingErrorCounter =
  meter.createCounter(
    "iot.telemetry.processing.errors",
    {
      description:
        "Quantidade de falhas no processamento de telemetrias",
      unit: "{error}",
    },
  );