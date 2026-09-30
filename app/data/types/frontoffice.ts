export type FrontOfficeStatus =
  | "Confirmed"
  | "Checked In"
  | "Checked Out"
  | "Pending";

export interface FrontOfficeStat {
  title: string;
  value: string;
  note: string;
  trend?: "up" | "down" | "neutral";
}

export interface ArrivalGuest {
  id: string;
  name: string;
  bookingId: string;
  roomNo: string;
  roomType: string;
  status: FrontOfficeStatus;
}

export interface DepartureGuest {
  id: string;
  name: string;
  bookingId: string;
  roomNo: string;
  roomType: string;
  status: FrontOfficeStatus;
}

export interface RoomInventoryStatus {
  label: string;
  count: number;
  color: string;
}

export interface RoomInventoryData {
  percentage: number;
  occupied: number;
  total: number;
  statuses: RoomInventoryStatus[];
}

export interface WeeklyFlowPoint {
  day: string;
  checkIn: number;
  checkOut: number;
}

export interface BookingSource {
  name: string;
  value: number;
  color: string;
}

export interface DeskActivity {
  id: string;
  message: string;
  timestamp: string;
}

export type ReservationStatus =
  | "Confirmed"
  | "Checked In"
  | "Reserved"
  | "Checked Out"
  | "Cancelled"
  | "In-House";

export interface ReservationSummaryStat {
  label: string;
  value: number;
  icon: "calendar" | "user-check" | "bed" | "wallet";
  color: string;
}

export interface ReservationBooking {
  id: string;
  bookingNo?: string;
  guestId: string;
  guestNo?: string;
  roomRefId?: string;
  guestName?: string;
  phone?: string;
  email?: string;
  sourceId?: string;
  /** Enriched from booking_sources */
  source?: string;
  roomNo?: string;
  roomType?: string;
  checkIn: string;
  checkOut: string;
  balance: number;
  status: ReservationStatus;
  arrivingToday?: boolean;
  bookingType?: "Individual" | "Company";
  companyName?: string;
  // Extended detail fields — collected at check-in
  gender?: string;
  dob?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  idProofType?: string;
  idNumber?: string;
  adults?: number;
  children?: number;
  nights?: number;
  tariffPlan?: string;
  mealPlan?: string;
  roomRate?: number;
  totalAmount?: number;
  advancePaid?: number;
  paymentMode?: string;
  /** UPI / card / bank ref — stored on transactions.external_reference */
  externalReference?: string;
  specialRequests?: string;
  createdAt?: string;
  bookedBy?: string;
}

export type ReservationFilter =
  | "all"
  | "arriving-today"
  | "confirmed"
  | "in-house"
  | "reserved"
  | "checked-out"
  | "cancelled"
  | "outstanding";
