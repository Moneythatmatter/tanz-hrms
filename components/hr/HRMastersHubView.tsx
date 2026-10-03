"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarHeart,
  CalendarRange,
  ClipboardList,
  Coins,
  FileCog,
  Sun,
  Tags,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { humanResourcesNavItems } from "@/app/data/navigation/humanResources";
import { usePermissions } from "@/components/platform/PermissionsProvider";
import { filterNavItemsByPermissions } from "@/lib/hr/route-permissions";
import { cn } from "@/lib/utils";

const masterIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "building-2": Building2,
  award: Award,
  briefcase: Briefcase,
  sun: Sun,
  "calendar-heart": CalendarHeart,
  "clipboard-list": ClipboardList,
  "calendar-range": CalendarRange,
  coins: Coins,
  "file-cog": FileCog,
  tags: Tags,
};

const masterDescriptions: Record<string, string> = {
  Departments: "Organizational units, HOD assignments, and headcount.",
  Designations: "Job titles, grades, and reporting hierarchy.",
  "Employment Types": "Permanent, contract, probation, and intern classifications.",
  "Shift Types": "Morning, evening, night, and split shift definitions.",
  "Leave Types": "Casual, earned, sick, and other leave categories.",
  "Leave Policies": "Annual quotas, carry-forward rules, and allocations.",
  "Holiday Calendar": "Public holidays, optional offs, and property closures.",
  "Salary Components": "Earnings, deductions, and statutory line items.",
  "Document Masters": "Required HR documents, expiry rules, and templates.",
  "Complaint Categories": "Grievance types, SLA days, and default priority for tickets.",
};

export function HRMastersHubView() {
  const { canRead } = usePermissions();
  const filteredNav = filterNavItemsByPermissions(humanResourcesNavItems, canRead);
  const mastersGroup = filteredNav.find((item) => item.label === "Masters");
  const masters = mastersGroup?.children ?? [];

  return (
    <ModulePageShell
      eyebrow="Human Resource Module"
      title="Masters"
      description="Configure foundational HR reference data used across employee records, attendance, leave, and payroll."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {masters.map((master) => {
          const Icon = masterIconMap[master.icon] ?? BookOpen;
          const description =
            masterDescriptions[master.label] ?? `Manage ${master.label.toLowerCase()} master records.`;

          return (
            <Link
              key={master.href}
              href={master.href}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition-colors group-hover:bg-emerald-100">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{master.label}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{description}</p>
              <span
                className={cn(
                  "mt-4 inline-flex w-fit items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100",
                  "group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-100",
                )}
              >
                Open master
              </span>
            </Link>
          );
        })}
      </div>
    </ModulePageShell>
  );
}
