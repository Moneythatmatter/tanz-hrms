"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FODatePickerProps {
  value: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function FODatePicker({
  value,
  onChange,
  className,
  placeholder = "DD/MM/YYYY",
}: FODatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date or fallback to today
  const selectedDate = value ? new Date(value) : new Date();
  const validSelected = !isNaN(selectedDate.getTime());

  // View state for calendar navigation
  const [viewYear, setViewYear] = useState(validSelected ? selectedDate.getFullYear() : 2026);
  const [viewMonth, setViewMonth] = useState(validSelected ? selectedDate.getMonth() : 3); // April default

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return "";
    const parts = isoStr.split("-");
    if (parts.length !== 3) return isoStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Calendar Math
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
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const isoString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setIsOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formattedMonth = String(today.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(today.getDate()).padStart(2, "0");
    const isoString = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  // Generate Year options (2020 - 2035)
  const yearOptions = Array.from({ length: 16 }, (_, i) => 2020 + i);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Date Input Button Display */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setShowYearPicker(false);
          setShowMonthPicker(false);
        }}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-2xs transition-all cursor-pointer hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20",
          isOpen && "border-emerald-600 ring-2 ring-emerald-600/20",
          className
        )}
      >
        <span className={cn("font-medium text-slate-700", !value && "text-slate-400")}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1.5" />
      </div>

      {/* Styled Calendar Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in-50 zoom-in-95">
          {/* Header Controls */}
          <div className="mb-3 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Custom Month Dropdown (4 visible items scrollable) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="flex items-center gap-1 h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 hover:border-emerald-500"
                >
                  <span>{MONTH_NAMES[viewMonth]}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>

                {showMonthPicker && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-[110px] w-28 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg space-y-0.5">
                    {MONTH_NAMES.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx);
                          setShowMonthPicker(false);
                        }}
                        className={cn(
                          "w-full text-left rounded px-2 py-1 text-xs font-semibold transition-colors",
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

              {/* Custom Year Dropdown (Max 4 items visible, scrollable) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowYearPicker(!showYearPicker);
                    setShowMonthPicker(false);
                  }}
                  className="flex items-center gap-1 h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 hover:border-emerald-500"
                >
                  <span>{viewYear}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>

                {showYearPicker && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-[110px] w-20 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg space-y-0.5">
                    {yearOptions.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setViewYear(y);
                          setShowYearPicker(false);
                        }}
                        className={cn(
                          "w-full text-left rounded px-2 py-1 text-xs font-semibold transition-colors",
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
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 mb-1 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[10px] font-bold uppercase text-slate-400">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
            {/* Leading empty slots for previous month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <span
                key={`prev-${i}`}
                className="flex h-7 items-center justify-center text-[11px] text-slate-300 pointer-events-none"
              >
                {daysInPrevMonth - firstDayOfMonth + i + 1}
              </span>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const formattedMonth = String(viewMonth + 1).padStart(2, "0");
              const formattedDay = String(day).padStart(2, "0");
              const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
              const isSelected = value === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all mx-auto",
                    isSelected
                      ? "bg-emerald-700 text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-bold text-emerald-700 hover:underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-medium text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
