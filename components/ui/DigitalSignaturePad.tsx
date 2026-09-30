"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, CheckCircle2, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DigitalSignaturePadProps {
  value?: string | null;
  onChange?: (dataUrl: string | null) => void;
  onClear?: () => void;
  label?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  placeholder?: string;
  penColor?: string;
  lineWidth?: number;
  height?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  showClearButton?: boolean;
}

export function DigitalSignaturePad({
  value,
  onChange,
  onClear,
  label = "Digital Signature",
  required = false,
  error,
  helperText,
  placeholder = "Sign here with mouse, touch, or stylus",
  penColor = "#0F8A5F",
  lineWidth = 2.5,
  height = 110,
  disabled = false,
  readOnly = false,
  className,
  showClearButton = true,
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentSignatureRef = useRef<string | null>(value ?? null);
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(value));

  // Helper to render image dataUrl onto canvas
  const renderDataUrl = useCallback((dataUrl: string | null, targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 2;
    const rect = targetCanvas.getBoundingClientRect();
    const displayWidth = rect.width || targetCanvas.width / scale;
    const displayHeight = rect.height || targetCanvas.height / scale;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.restore();

    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.drawImage(img, 0, 0, displayWidth * scale, displayHeight * scale);
        ctx.restore();
        setHasContent(true);
      };
      img.src = dataUrl;
    } else {
      setHasContent(false);
    }
  }, []);

  // Initialize canvas sizing once and on resize only
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const displayWidth = Math.floor(rect.width) || 360;
    const displayHeight = height;

    const scale = window.devicePixelRatio || 2;
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(scale, scale);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    if (currentSignatureRef.current) {
      renderDataUrl(currentSignatureRef.current, canvas);
    }
  }, [height, penColor, lineWidth, renderDataUrl]);

  // Handle mount and window resize
  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas]);

  // Handle external value updates (e.g. form reset to null)
  useEffect(() => {
    if (value !== currentSignatureRef.current) {
      currentSignatureRef.current = value ?? null;
      if (canvasRef.current) {
        renderDataUrl(value ?? null, canvasRef.current);
      }
    }
  }, [value, renderDataUrl]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || readOnly) return;
    const pos = getCoordinates(e);
    if (!pos) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled || readOnly) return;
    const pos = getCoordinates(e);
    if (!pos) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && onChange) {
      const dataUrl = canvas.toDataURL("image/png");
      currentSignatureRef.current = dataUrl;
      onChange(dataUrl);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || readOnly) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
    currentSignatureRef.current = null;
    setHasContent(false);
    if (onChange) onChange(null);
    if (onClear) onClear();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showClearButton) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5 text-emerald-700" />
              <span>{label}</span>
              {required && <span className="text-red-500 font-bold">*</span>}
            </label>
          )}

          <div className="flex items-center gap-2">
            {hasContent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Signed
              </span>
            )}

            {showClearButton && hasContent && !disabled && !readOnly && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <Eraser className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "relative w-full rounded-xl border bg-white overflow-hidden transition-all shadow-2xs",
          error
            ? "border-red-400 ring-1 ring-red-400"
            : isDrawing
              ? "border-emerald-600 ring-1 ring-emerald-500"
              : "border-slate-200 hover:border-slate-300",
          (disabled || readOnly) && "opacity-75 cursor-not-allowed bg-slate-50"
        )}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={cn(
            "w-full block bg-white touch-none select-none",
            disabled || readOnly ? "cursor-not-allowed" : "cursor-crosshair"
          )}
          style={{ height: `${height}px` }}
        />

        {/* Empty placeholder guide */}
        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-3 select-none">
            <span className="text-[11px] font-medium text-slate-400 select-none">
              {placeholder}
            </span>
            <div className="w-2/3 border-b border-dashed border-slate-200 mt-2.5" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-red-500 animate-in fade-in">{error}</p>
      ) : helperText ? (
        <p className="text-[10.5px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
