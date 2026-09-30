import type { ActivityItem } from "../types";

export const activityLog: ActivityItem[] = [
  {
    id: "1",
    message: "New booking confirmed for Room 204",
    timestamp: "10 min ago",
    type: "booking",
  },
  {
    id: "2",
    message: "Guest checked in — Room 118, Rahul Sharma",
    timestamp: "25 min ago",
    type: "checkin",
  },
  {
    id: "3",
    message: "Payment received for BK-1038 ($450)",
    timestamp: "1 hr ago",
    type: "payment",
  },
  {
    id: "4",
    message: "Housekeeping completed — Room 305",
    timestamp: "1 hr ago",
    type: "maintenance",
  },
  {
    id: "5",
    message: "Guest checked out — Room 412",
    timestamp: "2 hr ago",
    type: "checkout",
  },
  {
    id: "6",
    message: "New booking confirmed for Room 501",
    timestamp: "3 hr ago",
    type: "booking",
  },
];
