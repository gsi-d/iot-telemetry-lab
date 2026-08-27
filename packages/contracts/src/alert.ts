import { z } from "zod";

export const alertSeveritySchema = z.enum([
  "warning",
  "critical"
]);

export const alertCreatedSchema = z.object({
  id: z.string().uuid(),

  deviceId: z.string().min(1),

  telemetryType: z.enum([
    "temperature",
    "vibration",
    "pressure"
  ]),

  value: z.number(),

  expectedRange: z.object({
    min: z.number(),
    max: z.number()
  }),

  severity: alertSeveritySchema,

  telemetryTimestamp: z.iso.datetime(),

  createdAt: z.iso.datetime()
});

export type AlertCreated =
  z.infer<typeof alertCreatedSchema>;