"use client";

import {
  Armchair,
  Hash,
  LayoutGrid,
  MapPin,
  QrCode,
  Shapes,
  Users,
} from "lucide-react";
import type { ModuleColumn, ModuleRow, ModuleStatusStyle } from "./module-types";
import { ModuleStatusPill } from "./ModuleStatusPill";
import { TableQrPreview } from "./TableQrCard";
import { formatINR } from "@/components/frontoffice/ui";

function formatValue(value: string | number | undefined, format?: "currency" | "percent") {
  if (value === undefined || value === "—") return "—";
  if (format === "currency" && typeof value === "number") return formatINR(value);
  if (format === "percent" && typeof value === "number") return `${value}%`;
  return String(value);
}

function fieldIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes("table")) return Hash;
  if (k.includes("section") || k.includes("outlet") || k.includes("venue")) return MapPin;
  if (k.includes("capacity") || k.includes("cover") || k.includes("pax")) return Users;
  if (k.includes("shape")) return Shapes;
  if (k.includes("qr")) return QrCode;
  if (k.includes("status")) return Armchair;
  return LayoutGrid;
}

export function ModuleRowDetail({
  row,
  columns,
  outletName,
  outletId,
  statusStyle,
  statusMap,
  onQrDownloaded,
}: {
  row: ModuleRow;
  columns: ModuleColumn[];
  outletName?: string;
  outletId?: string;
  statusStyle?: ModuleStatusStyle;
  statusMap?: Record<string, string>;
  onQrDownloaded?: () => void;
}) {
  const isTableRow = Boolean(row.tableNo);
  const detailColumns = columns.filter((c) => c.key !== "qr");
  const qrLinked = String(row.qr ?? "").toLowerCase() === "linked";
  const tableNo = String(row.tableNo ?? row.id);
  const resolvedOutletId = String(row.outletId ?? outletId ?? "outlet");

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-sm">
        <div className="relative p-5">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/90">
                {outletName ?? "Record detail"}
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight">
                {String(row.tableNo ?? row.name ?? row.guestName ?? row.id)}
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                {[row.section, row.shape, row.capacity ? `${row.capacity} seats` : null]
                  .filter(Boolean)
                  .join(" · ") || "Details"}
              </p>
            </div>
            {row.status && (
              <ModuleStatusPill
                status={String(row.status)}
                style={statusStyle}
                statusMap={statusMap}
              />
            )}
          </div>
        </div>
      </div>

      {/* Attribute list — no cards */}
      <div className="divide-y divide-slate-100 border-y border-slate-100">
        {detailColumns.map((col) => {
          const Icon = fieldIcon(col.key);
          const value = row[col.key];
          const isStatus = col.key === "status";

          return (
            <div
              key={col.key}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Icon className="h-3.5 w-3.5 text-emerald-700" />
                <span>{col.header}</span>
              </div>
              <div className="text-right">
                {isStatus && value && !col.render ? (
                  <ModuleStatusPill
                    status={String(value)}
                    style={statusStyle}
                    statusMap={statusMap}
                  />
                ) : col.render ? (
                  <div className="text-sm font-semibold text-slate-900">
                    {col.render(row)}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-900">
                    {formatValue(value, col.format)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR for table records */}
      {isTableRow && (
        <TableQrPreview
          tableNo={tableNo}
          outletId={resolvedOutletId}
          linked={qrLinked || String(row.qr ?? "").length > 0}
          onDownloaded={onQrDownloaded}
        />
      )}
    </div>
  );
}
