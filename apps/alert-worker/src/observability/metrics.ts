import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("alert-worker");

export const alertProcessedCounter =
  meter.createCounter(
    "iot.alert.processed",
    {
      description:
        "Quantidade de alertas processados",
      unit: "{alert}",
    },
  );

export const alertSentCounter =
  meter.createCounter(
    "iot.alert.sent",
    {
      description:
        "Quantidade de alertas enviados com sucesso",
      unit: "{alert}",
    },
  );

export const alertProcessingErrorCounter =
  meter.createCounter(
    "iot.alert.processing.errors",
    {
      description:
        "Quantidade de falhas no processamento de alertas",
      unit: "{error}",
    },
  );