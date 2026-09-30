export type EmployeeAttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "Half Day"
  | "On Leave"
  | "Weekly Off"
  | "Holiday"
  | "Pending"
  | "Future"
  | "Before Join";

export interface EmployeeAttendanceDay {
  iso: string;
  day: number;
  label: string;
  status: EmployeeAttendanceStatus;
  shift: string;
  checkIn: string;
  checkOut: string;
  workedHours: number;
  inMonth: boolean;
}

export interface EmployeeAttendanceMonthSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  weeklyOff: number;
  holiday: number;
  pending: number;
  overtimeHours: number;
  workingDays: number;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function parseEmployeeJoinDate(joinDateStr: string): Date {
  if (!joinDateStr) return new Date();
  const parts = joinDateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
  }
  const parsed = new Date(joinDateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function monthKey(year: number, month: number): number {
  return year * 12 + month;
}

export function getAttendanceMonthBounds(
  joinDate: Date,
  today = new Date(),
): { min: { year: number; month: number }; max: { year: number; month: number } } {
  return {
    min: { year: joinDate.getFullYear(), month: joinDate.getMonth() },
    max: { year: today.getFullYear(), month: today.getMonth() },
  };
}

export function clampAttendanceMonth(
  year: number,
  month: number,
  joinDate: Date,
  today = new Date(),
): { year: number; month: number } {
  const bounds = getAttendanceMonthBounds(joinDate, today);
  const value = monthKey(year, month);
  const min = monthKey(bounds.min.year, bounds.min.month);
  const max = monthKey(bounds.max.year, bounds.max.month);
  if (value < min) return bounds.min;
  if (value > max) return bounds.max;
  return { year, month };
}

export function canGoToPrevMonth(
  year: number,
  month: number,
  joinDate: Date,
): boolean {
  const bounds = getAttendanceMonthBounds(joinDate);
  return monthKey(year, month) > monthKey(bounds.min.year, bounds.min.month);
}

export function canGoToNextMonth(
  year: number,
  month: number,
  joinDate: Date,
  today = new Date(),
): boolean {
  const bounds = getAttendanceMonthBounds(joinDate, today);
  return monthKey(year, month) < monthKey(bounds.max.year, bounds.max.month);
}

export function shiftPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function shiftNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

function generateWorkingDay(
  employeeId: string,
  date: Date,
  shiftType: string,
): Omit<EmployeeAttendanceDay, "iso" | "day" | "label" | "inMonth"> {
  const dow = date.getDay();

  // Default Sunday to Weekly Off
  if (dow === 0) {
    return {
      status: "Weekly Off",
      shift: "Weekly Off",
      checkIn: "-",
      checkOut: "-",
      workedHours: 0,
    };
  }

  // Without a manual or biometric punch, attendance status is Pending with no fake punch times
  return {
    status: "Pending",
    shift: shiftType,
    checkIn: "-",
    checkOut: "-",
    workedHours: 0,
  };
}

export function buildEmployeeAttendanceDay(
  employeeId: string,
  date: Date,
  joinDate: Date,
  shiftType: string,
  today = new Date(),
  inMonth = true,
): EmployeeAttendanceDay {
  const dayStart = startOfDay(date);
  const joinStart = startOfDay(joinDate);
  const todayStart = startOfDay(today);

  const base = {
    iso: toIso(date),
    day: date.getDate(),
    label: formatDisplayDate(date),
    inMonth,
    shift: shiftType,
    checkIn: "-",
    checkOut: "-",
    workedHours: 0,
    status: "Present" as EmployeeAttendanceStatus,
  };

  if (dayStart < joinStart) {
    return { ...base, status: "Before Join" };
  }
  if (dayStart > todayStart) {
    return { ...base, status: "Future" };
  }

  const generated = generateWorkingDay(employeeId, date, shiftType);
  return { ...base, ...generated };
}

/** Monday-first calendar cells for a month (includes leading/trailing padding). */
export function buildEmployeeAttendanceMonthGrid(
  employeeId: string,
  year: number,
  month: number,
  joinDate: Date,
  shiftType: string,
  today = new Date(),
): EmployeeAttendanceDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const cells: EmployeeAttendanceDay[] = [];

  for (let i = 0; i < mondayOffset; i++) {
    const padDate = new Date(year, month, 1 - (mondayOffset - i));
    cells.push(
      buildEmployeeAttendanceDay(
        employeeId,
        padDate,
        joinDate,
        shiftType,
        today,
        false,
      ),
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(
      buildEmployeeAttendanceDay(
        employeeId,
        new Date(year, month, day),
        joinDate,
        shiftType,
        today,
        true,
      ),
    );
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const [y, m, d] = last.iso.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    cells.push(
      buildEmployeeAttendanceDay(
        employeeId,
        next,
        joinDate,
        shiftType,
        today,
        false,
      ),
    );
  }

  return cells;
}

export function summarizeAttendanceMonth(
  days: EmployeeAttendanceDay[],
): EmployeeAttendanceMonthSummary {
  const inMonth = days.filter((d) => d.inMonth);
  const countable = inMonth.filter(
    (d) => d.status !== "Future" && d.status !== "Before Join",
  );

  const present = countable.filter((d) => d.status === "Present").length;
  const late = countable.filter((d) => d.status === "Late").length;
  const absent = countable.filter((d) => d.status === "Absent").length;
  const halfDay = countable.filter((d) => d.status === "Half Day").length;
  const onLeave = countable.filter((d) => d.status === "On Leave").length;
  const weeklyOff = countable.filter((d) => d.status === "Weekly Off").length;
  const holiday = countable.filter((d) => d.status === "Holiday").length;
  const pending = countable.filter((d) => d.status === "Pending").length;

  const overtimeHours = countable.reduce((sum, d) => {
    if (d.status === "Present" || d.status === "Late") {
      return sum + Math.max(0, d.workedHours - 8);
    }
    return sum;
  }, 0);

  return {
    present,
    absent,
    late,
    halfDay,
    onLeave,
    weeklyOff,
    holiday,
    pending,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    workingDays: present + late + halfDay,
  };
}

export function formatAttendanceMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function attendanceRecordToCalendarDay(
  iso: string,
  record: CalendarAttendanceOverlay,
): Pick<EmployeeAttendanceDay, "status" | "shift" | "checkIn" | "checkOut" | "workedHours"> {
  const apiStatus = record.status;
  let status: EmployeeAttendanceStatus = "Present";

  if (apiStatus === "On Leave") status = "On Leave";
  else if (apiStatus === "Absent") status = "Absent";
  else if (apiStatus === "Weekly Off") status = "Weekly Off";
  else if (apiStatus === "Holiday") status = "Holiday";
  else if (apiStatus === "Pending") status = "Pending";
  else if (apiStatus === "Late") status = "Late";
  else if (apiStatus === "Half Day") status = "Half Day";
  else if (apiStatus === "Present") status = "Present";

  const onLeave = status === "On Leave";
  const noPunch = !record.checkIn || record.checkIn === "—";

  return {
    status,
    shift: onLeave
      ? (record.leaveTypeName ?? "Leave")
      : (record.shiftName ?? "—"),
    checkIn: noPunch ? "-" : record.checkIn!,
    checkOut: noPunch || !record.checkOut || record.checkOut === "—" ? "-" : record.checkOut,
    workedHours: Number(record.workedHours ?? 0),
  };
}

export interface CalendarAttendanceOverlay {
  status: string;
  shiftName?: string;
  checkIn?: string;
  checkOut?: string;
  workedHours?: number;
  leaveTypeName?: string | null;
  dayType?: string;
}

export function mergeAttendanceRecordsIntoGrid(
  monthGrid: EmployeeAttendanceDay[],
  recordsByDate: Map<string, CalendarAttendanceOverlay>,
): EmployeeAttendanceDay[] {
  return monthGrid.map((day) => {
    const record = recordsByDate.get(day.iso);
    if (!record) return day;
    return { ...day, ...attendanceRecordToCalendarDay(day.iso, record) };
  });
}

export function listAttendanceLogForMonth(
  employeeId: string,
  year: number,
  month: number,
  joinDate: Date,
  shiftType: string,
  today = new Date(),
): EmployeeAttendanceDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: EmployeeAttendanceDay[] = [];

  for (let day = daysInMonth; day >= 1; day--) {
    const record = buildEmployeeAttendanceDay(
      employeeId,
      new Date(year, month, day),
      joinDate,
      shiftType,
      today,
      true,
    );
    if (record.status !== "Future" && record.status !== "Before Join") {
      rows.push(record);
    }
  }

  return rows;
}

