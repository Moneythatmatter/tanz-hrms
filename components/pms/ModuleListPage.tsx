"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import { useEffect, useMemo, useState } from "react";
import { Download, Map, Pencil, Table2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  ConfirmModal,
  FormField,
  SelectInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import { cn } from "@/lib/utils";
import type { ModuleColumn, ModuleListDefinition, ModuleRow } from "./module-types";
import { ModulePageShell } from "./ModulePageShell";
import { ModuleDataTable } from "./ModuleDataTable";
import { ModuleSelectionBar } from "./ModuleSelectionBar";
import { downloadAllTableQrs, TableQrCard } from "./TableQrCard";
import { ModuleRowDetail } from "./ModuleRowDetail";

type ActionKind =
  | "add"
  | "merge"
  | "split"
  | "map"
  | "qr"
  | "close-shift"
  | "open-shift"
  | "report"
  | "generic";

function previewTitle(row: ModuleRow, fallback: string) {
  return String(
    row.name ??
      row.guest ??
      row.guestName ??
      row.event ??
      row.tableNo ??
      row.bookingNo ??
      row.billNo ??
      row.orderNo ??
      row.item ??
      row.cashier ??
      row.recipe ??
      row.outlet ??
      row.requisitionNo ??
      row.poNo ??
      row.id ??
      fallback,
  );
}

function classifyAction(label: string): ActionKind {
  const l = label.toLowerCase();
  if (l.includes("merge")) return "merge";
  if (l.includes("split")) return "split";
  if (l.includes("map") || l.includes("floor")) return "map";
  if (l.includes("qr")) return "qr";
  if (l.includes("close shift") || l === "close shift") return "close-shift";
  if (l.includes("open shift") || l === "open shift") return "open-shift";
  if (l.includes("report") || l.includes("cash report")) return "report";
  if (
    l.startsWith("add ") ||
    l.startsWith("new ") ||
    l.startsWith("create ") ||
    l.startsWith("log ") ||
    l.startsWith("start ") ||
    l.startsWith("post ") ||
    l.startsWith("run ")
  ) {
    return "add";
  }
  return "generic";
}

function editableColumns(columns: ModuleColumn[]) {
  return columns.filter((c) => c.key !== "id");
}

function blankForm(columns: ModuleColumn[]): Record<string, string> {
  const form: Record<string, string> = {};
  for (const col of editableColumns(columns)) {
    if (col.inputType === "select" || (col.options && col.options.length > 0)) {
      const first = col.options?.[0];
      form[col.key] =
        typeof first === "string" ? first : first?.value ?? (col.key === "status" ? "Available" : "");
    } else if (col.key === "status") {
      form[col.key] = "Available";
    } else {
      form[col.key] = "";
    }
  }
  return form;
}

function downloadCsv(filename: string, columns: ModuleColumn[], rows: ModuleRow[]) {
  const header = columns.map((c) => c.header).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = row[c.key];
          const value = raw === undefined ? "" : String(raw);
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([[header, body].filter(Boolean).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pickDefaultOutlet(
  outlets: { id: string; name: string }[],
  rows: ModuleRow[],
): string {
  if (!outlets.length) return "all";
  const withRows = outlets.find((o) =>
    rows.some((r) => r.outletId === o.id),
  );
  return withRows?.id ?? outlets[0].id;
}

export function ModuleListPage({
  definition,
  charts,
  statusMap,
  onPrimaryAction,
  showExport = true,
}: {
  definition: ModuleListDefinition;
  charts?: React.ReactNode;
  statusMap?: Record<string, string>;
  onPrimaryAction?: () => void;
  showExport?: boolean;
}) {
  const outlets = definition.outlets ?? [];
  const showOutlet = outlets.length > 0;
  const [outletId, setOutletId] = useState(() =>
    pickDefaultOutlet(outlets, definition.rows),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState(definition.sortOptions?.[0]?.value ?? "");
  const [rows, setRows] = useState<ModuleRow[]>(definition.rows);
  const [preview, setPreview] = useState<ModuleRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<ModuleRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ModuleRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() => blankForm(definition.columns));
  const [selectA, setSelectA] = useState("");
  const [selectB, setSelectB] = useState("");
  const [mergeTableNo, setMergeTableNo] = useState("");

  useEffect(() => {
    setRows(definition.rows);
    setForm(blankForm(definition.columns));
    setOutletId(pickDefaultOutlet(definition.outlets ?? [], definition.rows));
    setStatusFilter("all");
    setSortBy(definition.sortOptions?.[0]?.value ?? "");
    setActionLabel(null);
    setEditingRow(null);
    setDeleteRow(null);
    setPreview(null);
  }, [definition]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filterKeys = definition.filterKeys ?? [
      "status",
      "type",
      "mode",
      "group",
      "band",
      "shift",
      "segment",
    ];

    let list = rows.filter((row) => {
      if (showOutlet && row.outletId && row.outletId !== outletId) return false;
      if (statusFilter !== "all") {
        const matches = filterKeys.some((key) => String(row[key] ?? "") === statusFilter);
        if (!matches) return false;
      }
      if (!q) return true;
      return Object.values(row).some(
        (v) => v !== undefined && String(v).toLowerCase().includes(q),
      );
    });

    if (sortBy && definition.sortOptions?.length) {
      list = [...list].sort((a, b) => {
        if (sortBy.endsWith("-desc")) {
          const key = sortBy.replace(/-desc$/, "");
          return Number(b[key] ?? 0) - Number(a[key] ?? 0);
        }
        const av = a[sortBy] ?? a.guestName ?? a.name ?? a.tableNo ?? "";
        const bv = b[sortBy] ?? b.guestName ?? b.name ?? b.tableNo ?? "";
        return String(av).localeCompare(String(bv), undefined, { numeric: true });
      });
    }

    return list;
  }, [
    rows,
    definition.filterKeys,
    definition.sortOptions,
    search,
    statusFilter,
    showOutlet,
    outletId,
    sortBy,
  ]);

  const selectedOutlet = outlets.find((o) => o.id === outletId);
  const scopedRows = rows.filter(
    (r) => !showOutlet || !r.outletId || r.outletId === outletId,
  );
  const scopedTotal = scopedRows.length;

  const tableOpsRows = useMemo(() => {
    const inventory = definition.tableInventory;
    const source =
      inventory && inventory.length > 0
        ? inventory
        : scopedRows.filter((r) => r.tableNo !== undefined);
    return source.filter(
      (r) => !showOutlet || !r.outletId || r.outletId === outletId,
    );
  }, [definition.tableInventory, scopedRows, showOutlet, outletId]);

  const formTableInventory = useMemo(() => {
    if (definition.tableInventory && definition.tableInventory.length > 0) {
      return definition.tableInventory;
    }
    return tableOpsRows;
  }, [definition.tableInventory, tableOpsRows]);

  const reservationCapacityCheck = useMemo(() => {
    const covers = Number(form.covers ?? 0);
    const primaryNo = String(form.tableNo ?? "").trim();
    if (!covers || !primaryNo || !Number.isFinite(covers)) {
      return {
        needsMerge: false,
        primaryCap: 0,
        combinedCap: 0,
        covers: 0,
        tables: [] as ModuleRow[],
      };
    }
    const formOutlet = String(form.outletId ?? outletId ?? "").trim();
    const tables = formTableInventory.filter(
      (t) => !formOutlet || !t.outletId || String(t.outletId) === formOutlet,
    );
    const primary = tables.find((t) => String(t.tableNo) === primaryNo);
    const primaryCap = Number(primary?.capacity ?? 0);
    const merge = tables.find((t) => String(t.tableNo) === mergeTableNo);
    const mergeCap = Number(merge?.capacity ?? 0);
    const combinedCap = primaryCap + (mergeTableNo ? mergeCap : 0);
    return {
      needsMerge: primaryCap > 0 && covers > primaryCap,
      primaryCap,
      combinedCap,
      covers,
      tables,
    };
  }, [form.covers, form.tableNo, form.outletId, outletId, formTableInventory, mergeTableNo]);

  const tableNoInUseMessage = useMemo(() => {
    const typed = String(form.tableNo ?? "").trim().toLowerCase();
    if (!typed) return null;
    const formOutlet = String(form.outletId ?? outletId ?? "").trim();
    const taken = rows.some((r) => {
      if (editingRow && r.id === editingRow.id) return false;
      const sameNo = String(r.tableNo ?? "").trim().toLowerCase() === typed;
      if (!sameNo) return false;
      if (!formOutlet) return true;
      return !r.outletId || String(r.outletId) === formOutlet;
    });
    return taken ? "This table number is already used for the selected outlet." : null;
  }, [form.tableNo, form.outletId, outletId, rows, editingRow]);

  const liveStats = useMemo(() => {
    // Recompute common status-style stats for the selected outlet scope
    const byStatus = (status: string) =>
      scopedRows.filter((r) => String(r.status ?? "") === status).length;

    return definition.stats.map((stat) => {
      const label = stat.label.toLowerCase();
      if (label === "tables" || label === "total" || label === "records") {
        return { ...stat, value: scopedTotal };
      }
      if (label === "available") return { ...stat, value: byStatus("Available") };
      if (label === "occupied") return { ...stat, value: byStatus("Occupied") };
      if (label === "reserved") return { ...stat, value: byStatus("Reserved") };
      if (label === "billing") return { ...stat, value: byStatus("Billing") };
      if (label === "open" || label === "open shifts") return { ...stat, value: byStatus("Open") };
      if (label === "closed") return { ...stat, value: byStatus("Closed") };
      if (label === "pending") return { ...stat, value: byStatus("Pending") };
      if (label === "active") return { ...stat, value: byStatus("Active") };
      return stat;
    });
  }, [definition.stats, scopedRows, scopedTotal]);

  const eyebrow =
    definition.eyebrow ??
    (selectedOutlet ? `Food & Beverages · ${selectedOutlet.name}` : undefined);

  const actionKind = actionLabel ? classifyAction(actionLabel) : null;

  const openAction = (label: string) => {
    setEditingRow(null);
    setActionLabel(label);
    setFormError(null);
    const next = blankForm(definition.columns);
    if (showOutlet && outletId) {
      next.outletId = outletId;
    }
    if (!next.resNo && definition.columns.some((c) => c.key === "resNo")) {
      next.resNo = `TR-${Date.now().toString().slice(-4)}`;
    }
    if (!next.status && definition.filterOptions?.length) {
      const first = definition.filterOptions.find((o) => o.id !== "all");
      if (first) next.status = first.id;
    }
    setForm(next);
    setSelectA("");
    setSelectB("");
    setMergeTableNo("");
  };

  const closeFormDrawer = () => {
    setActionLabel(null);
    setEditingRow(null);
    setFormError(null);
  };

  const handleExport = () => {
    const slug = definition.title.toLowerCase().replace(/\s+/g, "-");
    downloadCsv(`${slug}-export.csv`, definition.columns, filtered);
    setToast(`Exported ${filtered.length} ${definition.title.toLowerCase()} record(s).`);
  };

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
      return;
    }
    if (definition.actionLabel) openAction(definition.actionLabel);
  };

  const buildRowFromForm = (base?: ModuleRow): ModuleRow => {
    const nextId = base?.id ?? crypto.randomUUID();
    const formOutletId = String(form.outletId ?? "").trim();
    const newRow: ModuleRow = {
      id: nextId,
      outletId:
        formOutletId ||
        base?.outletId ||
        (showOutlet ? outletId : undefined),
    };

    for (const col of editableColumns(definition.columns)) {
      if (col.key === "outletId") continue;
      const raw = form[col.key]?.trim() ?? "";
      const isCurrency =
        col.inputType === "currency" || col.format === "currency" || col.key === "sales";
      const isNumber =
        col.inputType === "number" ||
        ["tables", "covers", "capacity", "count", "quantity"].includes(col.key);

      if (isCurrency) {
        const cleaned = raw.replace(/[^\d.]/g, "");
        const num = Number(cleaned);
        newRow[col.key] =
          !isNaN(num) && cleaned !== "" ? formatMoney(num) : raw || formatMoney(0);
      } else if (isNumber) {
        const num = Number(raw);
        newRow[col.key] = Number.isFinite(num) && raw !== "" ? num : 0;
      } else {
        newRow[col.key] = raw || (col.key === "status" ? "Active" : "—");
      }
    }

    // Keep section non-null for older DB rows; store outlet name when available
    if (newRow.section === undefined || newRow.section === "—") {
      const outletName = outlets.find((o) => o.id === newRow.outletId)?.name;
      newRow.section = outletName ?? "";
    }

    return newRow;
  };

  const openEdit = (row: ModuleRow) => {
    const nextForm = blankForm(definition.columns);
    for (const col of editableColumns(definition.columns)) {
      nextForm[col.key] = row[col.key] === undefined ? "" : String(row[col.key]);
    }
    setForm(nextForm);
    setEditingRow(row);
    setPreview(null);
    setFormError(null);
    setActionLabel(`Edit ${definition.title.replace(/s$/, "")}`);
  };

  const submitAdd = async () => {
    setFormError(null);
    const cols = editableColumns(definition.columns);

    for (const col of cols) {
      const isRequired =
        col.required ?? (col.key !== "status" && col.key !== "covers" && col.key !== "sales");
      const raw = String(form[col.key] ?? "").trim();
      if (isRequired && !raw) {
        setFormError(`Please fill in ${col.header}.`);
        return;
      }

      const isSelect =
        col.inputType === "select" ||
        col.inputType === "searchSelect" ||
        col.key === "outletId" ||
        (col.options !== undefined && col.options.length > 0);
      if (isSelect && raw !== "" && col.key === "outletId" && outlets.length > 0) {
        if (!outlets.some((o) => o.id === raw)) {
          setFormError("Please select a valid outlet.");
          return;
        }
      } else if (isSelect && raw !== "" && col.key === "tableNo" && definition.title !== "Tables") {
        const inventory =
          definition.tableInventory && definition.tableInventory.length > 0
            ? definition.tableInventory
            : tableOpsRows;
        const formOutlet = String(form.outletId ?? outletId ?? "").trim();
        const allowed = inventory.filter(
          (t) => !formOutlet || !t.outletId || String(t.outletId) === formOutlet,
        );
        if (allowed.length > 0 && !allowed.some((t) => String(t.tableNo) === raw)) {
          setFormError("Please select a valid table for the chosen outlet.");
          return;
        }
      } else if (isSelect && raw !== "" && col.options?.length) {
        const allowed = col.options.map((opt) =>
          typeof opt === "string" ? opt : opt.value,
        );
        if (!allowed.includes(raw)) {
          setFormError(`${col.header} must be one of: ${allowed.join(", ")}.`);
          return;
        }
      }

      if (col.pattern && raw !== "") {
        try {
          const re = new RegExp(col.pattern);
          if (!re.test(raw.replace(/\s+/g, ""))) {
            setFormError(col.patternMessage ?? `${col.header} format is invalid.`);
            return;
          }
        } catch {
          /* ignore bad pattern */
        }
      }

      if (
        (col.inputType === "tel" || col.key === "phone") &&
        raw !== "" &&
        !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(raw.replace(/\s+/g, ""))
      ) {
        setFormError(col.patternMessage ?? "Enter a valid 10-digit mobile number.");
        return;
      }

      if (col.inputType === "time" && raw !== "" && !/^\d{2}:\d{2}$/.test(raw)) {
        setFormError(`${col.header} must be a valid time.`);
        return;
      }

      const isDate =
        col.inputType === "date" ||
        (col.key === "date" && definition.title === "Bookings") ||
        col.key === "eventDate";
      if (isDate && raw !== "") {
        const todayISO = new Date().toLocaleDateString("sv-SE");
        if (raw < todayISO) {
          setFormError(`${col.header} cannot be a past date.`);
          return;
        }
      }

      const isNumber =
        col.inputType === "number" ||
        col.inputType === "currency" ||
        col.format === "currency" ||
        ["tables", "covers", "capacity", "count", "quantity"].includes(col.key);

      if (isNumber && raw !== "") {
        const isCurrency =
          col.inputType === "currency" || col.format === "currency" || col.key === "sales";
        const cleaned = isCurrency ? raw.replace(/[^\d.]/g, "") : raw;
        const num = Number(cleaned);
        if (cleaned === "" || isNaN(num)) {
          setFormError(`${col.header} must be a valid number.`);
          return;
        }
        if (!isCurrency && !/^\d+(\.\d+)?$/.test(cleaned.trim())) {
          setFormError(`${col.header} must be a numeric value only.`);
          return;
        }
        if (!isCurrency && col.step !== "any" && !Number.isInteger(num)) {
          setFormError(`${col.header} must be a whole number.`);
          return;
        }
        if (num < (col.min ?? 0)) {
          setFormError(`${col.header} must be at least ${col.min ?? 0}.`);
          return;
        }
        if (col.max !== undefined && num > col.max) {
          setFormError(`${col.header} cannot exceed ${col.max}.`);
          return;
        }
      }
    }

    const payload = buildRowFromForm(editingRow ?? undefined);
    if (tableNoInUseMessage) {
      setFormError(tableNoInUseMessage);
      return;
    }

    if (reservationCapacityCheck.needsMerge) {
      if (!mergeTableNo) {
        setFormError(
          `Covers (${reservationCapacityCheck.covers}) exceed table capacity (${reservationCapacityCheck.primaryCap}). Select a table to merge.`,
        );
        return;
      }
      if (reservationCapacityCheck.combinedCap < reservationCapacityCheck.covers) {
        setFormError(
          `Merged capacity (${reservationCapacityCheck.combinedCap}) is still less than covers (${reservationCapacityCheck.covers}). Pick a larger table.`,
        );
        return;
      }
      const primary = String(form.tableNo ?? "").trim();
      payload.tableNo = `${primary}+${mergeTableNo}`;
    }

    setSaving(true);
    try {
      if (editingRow && definition.crud?.update) {
        const saved = await definition.crud.update(editingRow.id, payload);
        setRows((prev) => prev.map((r) => (r.id === editingRow.id ? { ...r, ...saved } : r)));
        setToast("Record updated.");
      } else if (editingRow) {
        setRows((prev) =>
          prev.map((r) => (r.id === editingRow.id ? { ...r, ...payload, id: editingRow.id } : r)),
        );
        setToast("Record updated.");
      } else if (definition.crud?.create) {
        const saved = await definition.crud.create(payload);
        setRows((prev) => [saved, ...prev]);
        setToast(`${definition.actionLabel ?? "Record"} saved.`);
      } else {
        setRows((prev) => [payload, ...prev]);
        setToast(`${definition.actionLabel ?? "Record"} saved.`);
      }
      setActionLabel(null);
      setEditingRow(null);
      setFormError(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      if (definition.crud?.remove) {
        await definition.crud.remove(deleteRow.id);
      }
      setRows((prev) => prev.filter((r) => r.id !== deleteRow.id));
      setToast("Record deleted.");
      setDeleteRow(null);
      setPreview(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const submitMerge = async () => {
    setFormError(null);
    if (!selectA || !selectB || selectA === selectB) {
      setFormError("Select two different tables to merge.");
      return;
    }
    const a = tableOpsRows.find((r) => r.id === selectA);
    const b = tableOpsRows.find((r) => r.id === selectB);
    if (!a || !b) return;

    const mergedCapacity = Number(a.capacity ?? 0) + Number(b.capacity ?? 0);
    const merged: ModuleRow = {
      ...a,
      id: crypto.randomUUID(),
      tableNo: `${a.tableNo}+${b.tableNo}`,
      capacity: mergedCapacity || a.capacity,
      shape: "Merged",
      status: "Available",
      section: a.section ?? b.section,
      qr: "Pending",
      outletId: a.outletId ?? outletId,
    };

    const persist = definition.tableCrud ?? definition.crud;
    setSaving(true);
    try {
      if (persist?.create) await persist.create(merged);
      if (persist?.remove) {
        await persist.remove(selectA);
        await persist.remove(selectB);
      }
      if (!definition.tableInventory) {
        setRows((prev) => [
          merged,
          ...prev.filter((r) => r.id !== selectA && r.id !== selectB),
        ]);
      }
      setActionLabel(null);
      setFormError(null);
      setToast(`Merged ${a.tableNo} + ${b.tableNo} into ${merged.tableNo}.`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setSaving(false);
    }
  };

  const submitSplit = async () => {
    setFormError(null);
    if (!selectA) {
      setFormError("Select a table to split.");
      return;
    }
    const source = tableOpsRows.find((r) => r.id === selectA);
    if (!source) return;
    const capacity = Number(source.capacity ?? 4);
    if (capacity < 4) {
      setFormError("Only tables with capacity 4+ can be split.");
      return;
    }

    const half = Math.floor(capacity / 2);
    const base = String(source.tableNo ?? "T");
    const left: ModuleRow = {
      ...source,
      id: crypto.randomUUID(),
      tableNo: `${base}A`,
      capacity: half,
      shape: "Square",
      status: "Available",
      qr: "Pending",
    };
    const right: ModuleRow = {
      ...source,
      id: crypto.randomUUID(),
      tableNo: `${base}B`,
      capacity: capacity - half,
      shape: "Square",
      status: "Available",
      qr: "Pending",
    };

    const persist = definition.tableCrud ?? definition.crud;
    setSaving(true);
    try {
      if (persist?.create) {
        await persist.create(left);
        await persist.create(right);
      }
      if (persist?.remove) await persist.remove(selectA);
      if (!definition.tableInventory) {
        setRows((prev) => [left, right, ...prev.filter((r) => r.id !== selectA)]);
      }
      setActionLabel(null);
      setFormError(null);
      setToast(`Split ${source.tableNo} into ${left.tableNo} and ${right.tableNo}.`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Split failed");
    } finally {
      setSaving(false);
    }
  };

  const markAllQrLinked = () => {
    setRows((prev) =>
      prev.map((row) => {
        if (showOutlet && row.outletId && row.outletId !== outletId) return row;
        if (String(row.qr ?? "").toLowerCase() === "pending") {
          return { ...row, qr: "Linked" };
        }
        return row;
      }),
    );
    setToast("Pending QR codes marked as Linked.");
  };

  const linkOneQr = (id: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, qr: "Linked" } : row)),
    );
    setToast("QR linked for table.");
  };

  const closeOpenShifts = () => {
    const openCount = scopedRows.filter((r) => r.status === "Open").length;
    setRows((prev) =>
      prev.map((row) => {
        if (showOutlet && row.outletId && row.outletId !== outletId) return row;
        if (row.status === "Open") {
          return {
            ...row,
            status: "Closed",
            declared: row.sales ?? row.declared ?? "—",
          };
        }
        return row;
      }),
    );
    setActionLabel(null);
    setToast(
      openCount
        ? `Closed ${openCount} open shift(s) for ${selectedOutlet?.name ?? "outlet"}.`
        : "No open shifts to close.",
    );
  };

  const openNewShift = () => {
    const nextId = crypto.randomUUID();
    const shift: ModuleRow = {
      id: nextId,
      cashier: "Front Cashier",
      shift: "Current",
      openedAt: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      openingFloat: "TSh 2,000",
      sales: "TSh 0",
      declared: "—",
      status: "Open",
      outletId: showOutlet ? outletId : undefined,
    };
    setRows((prev) => [shift, ...prev]);
    setActionLabel(null);
    setToast("New cashier shift opened.");
  };

  const firstSelected = filtered.find((row) => selectedIds.has(String(row.id)));

  const tableBlock = (
    <>
      <p className="mb-3 text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{filtered.length}</span> of {scopedTotal}{" "}
        records
        {selectedOutlet ? ` · ${selectedOutlet.name}` : ""}
      </p>
      <ModuleDataTable
        columns={definition.columns}
        rows={filtered}
        onRowClick={setPreview}
        statusStyle={definition.statusStyle}
        statusMap={statusMap}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </>
  );

  return (
    <>
      <ModulePageShell
        toast={toast}
        onDismissToast={() => setToast(null)}
        eyebrow={eyebrow ?? "Front Office"}
        title={definition.title}
        description={definition.description}
        primaryAction={
          definition.actionLabel
            ? {
                label: definition.actionLabel,
                onClick: handlePrimary,
              }
            : undefined
        }
        secondaryActions={
          <>
            {showExport && (
              <Button type="button" size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
            {definition.secondaryActions?.map((label) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openAction(label)}
              >
                {label}
              </Button>
            ))}
          </>
        }
        stats={liveStats}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={definition.searchPlaceholder}
        filterPills={
          definition.filterOptions
            ? {
                active: statusFilter,
                onChange: setStatusFilter,
                options: definition.filterOptions,
              }
            : undefined
        }
        sort={
          definition.sortOptions?.length
            ? {
                value: sortBy,
                onChange: setSortBy,
                options: definition.sortOptions,
              }
            : undefined
        }
        resultCount={{ shown: filtered.length, total: scopedTotal }}
        hasActiveAdvancedFilters={
          !!definition.sortOptions?.length && sortBy !== definition.sortOptions[0]?.value
        }
        onClearAdvancedFilters={() => setSortBy(definition.sortOptions?.[0]?.value ?? "")}
        beforeFilters={
          showOutlet ? (
            <SelectInput
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="h-10 w-full min-w-[10.5rem] shrink-0 sm:w-auto sm:max-w-[14rem]"
              aria-label={definition.outletLabel ?? "Outlet"}
            >
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </SelectInput>
          ) : undefined
        }
        aboveTable={charts}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="record"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  if (firstSelected) setPreview(firstSelected);
                },
              },
              {
                label: "Edit",
                onClick: () => {
                  if (firstSelected) openEdit(firstSelected);
                },
              },
              {
                label: "Delete",
                variant: "danger",
                onClick: () => {
                  if (firstSelected) setDeleteRow(firstSelected);
                },
              },
            ]}
          />
        }
      >
        {tableBlock}
      </ModulePageShell>

      {/* Row preview */}
      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? previewTitle(preview, definition.title) : ""}
        description={selectedOutlet?.name ?? definition.title}
        width="md"
        footer={
          preview ? (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setDeleteRow(preview)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => openEdit(preview)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          ) : undefined
        }
      >
        {preview && (
          <ModuleRowDetail
            row={preview}
            columns={definition.columns}
            outletName={selectedOutlet?.name ?? definition.title}
            outletId={String(preview.outletId ?? outletId)}
            statusStyle={definition.statusStyle}
            statusMap={statusMap}
            onQrDownloaded={() =>
              setToast(`Downloaded QR for ${String(preview.tableNo ?? preview.id)}.`)
            }
          />
        )}
      </Drawer>

      <ConfirmModal
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        title="Delete record?"
        message={
          deleteRow
            ? `Delete “${previewTitle(deleteRow, "this record")}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
        onConfirm={confirmDelete}
      />

      {/* Header action drawer */}
      <Drawer
        open={!!actionLabel}
        onClose={closeFormDrawer}
        title={actionLabel ?? ""}
        description={selectedOutlet?.name ?? definition.title}
        width="lg"
        footer={
          actionKind === "add" || actionKind === "generic" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeFormDrawer}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={submitAdd}
                disabled={saving}
              >
                {saving ? "Saving…" : editingRow ? "Update" : "Save"}
              </Button>
            </div>
          ) : actionKind === "merge" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeFormDrawer}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={submitMerge}
              >
                Merge
              </Button>
            </div>
          ) : actionKind === "split" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeFormDrawer}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={submitSplit}
              >
                Split table
              </Button>
            </div>
          ) : actionKind === "close-shift" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeFormDrawer}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={closeOpenShifts}
              >
                Close open shifts
              </Button>
            </div>
          ) : actionKind === "open-shift" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeFormDrawer}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={openNewShift}
              >
                Open shift
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setActionLabel(null)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {formError && (
          <div className="mb-4">
            <AlertBanner
              variant="error"
              message={formError}
              onDismiss={() => setFormError(null)}
            />
          </div>
        )}
        {actionKind === "add" || actionKind === "generic" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {editableColumns(definition.columns).map((col) => {
              const isSearchSelect = col.inputType === "searchSelect";
              const isSelect =
                !isSearchSelect &&
                (col.inputType === "select" ||
                  col.key === "status" ||
                  col.key === "type" ||
                  col.key === "outletId" ||
                  col.key === "bookingStatus" ||
                  (col.key === "tableNo" &&
                    col.inputType !== "text" &&
                    definition.title !== "Tables" &&
                    ((definition.tableInventory && definition.tableInventory.length > 0) ||
                      tableOpsRows.length > 0 ||
                      (col.options && col.options.length > 0))) ||
                  (col.options !== undefined && col.options.length > 0));

              const isNumber =
                col.inputType === "number" ||
                col.inputType === "currency" ||
                col.format === "currency" ||
                ["tables", "covers", "capacity", "count", "quantity"].includes(col.key);

              const isCurrency =
                col.inputType === "currency" || col.format === "currency" || col.key === "sales";

              const isTel = col.inputType === "tel" || col.key === "phone";
              const isTime = col.inputType === "time" || col.key === "time";
              const isDate =
                col.inputType === "date" ||
                (col.key === "date" && definition.title === "Bookings") ||
                col.key === "eventDate";

              let selectOptions: { value: string; label: string }[] = [];
              if (isSelect || isSearchSelect) {
                if (col.key === "outletId" && outlets.length > 0) {
                  selectOptions = outlets.map((o) => ({ value: o.id, label: o.name }));
                } else if (col.key === "tableNo" && definition.title !== "Tables") {
                  const inventory =
                    definition.tableInventory && definition.tableInventory.length > 0
                      ? definition.tableInventory
                      : tableOpsRows;
                  const formOutlet = String(form.outletId ?? outletId ?? "").trim();
                  selectOptions = inventory
                    .filter((t) => !formOutlet || !t.outletId || String(t.outletId) === formOutlet)
                    .map((t) => ({
                      value: String(t.tableNo),
                      label: `Table ${t.tableNo}${t.capacity ? ` · ${t.capacity} seats` : ""}${
                        t.status ? ` · ${t.status}` : ""
                      }`,
                    }));
                } else if (col.options && col.options.length > 0) {
                  selectOptions = col.options.map((opt) =>
                    typeof opt === "string" ? { value: opt, label: opt } : opt,
                  );
                } else if (col.key === "status" && definition.filterOptions?.length) {
                  selectOptions = definition.filterOptions
                    .filter((o) => o.id !== "all")
                    .map((o) => ({ value: o.id, label: o.label }));
                } else if (col.key === "type") {
                  selectOptions = [
                    { value: "Restaurant", label: "Restaurant" },
                    { value: "Cafe", label: "Cafe" },
                    { value: "Kitchen", label: "Kitchen" },
                    { value: "Bar", label: "Bar" },
                  ];
                } else if (col.key === "status") {
                  selectOptions = [
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ];
                }
              }

              const isRequired =
                col.required ??
                (col.key !== "status" && col.key !== "covers" && col.key !== "sales");

              const placeholder =
                col.placeholder ??
                (isCurrency
                  ? "e.g. 0"
                  : isNumber
                    ? "e.g. 10"
                    : isSearchSelect
                      ? `Search ${col.header.toLowerCase()}…`
                      : isSelect
                        ? `Select ${col.header.toLowerCase()}`
                        : `Enter ${col.header.toLowerCase()}`);

              const helperText =
                col.helperText ??
                (isCurrency
                  ? "Amount in TZS"
                  : isNumber
                    ? "Numeric value only"
                    : undefined);

              const defaultValue =
                isSearchSelect ? "" : isSelect ? (selectOptions[0]?.value ?? "") : "";
              const currentValue = form[col.key] !== undefined ? form[col.key] : defaultValue;

              const phoneRaw = String(form.phone ?? "").trim();
              const phoneInvalid =
                isTel &&
                phoneRaw !== "" &&
                !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(phoneRaw.replace(/\s+/g, ""));

              const fieldError =
                col.key === "tableNo" &&
                definition.title === "Tables" &&
                tableNoInUseMessage
                  ? tableNoInUseMessage
                  : phoneInvalid
                    ? col.patternMessage ?? "Enter a valid 10-digit mobile number"
                    : undefined;

              const inputTypeAttr = isNumber
                ? "number"
                : isTel
                  ? "tel"
                  : isTime
                    ? "time"
                    : isDate
                      ? "date"
                      : "text";
              const todayISO = new Date().toLocaleDateString("sv-SE");

              return (
                <FormField
                  key={col.key}
                  label={col.header}
                  required={isRequired}
                  error={fieldError}
                  helperText={fieldError ? undefined : helperText}
                >
                  {isSearchSelect ? (
                    <SearchSelect
                      options={selectOptions.map((opt) => ({
                        id: opt.value,
                        label: opt.label,
                      }))}
                      selectedId={String(currentValue ?? "").trim() || null}
                      placeholder={placeholder}
                      onSelect={(option) =>
                        setForm((prev) => ({ ...prev, [col.key]: option.id }))
                      }
                      onClear={() => setForm((prev) => ({ ...prev, [col.key]: "" }))}
                      lockInputWhenSelected
                    />
                  ) : isSelect ? (
                    <SelectInput
                      value={currentValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => {
                          const next = { ...prev, [col.key]: value };
                          // Changing outlet clears table so user picks from the new list
                          if (col.key === "outletId" && prev.tableNo) {
                            next.tableNo = "";
                          }
                          return next;
                        });
                        if (col.key === "outletId" || col.key === "tableNo") {
                          setMergeTableNo("");
                        }
                      }}
                      className={fieldError ? "border-red-400 focus:border-red-500 focus:ring-red-400" : undefined}
                    >
                      <option value="">{placeholder}</option>
                      {selectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </SelectInput>
                  ) : (
                    <TextInput
                      type={inputTypeAttr}
                      min={isNumber ? (col.min ?? 0) : isDate ? todayISO : undefined}
                      max={isNumber ? col.max : undefined}
                      step={isNumber ? (col.step ?? (isCurrency ? "any" : "1")) : undefined}
                      inputMode={
                        isNumber
                          ? isCurrency
                            ? "decimal"
                            : "numeric"
                          : isTel
                            ? "tel"
                            : undefined
                      }
                      value={form[col.key] ?? ""}
                      placeholder={placeholder}
                      className={fieldError ? "border-red-400 focus:border-red-500 focus:ring-red-400" : undefined}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (
                          isNumber &&
                          !isCurrency &&
                          next !== "" &&
                          !/^\d*\.?\d*$/.test(next)
                        ) {
                          return;
                        }
                        if (isTel && next !== "" && !/^[\d+\s-]*$/.test(next)) {
                          return;
                        }
                        setForm((prev) => ({ ...prev, [col.key]: next }));
                      }}
                    />
                  )}
                </FormField>
              );
            })}
            {reservationCapacityCheck.needsMerge && (
              <div className="sm:col-span-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <AlertBanner
                  variant="info"
                  message={`Covers (${reservationCapacityCheck.covers}) exceed table capacity (${reservationCapacityCheck.primaryCap}). Merge with another table to continue.`}
                />
                <FormField
                  label="Merge with table"
                  required
                  helperText={
                    mergeTableNo
                      ? `Combined capacity: ${reservationCapacityCheck.combinedCap} seats`
                      : "Select a second table to combine capacity"
                  }
                  error={
                    mergeTableNo &&
                    reservationCapacityCheck.combinedCap < reservationCapacityCheck.covers
                      ? `Still short by ${
                          reservationCapacityCheck.covers - reservationCapacityCheck.combinedCap
                        } seats`
                      : undefined
                  }
                >
                  <SelectInput
                    value={mergeTableNo}
                    onChange={(e) => setMergeTableNo(e.target.value)}
                  >
                    <option value="">Select table to merge</option>
                    {reservationCapacityCheck.tables
                      .filter((t) => String(t.tableNo) !== String(form.tableNo ?? "").trim())
                      .map((t) => (
                        <option key={String(t.id ?? t.tableNo)} value={String(t.tableNo)}>
                          Table {t.tableNo}
                          {t.capacity ? ` · ${t.capacity} seats` : ""}
                          {t.status ? ` · ${t.status}` : ""}
                        </option>
                      ))}
                  </SelectInput>
                </FormField>
              </div>
            )}
          </div>
        ) : null}

        {actionKind === "merge" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Choose two tables to merge. Capacities combine and the originals are removed from the
              list.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Table A">
                <SelectInput value={selectA} onChange={(e) => setSelectA(e.target.value)}>
                  <option value="">Select table</option>
                  {tableOpsRows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {String(row.tableNo ?? row.id)} ·{" "}
                      {outlets.find((o) => o.id === row.outletId)?.name ?? row.section ?? "—"} ·
                      cap {row.capacity ?? "—"}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Table B">
                <SelectInput value={selectB} onChange={(e) => setSelectB(e.target.value)}>
                  <option value="">Select table</option>
                  {tableOpsRows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {String(row.tableNo ?? row.id)} ·{" "}
                      {outlets.find((o) => o.id === row.outletId)?.name ?? row.section ?? "—"} ·
                      cap {row.capacity ?? "—"}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          </div>
        ) : null}

        {actionKind === "split" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Split one larger table into two smaller covers (capacity 4+).
            </p>
            <FormField label="Table to split">
              <SelectInput value={selectA} onChange={(e) => setSelectA(e.target.value)}>
                <option value="">Select table</option>
                {tableOpsRows
                  .filter((r) => Number(r.capacity ?? 0) >= 4)
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {String(row.tableNo ?? row.id)} · cap {row.capacity}
                    </option>
                  ))}
              </SelectInput>
            </FormField>
          </div>
        ) : null}

        {actionKind === "map" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Map className="h-4 w-4 text-emerald-700" />
              Live floor map for {selectedOutlet?.name ?? definition.title}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {scopedRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    setActionLabel(null);
                    setPreview(row);
                  }}
                  className={cn(
                    "rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                    row.status === "Available" && "border-emerald-200 bg-emerald-50",
                    row.status === "Occupied" && "border-red-200 bg-red-50",
                    row.status === "Reserved" && "border-amber-200 bg-amber-50",
                    row.status === "Billing" && "border-violet-200 bg-violet-50",
                    !["Available", "Occupied", "Reserved", "Billing"].includes(
                      String(row.status ?? ""),
                    ) && "border-slate-200 bg-slate-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {String(row.tableNo ?? row.id)}
                    </p>
                    <Table2 className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {row.section ?? "—"} · {row.capacity ?? "—"} seats
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-700">{row.status}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {actionKind === "qr" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                View or download dine-in QR images for each table. Print and place on the table.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={markAllQrLinked}>
                  Link all pending
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={async () => {
                    await downloadAllTableQrs(
                      scopedRows.map((row) => ({
                        tableNo: String(row.tableNo ?? row.id),
                        outletId: String(row.outletId ?? outletId ?? "outlet"),
                      })),
                    );
                    setToast(`Downloaded ${scopedRows.length} QR image(s).`);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download all
                </Button>
              </div>
            </div>
            <ul className="space-y-2">
              {scopedRows.map((row) => (
                <TableQrCard
                  key={row.id}
                  tableNo={String(row.tableNo ?? row.id)}
                  section={row.section ? String(row.section) : undefined}
                  outletId={String(row.outletId ?? outletId ?? "outlet")}
                  outletName={selectedOutlet?.name ?? definition.title}
                  linked={String(row.qr ?? "").toLowerCase() === "linked"}
                  onLink={() => linkOneQr(row.id)}
                  onDownloaded={() =>
                    setToast(`Downloaded QR for ${String(row.tableNo ?? row.id)}.`)
                  }
                />
              ))}
            </ul>
          </div>
        ) : null}

        {actionKind === "close-shift" ? (
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              This will close every <strong>Open</strong> cashier shift for{" "}
              {selectedOutlet?.name ?? "this outlet"} and copy sales into declared amount.
            </p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
              Open now:{" "}
              <strong>
                {scopedRows.filter((r) => r.status === "Open").length}
              </strong>
            </p>
          </div>
        ) : null}

        {actionKind === "open-shift" ? (
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Open a new cashier shift for {selectedOutlet?.name ?? "this outlet"} with a default
              float of TSh 2,000.
            </p>
          </div>
        ) : null}

        {actionKind === "report" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Shift cash report for {selectedOutlet?.name ?? definition.title} (demo).
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Cashier</th>
                    <th className="px-3 py-2">Shift</th>
                    <th className="px-3 py-2">Sales</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scopedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {row.cashier ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{row.shift ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-700">{row.sales ?? "—"}</td>
                      <td className="px-3 py-2">{row.status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                downloadCsv(
                  `${definition.title.toLowerCase().replace(/\s+/g, "-")}-cash-report.csv`,
                  definition.columns,
                  scopedRows,
                );
                setToast("Cash report exported.");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download report CSV
            </Button>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
