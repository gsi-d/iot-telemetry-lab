import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("anomaly-worker");

export const anomalyProcessedCounter =
  meter.createCounter(
    "iot.anomaly.processed",
    {
      description:
        "Quantidade de telemetrias analisadas para anomalias",
      unit: "{telemetry}",
    },
  );

export const anomalyDetectedCounter =
  meter.createCounter(
    "iot.anomaly.detected",
    {
      description:
        "Quantidade de anomalias detectadas",
      unit: "{anomaly}",
    },
  );

export const anomalyProcessingErrorCounter =
  meter.createCounter(
    "iot.anomaly.processing.errors",
    {
      description:
        "Quantidade de falhas durante análise de anomalias",
      unit: "{error}",
    },
  );