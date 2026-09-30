"use client";

import type { ModuleColumn, ModuleRow, ModuleStatusStyle } from "./module-types";
import { ModuleStatusPill } from "./ModuleStatusPill";
import { cn } from "@/lib/utils";
import { formatINR } from "@/components/frontoffice/ui";

function formatCell(value: string | number | undefined, format?: "currency" | "percent") {
  if (value === undefined || value === "—") return "—";
  if (format === "currency" && typeof value === "number") return formatINR(value);
  if (format === "percent" && typeof value === "number") return `${value}%`;
  return String(value);
}

export function ModuleDataTable({
  columns,
  rows,
  onRowClick,
  statusStyle = "pill",
  statusMap,
  emptyMessage = "No records match your search or filters.",
  actionColumn,
  renderMobileCard,
  selectedIds,
  onSelectionChange,
  getRowId = (row: any) => String(row.id),
}: {
  columns: ModuleColumn[];
  rows: ModuleRow[] | any[];
  onRowClick?: (row: any) => void;
  statusStyle?: ModuleStatusStyle;
  statusMap?: Record<string, string>;
  emptyMessage?: string;
  /** @deprecated Prefer selection + ModuleSelectionBar */
  actionColumn?: (row: any) => React.ReactNode;
  renderMobileCard?: (row: any) => React.ReactNode;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  getRowId?: (row: any) => string;
}) {
  const selectable = Boolean(selectedIds && onSelectionChange);
  const selected = selectedIds ?? new Set<string>();
  const rowIds = rows.map(getRowId);
  const allSelected = selectable && rows.length > 0 && rowIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(rowIds));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  const primaryKey = columns[0]?.key ?? "id";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const id = getRowId(row);
          return (
            <div
              key={id}
              onClick={() => onRowClick?.(row)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition-colors hover:border-slate-300"
            >
              {selectable && (
                <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => toggleOne(id)}
                    className="rounded border-slate-300"
                    aria-label={`Select ${id}`}
                  />
                </div>
              )}
              {renderMobileCard ? (
                renderMobileCard(row)
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      {columns[0]?.render
                        ? columns[0].render(row)
                        : formatCell(row[primaryKey], columns[0]?.format)}
                    </span>
                    {row.status && (
                      <ModuleStatusPill
                        status={String(row.status)}
                        style={statusStyle}
                        statusMap={statusMap}
                      />
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                    {columns.slice(1, 4).map((col) => (
                      <div key={col.key}>
                        <span className="text-slate-400">{col.header}: </span>
                        {col.render ? col.render(row) : formatCell(row[col.key], col.format)}
                      </div>
                    ))}
                  </div>
                  {actionColumn && <div className="mt-3">{actionColumn(row)}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {actionColumn && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {rows.map((row) => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-slate-50/80",
                    selected.has(id) && "bg-emerald-50/40",
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleOne(id)}
                        className="rounded border-slate-300"
                        aria-label={`Select ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.className,
                      )}
                    >
                      {col.render ? (
                        col.render(row)
                      ) : (col.key === "status" || col.key === "bookingStatus") &&
                        row[col.key] ? (
                        <ModuleStatusPill
                          status={String(row[col.key])}
                          style={statusStyle}
                          statusMap={statusMap}
                        />
                      ) : (
                        <span className={cn(idx === 0 && "font-medium text-slate-900")}>
                          {formatCell(row[col.key], col.format)}
                        </span>
                      )}
                    </td>
                  ))}
                  {actionColumn && (
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {actionColumn(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
