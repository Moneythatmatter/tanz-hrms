export type FolioStatus = "OPEN" | "CLOSED" | "VOID";

export interface FolioListItem {
  id: string;
  folioNumber?: string | null;
  bookingId?: string | null;
  guestId?: string | null;
  status: FolioStatus;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  openedAt?: string;
  closedAt?: string | null;
  guestName?: string;
  guestNo?: string | null;
  room?: string | null;
  roomType?: string | null;
  bookingNo?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  reservationStatus?: string | null;
}

export type LedgerTransactionType = "PAYMENT" | "REFUND" | "ADJUSTMENT";

export interface LedgerTransaction {
  id: string;
  transactionNumber: string;
  transactionType: LedgerTransactionType;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  folioId?: string | null;
  bookingId?: string | null;
  guestId?: string | null;
  sourceModule?: string | null;
  externalReference?: string | null;
  transactionDate: string;
  notes?: string | null;
}
