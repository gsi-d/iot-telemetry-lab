import type { Telemetry } from "@iot/contracts";

export type TelemetryType = Telemetry["type"];

export interface SensorRange {
  type: TelemetryType;

  normal: {
    min: number;
    max: number;
  };

  anomaly: {
    min: number;
    max: number;
  };
}

export interface Device {
  id: string;
  name: string;
  type: "motor" | "compressor" | "pump";
  sensors: SensorRange[];
}