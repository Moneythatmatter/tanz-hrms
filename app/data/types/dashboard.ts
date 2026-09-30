export type StatTrend = "up" | "down";

export interface SummaryStat {
  title: string;
  value: string;
  change: string;
  trend: StatTrend;
}

export interface GuestDataPoint {
  day: string;
  count: number;
}

export interface RevenueDataPoint {
  month: string;
  amount: number;
}

export interface BookingChartDataPoint {
  month: string;
  booked: number;
  canceled: number;
}

export interface PlatformDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface OccupancyStatus {
  label: string;
  count: number;
  color: string;
}

export interface OccupancyData {
  percentage: number;
  occupied: number;
  total: number;
  statuses: OccupancyStatus[];
}

export interface RatingCategory {
  label: string;
  score: number;
}

export interface RatingsData {
  overall: number;
  maxScore: number;
  categories: RatingCategory[];
}

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type: "booking" | "checkin" | "checkout" | "payment" | "maintenance";
}

export type BookingStatus = "Confirmed" | "Checked In" | "Pending" | "Canceled";

export interface Booking {
  id: string;
  guestName: string;
  roomType: string;
  roomNo: string;
  duration: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
}
