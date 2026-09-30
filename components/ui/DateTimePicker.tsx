"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  value?: string; // ISO string e.g. "2026-09-10T16:30:00+05:30" or display string
  onChange: (value: string) => void;
  minDateTime?: string; // ISO string to validate against (defaults to now when provided or used for future-only)
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const HOUR_OPTIONS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Convert Date object to timezone-safe ISO 8601 string with local offset. */
export function toLocalIsoString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetH = pad(Math.floor(absOffset / 60));
  const offsetM = pad(absOffset % 60);

  return `${y}-${m}-${d}T${h}:${min}:${s}${sign}${offsetH}:${offsetM}`;
}

/** Format ISO datetime or legacy text to user-friendly "10 Sep 2026, 04:30 PM" */
export function formatDateTimeDisplay(val?: string): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;

  const day = d.getDate();
  const month = MONTH_SHORT[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

export function DateTimePicker({
  value,
  onChange,
  minDateTime,
  disabled = false,
  placeholder = "Select date & time",
  error = false,
  className,
}: DateTimePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse value or default
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Draft selection state within the picker
  const [selectedYear, setSelectedYear] = useState<number>(() => parsedValue ? parsedValue.getFullYear() : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => parsedValue ? parsedValue.getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => parsedValue ? parsedValue.getDate() : null);
  
  const [selectedHour12, setSelectedHour12] = useState<number>(() => {
    if (!parsedValue) return 9;
    const h = parsedValue.getHours() % 12;
    return h === 0 ? 12 : h;
  });
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    if (!parsedValue) return "00";
    const m = parsedValue.getMinutes();
    const rounded = Math.round(m / 5) * 5;
    const bounded = rounded >= 60 ? 55 : rounded;
    return String(bounded).padStart(2, "0");
  });
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(() => {
    if (!parsedValue) return "AM";
    return parsedValue.getHours() >= 12 ? "PM" : "AM";
  });

  // Calendar view navigation
  const [viewYear, setViewYear] = useState<number>(selectedYear);
  const [viewMonth, setViewMonth] = useState<number>(selectedMonth);

  // Sync state when external value changes
  useEffect(() => {
    if (parsedValue) {
      setSelectedYear(parsedValue.getFullYear());
      setSelectedMonth(parsedValue.getMonth());
      setSelectedDay(parsedValue.getDate());
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());

      const h = parsedValue.getHours();
      setSelectedHour12(h % 12 === 0 ? 12 : h % 12);
      const m = Math.round(parsedValue.getMinutes() / 5) * 5;
      setSelectedMinute(String(m >= 60 ? 55 : m).padStart(2, "0"));
      setSelectedPeriod(h >= 12 ? "PM" : "AM");
    }
  }, [parsedValue]);

  // Calculate intelligent popover position (up/down flip and horizontal bound)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 310;
      const popoverWidth = 264;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < popoverHeight && rect.top > popoverHeight;

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = Math.max(12, rect.right - popoverWidth);
      }

      setPopoverStyle({
        position: "fixed",
        top: openUp ? undefined : `${rect.bottom + 4}px`,
        bottom: openUp ? `${window.innerHeight - rect.top + 4}px` : undefined,
        left: `${Math.max(12, left)}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Compute active min boundary
  const getMinBoundary = () => {
    if (!minDateTime) return null;
    const minD = new Date(minDateTime);
    return isNaN(minD.getTime()) ? null : minD;
  };

  // Check if a calendar day is in the past relative to min boundary
  const isDayDisabled = (year: number, month: number, day: number) => {
    const minBoundary = getMinBoundary();
    if (!minBoundary) return false;

    // End of that day: year, month, day, 23:59:59
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
    return dayEnd.getTime() < minBoundary.getTime();
  };

  // Convert current 12-hour selection to 24-hour number
  const getHour24 = (h12: number, period: "AM" | "PM") => {
    if (period === "AM") {
      return h12 === 12 ? 0 : h12;
    } else {
      return h12 === 12 ? 12 : h12 + 12;
    }
  };

  // Check if a specific time option is disabled
  const isTimeOptionDisabled = (h12: number, minStr: string, period: "AM" | "PM") => {
    const minBoundary = getMinBoundary();
    if (!minBoundary || selectedDay === null) return false;

    const candidate = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      getHour24(h12, period),
      parseInt(minStr, 10),
      0,
      0
    );

    return candidate.getTime() < minBoundary.getTime();
  };

  // Calendar Navigation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = () => {
    setShowYearPicker(false);
    setShowMonthPicker(false);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setShowYearPicker(false);
    setShowMonthPicker(false);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
    setActiveTab("time");
  };

  // Current candidate Date from user selection
  const currentCandidateDate = useMemo(() => {
    if (selectedDay === null) return null;
    const h24 = getHour24(selectedHour12, selectedPeriod);
    const m = parseInt(selectedMinute, 10);
    return new Date(selectedYear, selectedMonth, selectedDay, h24, m, 0, 0);
  }, [selectedYear, selectedMonth, selectedDay, selectedHour12, selectedPeriod, selectedMinute]);

  const isCandidateValid = useMemo(() => {
    if (!currentCandidateDate) return false;
    const minBoundary = getMinBoundary();
    if (minBoundary && currentCandidateDate.getTime() < minBoundary.getTime()) {
      return false;
    }
    return true;
  }, [currentCandidateDate, minDateTime]);

  const handleConfirm = () => {
    if (!currentCandidateDate || !isCandidateValid) return;
    const isoString = toLocalIsoString(currentCandidateDate);
    onChange(isoString);
    setIsOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  const yearOptions = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div ref={containerRef} className="relative inline-block w-full text-xs">
      {/* Trigger Button Display */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setShowYearPicker(false);
            setShowMonthPicker(false);
          }
        }}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border bg-white px-2.5 text-xs text-slate-800 shadow-2xs transition-all outline-none",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-slate-200 hover:border-emerald-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20",
          isOpen && !error && "border-emerald-600 ring-2 ring-emerald-600/20",
          disabled && "bg-slate-50 text-slate-400 cursor-not-allowed",
          className
        )}
      >
        <span className={cn("font-medium text-slate-700 truncate", !value && "text-slate-400 font-normal")}>
          {value ? formatDateTimeDisplay(value) : placeholder}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1.5" />
      </button>

      {/* Portal-Rendered Popover Dropdown */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in-50 zoom-in-95 text-xs select-none"
          >
            {/* Header Tabs: Date | Time */}
            <div className="mb-2.5 flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("date")}
                className={cn(
                  "flex-1 py-1 text-center rounded-md transition-all",
                  activeTab === "date"
                    ? "bg-white text-emerald-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Date {selectedDay ? `(${selectedDay} ${MONTH_SHORT[selectedMonth]})` : ""}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("time")}
                className={cn(
                  "flex-1 py-1 text-center rounded-md transition-all flex items-center justify-center gap-1",
                  activeTab === "time"
                    ? "bg-white text-emerald-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Clock className="h-3 w-3" />
                <span>{String(selectedHour12).padStart(2, "0")}:{selectedMinute} {selectedPeriod}</span>
              </button>
            </div>

            {/* TAB 1: DATE PICKER */}
            {activeTab === "date" && (
              <div>
                {/* Month / Year Navigator */}
                <div className="mb-2 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Month Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMonthPicker(!showMonthPicker);
                          setShowYearPicker(false);
                        }}
                        className="flex items-center gap-1 h-6 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500"
                      >
                        <span>{MONTH_NAMES[viewMonth]}</span>
                        <ChevronDown className="h-3 w-3 text-slate-500" />
                      </button>

                      {showMonthPicker && (
                        <div className="absolute left-0 top-full z-20 mt-1 max-h-[110px] w-28 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg space-y-0.5">
                          {MONTH_NAMES.map((m, idx) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setViewMonth(idx);
                                setShowMonthPicker(false);
                              }}
                              className={cn(
                                "w-full text-left rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                                viewMonth === idx
                                  ? "bg-emerald-600 text-white font-bold"
                                  : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Year Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowYearPicker(!showYearPicker);
                          setShowMonthPicker(false);
                        }}
                        className="flex items-center gap-1 h-6 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500"
                      >
                        <span>{viewYear}</span>
                        <ChevronDown className="h-3 w-3 text-slate-500" />
                      </button>

                      {showYearPicker && (
                        <div className="absolute left-0 top-full z-20 mt-1 max-h-[110px] w-20 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg space-y-0.5">
                          {yearOptions.map((y) => (
                            <button
                              key={y}
                              type="button"
                              onClick={() => {
                                setViewYear(y);
                                setShowYearPicker(false);
                              }}
                              className={cn(
                                "w-full text-left rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                                viewYear === y
                                  ? "bg-emerald-600 text-white font-bold"
                                  : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                              )}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-1 text-center">
                  {DAYS_OF_WEEK.map((day) => (
                    <span key={day} className="text-[10px] font-bold uppercase text-slate-400">
                      {day}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <span
                      key={`prev-${i}`}
                      className="flex h-6.5 items-center justify-center text-[10px] text-slate-300 pointer-events-none select-none"
                    >
                      {daysInPrevMonth - firstDayOfMonth + i + 1}
                    </span>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isPast = isDayDisabled(viewYear, viewMonth, day);
                    const isSelected =
                      selectedDay === day &&
                      selectedMonth === viewMonth &&
                      selectedYear === viewYear;

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast}
                        aria-disabled={isPast}
                        onClick={() => handleSelectDay(day)}
                        className={cn(
                          "flex h-6.5 w-6.5 items-center justify-center rounded-md text-xs font-semibold transition-all mx-auto",
                          isSelected
                            ? "bg-emerald-700 text-white font-bold shadow-xs"
                            : isPast
                            ? "text-slate-300 opacity-40 cursor-not-allowed bg-slate-50/50"
                            : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: TIME PICKER */}
            {activeTab === "time" && (
              <div className="space-y-2 py-0.5">
                {/* Period Selector (AM / PM) */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Period</span>
                  <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPeriod("AM")}
                      className={cn(
                        "px-2.5 py-0.5 rounded text-[11px] font-bold transition-all",
                        selectedPeriod === "AM"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPeriod("PM")}
                      className={cn(
                        "px-2.5 py-0.5 rounded text-[11px] font-bold transition-all",
                        selectedPeriod === "PM"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Hour Selection (4x3 compact) */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hour</span>
                  <div className="grid grid-cols-6 gap-1">
                    {HOUR_OPTIONS.map((h) => {
                      const isSelected = selectedHour12 === h;
                      const isHourPast = isTimeOptionDisabled(h, "55", selectedPeriod);

                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={isHourPast}
                          aria-disabled={isHourPast}
                          onClick={() => setSelectedHour12(h)}
                          className={cn(
                            "h-6 rounded-md text-xs font-semibold transition-all text-center",
                            isSelected
                              ? "bg-emerald-700 text-white font-bold shadow-xs"
                              : isHourPast
                              ? "text-slate-300 opacity-40 cursor-not-allowed bg-slate-50"
                              : "border border-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                          )}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minute Selection (4x3 compact) */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Minute</span>
                  <div className="grid grid-cols-6 gap-1">
                    {MINUTE_OPTIONS.map((m) => {
                      const isSelected = selectedMinute === m;
                      const isMinPast = isTimeOptionDisabled(selectedHour12, m, selectedPeriod);

                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={isMinPast}
                          aria-disabled={isMinPast}
                          onClick={() => setSelectedMinute(m)}
                          className={cn(
                            "h-6 rounded-md text-xs font-semibold transition-all text-center",
                            isSelected
                              ? "bg-emerald-700 text-white font-bold shadow-xs"
                              : isMinPast
                              ? "text-slate-300 opacity-40 cursor-not-allowed bg-slate-50"
                              : "border border-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                          )}
                        >
                          :{m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!isCandidateValid && (
                  <p className="text-[10px] font-semibold text-red-500 text-center pt-0.5">
                    Past time is not allowed today.
                  </p>
                )}
              </div>
            )}

            {/* Compact Footer */}
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isCandidateValid || selectedDay === null}
                aria-disabled={!isCandidateValid || selectedDay === null}
                onClick={handleConfirm}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-bold transition-all",
                  isCandidateValid && selectedDay !== null
                    ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
