import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";

import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";

import { resourceFromAttributes } from "@opentelemetry/resources";

import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { FastifyOtelInstrumentation } from "@fastify/otel";

const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

const baseUrl = otlpEndpoint.replace(/\/$/, "");

/*
 * TRACES
 */
const traceExporter = new OTLPTraceExporter({
  url: `${baseUrl}/v1/traces`,
});

/*
 * METRICS
 */
const metricExporter = new OTLPMetricExporter({
  url: `${baseUrl}/v1/metrics`,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10_000,
});

/*
 * LOGS
 */
const logExporter = new OTLPLogExporter({
  url: `${baseUrl}/v1/logs`,
});

const logRecordProcessor = new BatchLogRecordProcessor({
  exporter: logExporter,
});

/*
 * SDK
 */
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "ingestion-api",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),

  traceExporter,

  metricReader,

  logRecordProcessors: [
    logRecordProcessor,
  ],

  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-amqplib": {
        enabled: true,
      },

      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },

      "@opentelemetry/instrumentation-pino": {
        enabled: true,

        disableLogSending: false,

        disableLogCorrelation: false,

        logKeys: {
          traceId: "trace_id",
          spanId: "span_id",
          traceFlags: "trace_flags",
        },
      },
    }),

    new FastifyOtelInstrumentation({
      registerOnInitialization: true,
      instrumentHooks: false,
    }),
  ],
});

sdk.start();

console.log("[otel] OpenTelemetry inicializado");

async function shutdown() {
  try {
    await sdk.shutdown();

    console.log("[otel] OpenTelemetry finalizado");
  } catch (error) {
    console.error("[otel] Erro ao finalizar OpenTelemetry", error);
  }
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);