"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Search,
  TrendingUp,
  User,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrCompensationService } from "@/services/human-resources";
import { cn } from "@/lib/utils";
import {
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHead,
  ListTableHeaderCell,
  ListTableEmptyState,
  ListTableRow,
  ToolbarFilterGroup,
  ToolbarFilterSelect,
} from "@/components/shared/list-table";

const COL_SPAN = 8;

type RevisionRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  department: string;
  designation: string;
  salaryStructureName: string;
  revisionType: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  periodLabel: string;
  oldGross?: number | null;
  newGross: number;
  hikePercentage?: number | null;
  reason?: string;
  status: string;
};

function formatDisplayDate(iso: string) {
  const d = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return iso;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function periodLabel(row: RevisionRow) {
  return (
    row.periodLabel ||
    `${formatDisplayDate(row.effectiveFrom)} → ${
      row.effectiveTo ? formatDisplayDate(row.effectiveTo) : "Present"
    }`
  );
}

function mapRow(raw: Record<string, unknown>): RevisionRow {
  return {
    id: String(raw.id),
    employeeId: String(raw.employeeId ?? raw.employee_id ?? ""),
    employeeName: String(raw.employeeName ?? ""),
    empCode: String(raw.empCode ?? ""),
    department: String(raw.department ?? ""),
    designation: String(raw.designation ?? ""),
    salaryStructureName: String(raw.salaryStructureName ?? ""),
    revisionType: String(raw.revisionType ?? raw.revision_type ?? ""),
    effectiveFrom: String(raw.effectiveFrom ?? raw.effective_from ?? ""),
    effectiveTo: raw.effectiveTo != null ? String(raw.effectiveTo) : null,
    periodLabel: String(raw.periodLabel ?? ""),
    oldGross: raw.oldGross != null ? Number(raw.oldGross) : null,
    newGross: Number(raw.newGross ?? raw.new_gross ?? 0),
    hikePercentage: raw.hikePercentage != null ? Number(raw.hikePercentage) : null,
    reason: String(raw.reason ?? ""),
    status: String(raw.status ?? ""),
  };
}

function StatusPill({ status }: { status: string }) {
  const isPending = status.toLowerCase() === "pending";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        isPending ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800",
      )}
    >
      {status}
    </span>
  );
}

