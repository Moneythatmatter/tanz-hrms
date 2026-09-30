import type { OccupancyData } from "../types";

export const occupancyData: OccupancyData = {
  percentage: 55,
  occupied: 142,
  total: 256,
  statuses: [
    { label: "Occupied", count: 142, color: "#16a34a" },
    { label: "Available", count: 68, color: "#22c55e" },
    { label: "Reserved", count: 32, color: "#a855f7" },
    { label: "Not Ready", count: 14, color: "#f97316" },
  ],
};
