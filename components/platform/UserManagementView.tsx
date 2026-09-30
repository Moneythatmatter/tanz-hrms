"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { Button } from "@/components/ui/Button";
import {
  platformService,
  type ManagedUserDto,
  type PlatformModule,
} from "@/services/platform";
import type { PermissionLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const PERM_OPTIONS: PermissionLevel[] = ["read", "write", "admin"];

export function UserManagementView() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUserDto[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff",
    isSuperAdmin: false,
    permissions: {} as Record<string, PermissionLevel>,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [userRows, modRows] = await Promise.all([
        platformService.listUsers(),
        platformService.listModules(),
      ]);
      setUsers(userRows);
      setModules(modRows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPlatformAdmin(user)) return;
    void load();
  }, [user]);

  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    const perms: Record<string, PermissionLevel> = {};
    for (const p of selected.permissions) {
      perms[p.moduleKey] = p.permission;
    }
    setForm({
      name: selected.name,
      email: selected.email,
      password: "",
      role: selected.role,
      isSuperAdmin: Boolean(selected.isSuperAdmin),
      permissions: perms,
    });
  }, [selected]);

  const resetNew = () => {
    setSelectedId(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "Staff",
      isSuperAdmin: false,
      permissions: {},
    });
  };

  const setPerm = (moduleKey: string, permission: PermissionLevel | "") => {
    setForm((f) => {
      const next = { ...f.permissions };
      if (!permission) {
        delete next[moduleKey];
      } else {
        next[moduleKey] = permission;
      }
      return { ...f, permissions: next };
    });
  };

  const flattenPermissions = () =>
    Object.entries(form.permissions).map(([moduleKey, permission]) => ({
      moduleKey,
      permission,
    }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        isSuperAdmin: form.isSuperAdmin,
        permissions: flattenPermissions(),
      };
      if (selected) {
        await platformService.updateUser(selected.id, payload);
      } else {
        if (!form.password) throw new Error("Password is required for new users");
        await platformService.createUser({ ...payload, password: form.password });
      }
      await load();
      if (!selected) resetNew();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isPlatformAdmin(user)) {
    return (
      <WorkspaceShell title="User management">
        <p className="text-sm text-red-600">Administrator access required.</p>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      title="User management"
      description="Assign module access (read / write / admin)."
      actions={
        <Button variant="outline" onClick={resetNew}>
          New user
        </Button>
      }
    >
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-2 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Users
          </p>
          {loading ? (
            <p className="px-2 py-4 text-sm text-slate-500">Loading…</p>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedId(u.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    selectedId === u.id
                      ? "bg-emerald-50 font-semibold text-emerald-900"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <p>{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </button>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            {selected ? `Edit — ${selected.name}` : "Create user"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={Boolean(selected)}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder={selected ? "New password (optional)" : "Password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Role label"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isSuperAdmin}
              onChange={(e) =>
                setForm((f) => ({ ...f, isSuperAdmin: e.target.checked }))
              }
            />
            Super administrator (all modules)
          </label>

          {!form.isSuperAdmin && (
            <>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Module permissions
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                      <th className="py-2 pr-4">Module</th>
                      <th className="py-2 pr-4">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod) => (
                      <tr key={mod.key} className="border-b border-slate-50">
                        <td className="py-2 pr-4 font-medium text-slate-700">
                          {mod.label}
                        </td>
                        <td className="py-2 pr-4">
                          <select
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                            value={form.permissions[mod.key] ?? ""}
                            onChange={(e) =>
                              setPerm(mod.key, e.target.value as PermissionLevel | "")
                            }
                          >
                            <option value="">—</option>
                            {PERM_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-6 flex gap-2">
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save user"}
            </Button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
