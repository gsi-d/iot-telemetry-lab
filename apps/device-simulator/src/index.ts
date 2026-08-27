import type { Telemetry } from "@iot/contracts";

const API_URL = "http://localhost:3000";

const devices = [
  "motor-01",
  "motor-02",
  "motor-03"
];

function randomBetween(min: number, max: number): number {
  return Number(
    (Math.random() * (max - min) + min).toFixed(2)
  );
}

function generateTelemetry(deviceId: string): Telemetry {
  return {
    deviceId,
    type: "temperature",
    value: randomBetween(30, 100),
    timestamp: new Date().toISOString()
  };
}

async function sendTelemetry(telemetry: Telemetry) {
  try {
    const response = await fetch(`${API_URL}/telemetry`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(telemetry)
    });

    console.log(
      `${telemetry.deviceId} -> ${telemetry.value}°C -> ${response.status}`
    );
  } catch (error) {
    console.error("Failed to send telemetry:", error);
  }
}

setInterval(() => {
  for (const device of devices) {
    const telemetry = generateTelemetry(device);

    void sendTelemetry(telemetry);
  }
}, 2000);