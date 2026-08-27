import { Device } from "./types.js";


export const devices: Device[] = [
  {
    id: "motor-01",
    name: "Motor Transportador Principal",
    type: "motor",
    sensors: [
      {
        type: "temperature",
        normal: {
          min: 50,
          max: 75
        },
        anomaly: {
          min: 95,
          max: 115
        }
      },
      {
        type: "vibration",
        normal: {
          min: 1,
          max: 3
        },
        anomaly: {
          min: 7,
          max: 12
        }
      }
    ]
  },

  {
    id: "motor-02",
    name: "Motor Transportador Secundário",
    type: "motor",
    sensors: [
      {
        type: "temperature",
        normal: {
          min: 45,
          max: 70
        },
        anomaly: {
          min: 90,
          max: 110
        }
      },
      {
        type: "vibration",
        normal: {
          min: 1,
          max: 3.5
        },
        anomaly: {
          min: 8,
          max: 13
        }
      }
    ]
  },

  {
    id: "compressor-01",
    name: "Compressor de Ar",
    type: "compressor",
    sensors: [
      {
        type: "temperature",
        normal: {
          min: 55,
          max: 80
        },
        anomaly: {
          min: 100,
          max: 125
        }
      },
      {
        type: "vibration",
        normal: {
          min: 1,
          max: 4
        },
        anomaly: {
          min: 8,
          max: 14
        }
      },
      {
        type: "pressure",
        normal: {
          min: 6,
          max: 8
        },
        anomaly: {
          min: 10,
          max: 14
        }
      }
    ]
  },

  {
    id: "pump-01",
    name: "Bomba de Refrigeração",
    type: "pump",
    sensors: [
      {
        type: "temperature",
        normal: {
          min: 35,
          max: 60
        },
        anomaly: {
          min: 85,
          max: 105
        }
      },
      {
        type: "pressure",
        normal: {
          min: 2,
          max: 5
        },
        anomaly: {
          min: 7,
          max: 10
        }
      }
    ]
  }
];