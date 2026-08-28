import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";

import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

import { resourceFromAttributes } from "@opentelemetry/resources";

import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const endpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
  "http://localhost:4318";

const baseUrl = endpoint.replace(/\/$/, "");

const traceExporter = new OTLPTraceExporter({
  url: `${baseUrl}/v1/traces`,
});

const metricExporter = new OTLPMetricExporter({
  url: `${baseUrl}/v1/metrics`,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10_000,
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "anomaly-worker",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),

  traceExporter,
  metricReader,

  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-amqplib": {
        enabled: true,
      },

      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
    }),
  ],
});

sdk.start();

console.log(
  "[otel] anomaly-worker OpenTelemetry inicializado",
);

async function shutdown() {
  try {
    await sdk.shutdown();
  } catch (error) {
    console.error(
      "[otel] Erro ao finalizar anomaly-worker",
      error,
    );
  }
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);