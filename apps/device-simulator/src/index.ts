import type { Telemetry } from "@iot/contracts";
import { devices } from "@iot/device-catalog";
import { generateDeviceTelemetry } from "./telemetry/telemetry-generator.js";

const API_URL =
  process.env.INGESTION_API_URL ??
  "http://localhost:3001";

async function sendTelemetry(
  telemetry: Telemetry
): Promise<void> {
  try {
    const response = await fetch(
      `${API_URL}/telemetry`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(telemetry)
      }
    );

    console.log(
      [
        telemetry.deviceId,
        telemetry.type,
        telemetry.value,
        response.status
      ].join(" | ")
    );
  } catch (error) {
    console.error(
      "Failed to send telemetry",
      {
        telemetry,
        error
      }
    );
  }
}

async function simulate(): Promise<void> {
  for (const device of devices) {
    const telemetryList =
      generateDeviceTelemetry(device);

    for (const telemetry of telemetryList) {
      await sendTelemetry(telemetry);
    }
  }
}

setInterval(() => {
  void simulate();
}, 2000);