export interface AttendanceHeatmapWeekColumn {
  weekIndex: number;
  weekStartIso: string;
  cells: EmployeeAttendanceDay[];
}

export interface AttendanceHeatmapModel {
  weeks: AttendanceHeatmapWeekColumn[];
  monthMarkers: Array<{ weekIndex: number; label: string }>;
  workingDayCount: number;
  allDays: EmployeeAttendanceDay[];
}

function startOfWeekSunday(date: Date): Date {
  const d = startOfDay(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function monthShortLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "short" });
}

/** GitHub-style heatmap: week columns × 7 weekday rows from join date through today. */
export function buildEmployeeAttendanceHeatmap(
  employeeId: string,
  joinDate: Date,
  shiftType: string,
  today = new Date(),
): AttendanceHeatmapModel {
  const joinStart = startOfDay(joinDate);
  const todayStart = startOfDay(today);
  const gridStart = startOfWeekSunday(joinStart);
  const gridEnd = startOfWeekSunday(todayStart);

  const weeks: AttendanceHeatmapWeekColumn[] = [];
  const allDays: EmployeeAttendanceDay[] = [];

  let cursor = gridStart;
  let weekIndex = 0;

  while (cursor.getTime() <= gridEnd.getTime()) {
    const cells: EmployeeAttendanceDay[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(cursor, i);
      const record = buildEmployeeAttendanceDay(
        employeeId,
        dayDate,
        joinDate,
        shiftType,
        today,
        true,
      );
      cells.push(record);

      if (
        dayDate >= joinStart &&
        dayDate <= todayStart &&
        record.status !== "Future" &&
        record.status !== "Before Join"
      ) {
        allDays.push(record);
      }
    }

    weeks.push({
      weekIndex,
      weekStartIso: toIso(cursor),
      cells,
    });

    cursor = addDays(cursor, 7);
    weekIndex += 1;
  }

  const monthMarkers: Array<{ weekIndex: number; label: string }> = [];
  const markedMonths = new Set<string>();

  for (const week of weeks) {
    for (const cell of week.cells) {
      const [y, m, d] = cell.iso.split("-").map(Number);
      const monthKey = `${y}-${m - 1}`;
      if (d !== 1 || markedMonths.has(monthKey)) continue;
      const cellDate = new Date(y, m - 1, d);
      if (cellDate < joinStart || cellDate > todayStart) continue;
      markedMonths.add(monthKey);
      monthMarkers.push({
        weekIndex: week.weekIndex,
        label: monthShortLabel(y, m - 1),
      });
      break;
    }
  }

  if (monthMarkers.length === 0 && weeks.length > 0) {
    const firstInRange = weeks[0].cells.find(
      (c) => c.status !== "Before Join" && c.status !== "Future",
    );
    if (firstInRange) {
      const [y, m] = firstInRange.iso.split("-").map(Number);
      monthMarkers.push({ weekIndex: 0, label: monthShortLabel(y, m - 1) });
    }
  }

  const workingDayCount = allDays.filter(
    (d) =>
      d.status === "Present" ||
      d.status === "Late" ||
      d.status === "Half Day",
  ).length;

  return { weeks, monthMarkers, workingDayCount, allDays };
}

