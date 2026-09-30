"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function buildTableQrUrl(outletId: string, tableNo: string) {
  const base =
    typeof window !== "undefined" ? window.location.origin : "https://pms.local";
  return `${base}/guest/menu?outlet=${encodeURIComponent(outletId)}&table=${encodeURIComponent(tableNo)}`;
}

async function toQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/** Compact QR preview for detail drawers */
export function TableQrPreview({
  tableNo,
  outletId,
  linked = true,
  onDownloaded,
}: {
  tableNo: string;
  outletId: string;
  linked?: boolean;
  onDownloaded?: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const payload = buildTableQrUrl(outletId, tableNo);

  useEffect(() => {
    let cancelled = false;
    toQrDataUrl(payload).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Table QR
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {linked ? "Linked · ready to print" : "Pending link"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            linked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
          )}
        >
          {linked ? "Linked" : "Pending"}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR for ${tableNo}`}
              className="h-44 w-44 object-contain"
            />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center text-slate-300">
              <QrCode className="h-10 w-10" />
            </div>
          )}
        </div>
        <p className="mt-3 max-w-[260px] text-center text-[11px] leading-relaxed text-slate-500">
          Guests scan this code to open the menu for <span className="font-medium text-slate-700">{tableNo}</span>.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-3 gap-1.5 bg-emerald-700 hover:bg-emerald-800"
          disabled={!dataUrl}
          onClick={() => {
            if (!dataUrl) return;
            downloadDataUrl(dataUrl, `${outletId}-${tableNo}-qr.png`);
            onDownloaded?.();
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download PNG
        </Button>
      </div>
    </div>
  );
}

interface TableQrCardProps {
  tableNo: string;
  section?: string;
  outletId: string;
  outletName: string;
  linked: boolean;
  onLink?: () => void;
  onDownloaded?: () => void;
}

export function TableQrCard({
  tableNo,
  section,
  outletId,
  outletName,
  linked,
  onLink,
  onDownloaded,
}: TableQrCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const payload = buildTableQrUrl(outletId, tableNo);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    toQrDataUrl(payload)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  const handleDownload = () => {
    if (!dataUrl) return;
    downloadDataUrl(dataUrl, `${outletId}-${tableNo}-qr.png`);
    onDownloaded?.();
  };

  return (
    <li className="rounded-xl border border-slate-200 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
            title="View QR"
          >
            {loading || !dataUrl ? (
              <QrCode className="h-5 w-5 text-emerald-700" />
            ) : (
              <img src={dataUrl} alt={`QR for ${tableNo}`} className="h-full w-full object-contain p-1" />
            )}
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900">{tableNo}</p>
            <p className="text-xs text-slate-500">
              {section ?? "—"} · {outletName}
            </p>
            <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-slate-400" title={payload}>
              {payload}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              linked ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
            )}
          >
            {linked ? "Linked" : "Pending"}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide" : "View"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!dataUrl}
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          {!linked && onLink && (
            <Button type="button" size="sm" onClick={onLink}>
              Link QR
            </Button>
          )}
        </div>
      </div>

      {expanded && dataUrl && (
        <div className="mt-3 flex flex-col items-center rounded-xl bg-slate-50 p-4">
          <img
            src={dataUrl}
            alt={`QR code ${tableNo}`}
            className="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2"
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            Print this QR and place it on {tableNo}. Guests scan to open the table menu.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3 gap-1.5 bg-emerald-700 hover:bg-emerald-800"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download QR image
          </Button>
        </div>
      )}
    </li>
  );
}

export async function downloadAllTableQrs(
  tables: { tableNo: string; outletId: string }[],
) {
  for (const table of tables) {
    const payload = buildTableQrUrl(table.outletId, table.tableNo);
    const dataUrl = await toQrDataUrl(payload);
    downloadDataUrl(dataUrl, `${table.outletId}-${table.tableNo}-qr.png`);
    await new Promise((r) => setTimeout(r, 120));
  }
}