export function CompensationIncrementsView() {
  const [rows, setRows] = useState<RevisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<RevisionRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hrCompensationService.listAllRevisions({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        revisionType: typeFilter !== "all" ? typeFilter : undefined,
        department: departmentFilter !== "all" ? departmentFilter : undefined,
        effectiveFrom: effectiveFrom || undefined,
        effectiveTo: effectiveTo || undefined,
      });
      setRows(data.map((r) => mapRow(r as Record<string, unknown>)));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load increments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, departmentFilter, effectiveFrom, effectiveTo]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!selectedRow) return;
    const updated = rows.find((r) => r.id === selectedRow.id);
    if (updated) setSelectedRow(updated);
  }, [rows, selectedRow?.id]);

  const departments = useMemo(() => {
    const set = new Set(rows.map((r) => r.department).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status.toLowerCase() === "pending").length;
    const approved = rows.filter((r) => r.status.toLowerCase() === "approved").length;
    const increments = rows.filter((r) => r.revisionType.toLowerCase() === "increment").length;
    return { total: rows.length, pending, approved, increments };
  }, [rows]);

  const handleApprove = async (row: RevisionRow) => {
    setApprovingId(row.id);
    try {
      await hrCompensationService.approveRevisionById(row.id, "HR Admin");
      setToastMessage(`Approved increment for ${row.employeeName}.`);
      await load();
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const profileHref = selectedRow
    ? `/human-resources/employees/profile?id=${encodeURIComponent(selectedRow.employeeId)}`
    : "#";

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Salary increments & revisions"
      description="All employee compensation changes — search, filter, and approve pending increments."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HRKPICard
          label="Total records"
          value={String(stats.total)}
          tone="slate"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pending approval"
          value={String(stats.pending)}
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Approved"
          value={String(stats.approved)}
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Increments"
          value={String(stats.increments)}
          tone="purple"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-nowrap">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, code, department, reason…"
            className="h-10 w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <ToolbarFilterGroup>
          <ToolbarFilterSelect
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            defaultValue="all"
            options={[
              { value: "all", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
            ]}
          />
          <ToolbarFilterSelect
            ariaLabel="Filter by type"
            value={typeFilter}
            onChange={setTypeFilter}
            defaultValue="all"
            options={[
              { value: "all", label: "All types" },
              { value: "increment", label: "Increment" },
              { value: "initial", label: "Initial" },
              { value: "promotion", label: "Promotion" },
              { value: "correction", label: "Correction" },
            ]}
          />
          <ToolbarFilterSelect
            ariaLabel="Filter by department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            defaultValue="all"
            searchable
            options={[
              { value: "all", label: "All departments" },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
          />
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            title="Effective from"
            aria-label="Effective from"
            className="h-10 w-[9.5rem] shrink-0 rounded-xl border border-slate-200 px-2 text-xs text-slate-700"
          />
          <input
            type="date"
            value={effectiveTo}
            onChange={(e) => setEffectiveTo(e.target.value)}
            title="Effective to"
            aria-label="Effective to"
            className="h-10 w-[9.5rem] shrink-0 rounded-xl border border-slate-200 px-2 text-xs text-slate-700"
          />
        </ToolbarFilterGroup>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ListTable minWidthClassName="min-w-[960px]" className="md:block">
          <ListTableHead>
            <ListTableHeaderCell>Employee</ListTableHeaderCell>
            <ListTableHeaderCell>Department</ListTableHeaderCell>
            <ListTableHeaderCell>Type</ListTableHeaderCell>
            <ListTableHeaderCell>Effective period</ListTableHeaderCell>
            <ListTableHeaderCell>Gross change</ListTableHeaderCell>
            <ListTableHeaderCell>Structure</ListTableHeaderCell>
            <ListTableHeaderCell>Reason</ListTableHeaderCell>
            <ListTableHeaderCell>Status</ListTableHeaderCell>
          </ListTableHead>
          <ListTableBody>
            {loading ? (
              <ListTableEmptyState colSpan={COL_SPAN} message="Loading compensation revisions…" />
            ) : rows.length === 0 ? (
              <ListTableEmptyState
                colSpan={COL_SPAN}
                message="No compensation revisions match your filters."
              />
            ) : (
              rows.map((row) => (
                <ListTableRow
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  className="cursor-pointer hover:bg-emerald-50/40"
                >
                  <ListTableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{row.employeeName}</p>
                      <p className="text-xs text-slate-500">{row.empCode}</p>
                    </div>
                  </ListTableCell>
                  <ListTableCell>
                    <p className="text-sm text-slate-800">{row.department || "—"}</p>
                    <p className="text-xs text-slate-500">{row.designation}</p>
                  </ListTableCell>
                  <ListTableCell className="capitalize">
                    {row.revisionType.replace(/_/g, " ")}
                  </ListTableCell>
                  <ListTableCell>
                    <p className="text-sm font-medium text-slate-800">{periodLabel(row)}</p>
                  </ListTableCell>
                  <ListTableCell>
                    {row.oldGross != null && row.oldGross > 0 ? (
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatMoney(row.oldGross)}
                        <ArrowRight className="mx-1 inline h-3 w-3" />
                        {formatMoney(row.newGross)}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold tabular-nums">{formatMoney(row.newGross)}</p>
                    )}
                    {row.hikePercentage != null && Number(row.hikePercentage) > 0 && (
                      <p className="text-xs text-emerald-700">+{row.hikePercentage}%</p>
                    )}
                  </ListTableCell>
                  <ListTableCell className="text-sm text-slate-700">
                    {row.salaryStructureName || "—"}
                  </ListTableCell>
                  <ListTableCell className="max-w-[180px] truncate text-sm text-slate-600">
                    {row.reason || "—"}
                  </ListTableCell>
                  <ListTableCell>
                    <StatusPill status={row.status} />
                  </ListTableCell>
                </ListTableRow>
              ))
            )}
          </ListTableBody>
        </ListTable>

        {!loading && rows.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 p-3 md:hidden">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedRow(row)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left text-sm transition hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{row.employeeName}</p>
                    <p className="text-xs text-slate-500">{row.empCode}</p>
                  </div>
                  <StatusPill status={row.status} />
                </div>
                <p className="mt-2 text-xs capitalize text-slate-600">
                  {row.revisionType.replace(/_/g, " ")} · {row.department}
                </p>
                <p className="mt-1 font-medium text-slate-800">{periodLabel(row)}</p>
                <p className="mt-1 font-semibold tabular-nums text-emerald-900">
                  {row.oldGross != null && row.oldGross > 0
                    ? `${formatMoney(row.oldGross)} → ${formatMoney(row.newGross)}`
                    : formatMoney(row.newGross)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Drawer
        isOpen={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        title="Compensation revision"
        icon={<TrendingUp className="h-5 w-5 text-emerald-700" />}
      >
        {selectedRow && (
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{selectedRow.employeeName}</p>
                <p className="text-xs text-slate-500">{selectedRow.empCode}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {selectedRow.department} · {selectedRow.designation}
                </p>
              </div>
              <StatusPill status={selectedRow.status} />
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-3">
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-500">Type</dt>
                <dd className="mt-0.5 capitalize font-semibold text-slate-900">
                  {selectedRow.revisionType.replace(/_/g, " ")}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-500">Effective period</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{periodLabel(selectedRow)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-500">Salary structure</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {selectedRow.salaryStructureName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-500">Hike</dt>
                <dd className="mt-0.5 font-semibold text-emerald-800">
                  {selectedRow.hikePercentage != null && selectedRow.hikePercentage > 0
                    ? `+${selectedRow.hikePercentage}%`
                    : "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Gross salary</dt>
                <dd className="mt-1 text-lg font-black tabular-nums text-slate-900">
                  {selectedRow.oldGross != null && selectedRow.oldGross > 0 ? (
                    <>
                      {formatMoney(selectedRow.oldGross)}
                      <ArrowRight className="mx-2 inline h-4 w-4" />
                      {formatMoney(selectedRow.newGross)}
                    </>
                  ) : (
                    formatMoney(selectedRow.newGross)
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Reason</dt>
                <dd className="mt-0.5 text-slate-800">{selectedRow.reason || "—"}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {selectedRow.status.toLowerCase() === "pending" && (
                <Button
                  type="button"
                  disabled={approvingId === selectedRow.id}
                  onClick={() => void handleApprove(selectedRow)}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  {approvingId === selectedRow.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Approve revision"
                  )}
                </Button>
              )}
              <Link href={profileHref}>
                <Button type="button" variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open employee profile
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
