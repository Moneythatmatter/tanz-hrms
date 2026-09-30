"use client";

import React from "react";
import { FolderOpen, Sparkles } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { humanResourcesNavItems } from "@/app/data/navigation/humanResources";

function resolveTitleAndCategory(slugPath: string): { title: string; category?: string } {
  const fullPath = `/human-resources/${slugPath}`;
  for (const item of humanResourcesNavItems) {
    if (item.href === fullPath) {
      return { title: item.label };
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.href === fullPath) {
          return { title: child.label, category: item.label };
        }
      }
    }
  }

  const parts = slugPath.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1] || "Overview";
  const title = lastPart
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const category =
    parts.length > 1
      ? parts[0]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : undefined;

  return { title, category };
}

export function HRBlankView({ slugPath = "dashboard" }: { slugPath?: string }) {
  const { title, category } = resolveTitleAndCategory(slugPath);

  const breadcrumbs = [
    { label: "Human Resource", href: "/human-resources/dashboard" },
    ...(category ? [{ label: category }] : []),
    { label: title },
  ];

  return (
    <ModulePageShell
      eyebrow="Human Resource Module"
      title={title}
      description={`Manage and configure ${title} records for the Human Resources department.`}
      breadcrumbs={breadcrumbs}
    >
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200">
          <FolderOpen className="h-7 w-7 text-slate-400" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-slate-500" />
          Blank Overview Page
        </span>
        <h3 className="text-base font-bold text-slate-800">
          {title} Page Overview
        </h3>
        <p className="mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
          This is a blank overview layout for <strong className="text-slate-700">{title}</strong> under the Human Resource sidebar navigation.
        </p>
      </div>
    </ModulePageShell>
  );
}
