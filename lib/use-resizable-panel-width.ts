"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH_PRESETS: Record<string, number> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 672,
  "2xl": 896,
  "3xl": 1152,
};

const STORAGE_KEY = "pms-side-drawer-width";
const MIN_DRAWER_WIDTH = 360;
const MAX_SCREEN_RATIO = 0.6;

export function getMaxDrawerWidth(viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200) {
  return Math.round(viewportWidth * MAX_SCREEN_RATIO);
}

export function resolveDrawerWidth(width?: string): number {
  const max = getMaxDrawerWidth();
  if (!width || width === "responsive") {
    return Math.min(Math.round(max * 0.85), max);
  }
  if (WIDTH_PRESETS[width]) return Math.min(WIDTH_PRESETS[width], max);
  const pxMatch = width.match(/^(\d+)px$/);
  if (pxMatch) return Math.min(Number(pxMatch[1]), max);
  return Math.min(WIDTH_PRESETS.lg, max);
}

function clampWidth(width: number, min: number, max: number) {
  return Math.min(max, Math.max(min, width));
}

function readStoredWidth(min: number, max: number): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return clampWidth(parsed, min, max);
  } catch {
    return null;
  }
}

function writeStoredWidth(width: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
  } catch {
    // ignore quota / private mode
  }
}

function resolveInitialWidth(widthKey?: string) {
  const max = getMaxDrawerWidth();
  const stored = readStoredWidth(MIN_DRAWER_WIDTH, max);
  if (stored != null) return stored;
  return clampWidth(resolveDrawerWidth(widthKey), MIN_DRAWER_WIDTH, max);
}

type UseResizablePanelWidthOptions = {
  min?: number;
  max?: number;
  enabled?: boolean;
};

export function useResizablePanelWidth(
  open: boolean,
  widthKey?: string,
  options: UseResizablePanelWidthOptions = {},
) {
  const min = options.min ?? MIN_DRAWER_WIDTH;
  const enabled = options.enabled ?? true;
  const [panelWidth, setPanelWidth] = useState(() => resolveInitialWidth(widthKey));
  const [isResizing, setIsResizing] = useState(false);
  const panelWidthRef = useRef(panelWidth);

  const getMax = useCallback(
    () => options.max ?? getMaxDrawerWidth(),
    [options.max],
  );

  useEffect(() => {
    panelWidthRef.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    if (!open) return;
    const max = getMax();
    const stored = readStoredWidth(min, max);
    const next = stored ?? clampWidth(resolveDrawerWidth(widthKey), min, max);
    setPanelWidth(next);
    panelWidthRef.current = next;
  }, [open, widthKey, min, getMax]);

  useEffect(() => {
    if (!enabled) return;

    const onWindowResize = () => {
      const max = getMax();
      setPanelWidth((current) => {
        const next = clampWidth(current, min, max);
        if (next !== current) writeStoredWidth(next);
        panelWidthRef.current = next;
        return next;
      });
    };

    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, [enabled, min, getMax]);

  const onResizeStart = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled) return;
      event.preventDefault();
      setIsResizing(true);

      const startX = event.clientX;
      const startWidth = panelWidthRef.current;

      const onMove = (moveEvent: MouseEvent) => {
        const max = getMax();
        const delta = startX - moveEvent.clientX;
        const next = clampWidth(startWidth + delta, min, max);
        panelWidthRef.current = next;
        setPanelWidth(next);
      };

      const onUp = () => {
        setIsResizing(false);
        writeStoredWidth(panelWidthRef.current);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [enabled, min, getMax],
  );

  return { panelWidth, onResizeStart, isResizing, resizable: enabled };
}
