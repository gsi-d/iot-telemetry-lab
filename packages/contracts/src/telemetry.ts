import { z } from "zod";

export const telemetryTypes = [
  "temperature",
  "vibration",
  "pressure"
] as const;

export const telemetrySchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(telemetryTypes),
  value: z.number(),
  timestamp: z.iso.datetime()
});

export type Telemetry = z.infer<typeof telemetrySchema>;