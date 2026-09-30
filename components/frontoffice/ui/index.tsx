import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export { Modal, ConfirmModal } from "./Modal";
export { Drawer } from "./Drawer";
export { AlertBanner } from "./AlertBanner";
export { FOSearchToolbar } from "./FOSearchToolbar";
export { FODatePicker } from "./FODatePicker";
export { DigitalSignaturePad, type DigitalSignaturePadProps } from "@/components/ui/DigitalSignaturePad";

interface FOPageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function FOPageHeader({
  eyebrow,
  title,
  description,
  badge,
  action,
  breadcrumbs,
}: FOPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1 flex items-center space-x-1 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center space-x-1">
                {idx > 0 && <span className="text-slate-400">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-slate-700 hover:underline">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && !breadcrumbs && (
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {eyebrow}
          </p>
        )}
        {title ? (
          typeof title === "string" ? (
            <h1
              className={cn(
                "font-bold text-slate-900 sm:text-2xl",
                eyebrow || breadcrumbs ? "mt-1 text-xl" : "text-lg sm:text-xl",
              )}
            >
              {title}
            </h1>
          ) : (
            <div className={cn(eyebrow || breadcrumbs ? "mt-1" : "")}>{title}</div>
          )
        ) : null}
        {description ? (
          typeof description === "string" ? (
            <p className="mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm">{description}</p>
          ) : (
            <div className="mt-1 max-w-2xl">{description}</div>
          )
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface StatMiniCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
  icon?: LucideIcon;
}

export function StatMiniCard({
  label,
  value,
  sublabel,
  accent = "#16a34a",
  icon: Icon,
}: StatMiniCardProps) {
  return (
    <div className="group relative h-full min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div
        className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50"
        style={{ background: `linear-gradient(135deg, ${accent}18, transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">{label}</p>
          <p className="mt-1.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 truncate text-[11px] font-medium sm:text-xs" style={{ color: accent }}>
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm sm:h-8 sm:w-8 sm:rounded-xl"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormSection({
  title,
  children,
  columns = 2,
  className,
}: FormSectionProps) {
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4 sm:p-5", className)}>
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      <div className={cn("grid gap-4", gridClass)}>{children}</div>
    </section>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  error?: string | boolean;
  helperText?: string;
}

export function FormField({
  label,
  children,
  required,
  className,
  error,
  helperText,
}: FormFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-500">
          {typeof error === "string" ? error : "Required"}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-400 font-normal">{helperText}</p>
      ) : null}
    </label>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function SelectInput({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        inputClass,
        "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function TextAreaInput({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400",
        className,
      )}
      {...props}
    />
  );
}

interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyField: keyof T & string;
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className={cn("pb-3 pr-4", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("py-3.5 pr-4", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface FilterPillsProps {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function FilterPills({ options, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all sm:px-3 sm:text-xs cursor-pointer",
            active === opt.id
              ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface ActionItem {
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

export function ActionButtons({
  actions,
}: {
  actions: (string | ActionItem)[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((action) => {
        const item = typeof action === "string" ? { label: action } : action;
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
              item.variant === "danger"
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={cn("font-medium", highlight ? "text-emerald-700" : "text-slate-900")}>
        {value}
      </span>
    </div>
  );
}

export { formatMoney as formatINR } from "@/lib/currency";