/** GitHub-style heatmap for a single month (week columns within that month only). */
export function buildEmployeeAttendanceMonthHeatmap(
  employeeId: string,
  year: number,
  month: number,
  joinDate: Date,
  shiftType: string,
  today = new Date(),
): AttendanceHeatmapModel {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  let cursor = startOfWeekSunday(firstOfMonth);
  const endCursor = startOfWeekSunday(lastOfMonth);

  const weeks: AttendanceHeatmapWeekColumn[] = [];
  const allDays: EmployeeAttendanceDay[] = [];
  let weekIndex = 0;

  while (cursor.getTime() <= endCursor.getTime()) {
    const cells: EmployeeAttendanceDay[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(cursor, i);
      const inMonth =
        dayDate.getMonth() === month && dayDate.getFullYear() === year;
      const record = buildEmployeeAttendanceDay(
        employeeId,
        dayDate,
        joinDate,
        shiftType,
        today,
        inMonth,
      );
      cells.push(record);

      if (
        inMonth &&
        record.status !== "Future" &&
        record.status !== "Before Join"
      ) {
        allDays.push(record);
      }
    }

    weeks.push({
      weekIndex,
      weekStartIso: toIso(cursor),
      cells,
    });

    cursor = addDays(cursor, 7);
    weekIndex += 1;
  }

  const workingDayCount = allDays.filter(
    (d) =>
      d.status === "Present" ||
      d.status === "Late" ||
      d.status === "Half Day",
  ).length;

  return {
    weeks,
    monthMarkers: [{ weekIndex: 0, label: monthShortLabel(year, month) }],
    workingDayCount,
    allDays,
  };
}

