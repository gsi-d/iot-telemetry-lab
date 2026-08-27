import type { Telemetry } from "@iot/contracts";
import type { Device, SensorRange } from "../devices/device.types.js";

const ANOMALY_PROBABILITY = 0.05;

function randomBetween(min: number, max: number): number {
  return Number(
    (Math.random() * (max - min) + min).toFixed(2)
  );
}

function shouldGenerateAnomaly(): boolean {
  return Math.random() < ANOMALY_PROBABILITY;
}

function generateSensorTelemetry(
  device: Device,
  sensor: SensorRange
): Telemetry {
  const anomaly = shouldGenerateAnomaly();

  const range = anomaly
    ? sensor.anomaly
    : sensor.normal;

  const value = randomBetween(
    range.min,
    range.max
  );

  return {
    deviceId: device.id,
    type: sensor.type,
    value,
    timestamp: new Date().toISOString()
  };
}

export function generateDeviceTelemetry(
  device: Device
): Telemetry[] {
  return device.sensors.map((sensor) =>
    generateSensorTelemetry(device, sensor)
  );
}