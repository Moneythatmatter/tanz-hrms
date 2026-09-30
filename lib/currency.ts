/** Tanzanian shilling (TZS) formatting for HR / payroll UI. */

export const CURRENCY_LOCALE = "en-TZ";
export const CURRENCY_CODE = "TZS";

const standardFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
});

const preciseFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  maximumFractionDigits: 0,
});

/** Formatted amount with TZS currency symbol (e.g. TSh 1,234). */
export function formatMoney(amount: number, options?: { precise?: boolean }): string {
  const formatter = options?.precise ? preciseFormatter : standardFormatter;
  return formatter.format(amount);
}

/** Grouped number without currency symbol (for inputs/icons that show symbol separately). */
export function formatMoneyNumber(amount: number): string {
  return numberFormatter.format(amount);
}

/** Short label for form fields, e.g. "Amount (TZS)". */
export const CURRENCY_AMOUNT_LABEL = "TZS";

/** Compact payroll totals (millions) for dashboard summary cards. */
export function formatMoneyCompactTotal(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `TSh ${(amount / 1_000_000).toFixed(2)}M`;
  }
  return formatMoney(amount);
}