export function summarizeAttendancePeriod(
  days: EmployeeAttendanceDay[],
): EmployeeAttendanceMonthSummary {
  return summarizeAttendanceMonth(days.map((d) => ({ ...d, inMonth: true })));
}

export function getHeatmapCellClass(status: EmployeeAttendanceStatus): string {
  switch (status) {
    case "Present":
      return "bg-emerald-700 hover:ring-2 hover:ring-emerald-400 hover:ring-offset-1";
    case "Late":
      return "bg-emerald-500 hover:ring-2 hover:ring-emerald-300 hover:ring-offset-1";
    case "Half Day":
      return "bg-emerald-300 hover:ring-2 hover:ring-emerald-200 hover:ring-offset-1";
    case "Weekly Off":
      return "bg-slate-200 hover:ring-2 hover:ring-slate-300 hover:ring-offset-1";
    case "On Leave":
      return "bg-sky-400 hover:ring-2 hover:ring-sky-300 hover:ring-offset-1";
    case "Holiday":
      return "bg-violet-600 hover:ring-2 hover:ring-violet-400 hover:ring-offset-1 text-white";
    case "Absent":
      return "bg-rose-400 hover:ring-2 hover:ring-rose-300 hover:ring-offset-1";
    case "Pending":
      return "bg-amber-100 hover:ring-2 hover:ring-amber-200 hover:ring-offset-1";
    case "Future":
    case "Before Join":
    default:
      return "bg-slate-100";
  }
}

export function getCalendarCellClass(
  status: EmployeeAttendanceStatus,
  inMonth: boolean,
): string {
  if (!inMonth) return "bg-transparent text-slate-200";
  switch (status) {
    case "Present":
      return "bg-emerald-600 text-white";
    case "Late":
      return "bg-emerald-400 text-white";
    case "Half Day":
      return "bg-emerald-200 text-emerald-900";
    case "Weekly Off":
      return "bg-slate-100 text-slate-400";
    case "On Leave":
      return "bg-sky-300 text-sky-950";
    case "Holiday":
      return "bg-violet-600 text-white font-bold shadow-xs";
    case "Absent":
      return "bg-rose-300 text-rose-950";
    case "Pending":
      return "bg-amber-100 text-amber-900";
    case "Future":
    case "Before Join":
    default:
      return "bg-slate-50 text-slate-300";
  }
}

export const HEATMAP_WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;
