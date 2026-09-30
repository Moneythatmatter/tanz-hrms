"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Link2,
  Link2Off,
  Mail,
  Pencil,
  Shield,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { usePermissions } from "@/components/platform/PermissionsProvider";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";
import { Drawer, Modal } from "@/components/ui";
import {
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHead,
  ListTableHeaderCell,
  ListTablePersonCell,
  ListTableRow,
  ListTableEmptyState,
  getListTableInitials,
} from "@/components/shared/list-table";
import {
  platformService,
  type ManagedUserDto,
  type PlatformModule,
} from "@/services/platform";
import { hrEmployeeService } from "@/services/human-resources";
import type { PermissionLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type EmployeeOption = {
  id: string;
  empCode: string;
  name: string;
  email: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  employeeId: string;
  permissions: Record<string, PermissionLevel>;
};

type DrawerTab = "details" | "permissions";

const PERM_OPTIONS: { value: PermissionLevel | ""; label: string }[] = [
  { value: "", label: "No access" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
];

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  role: "Staff",
  employeeId: "",
  permissions: {},
});

function groupAccessSummary(
  groupModules: PlatformModule[],
  permissions: Record<string, PermissionLevel>,
) {
  const granted = groupModules.filter((m) => permissions[m.key]).length;
  return { granted, total: groupModules.length };
}

function PermissionsTable({
  modulesByGroup,
  permissions,
  onChange,
  disabled = false,
}: {
  modulesByGroup: [string, PlatformModule[]][];
  permissions: Record<string, PermissionLevel>;
  onChange?: (moduleKey: string, permission: PermissionLevel | "") => void;
  disabled?: boolean;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const setGroupPermission = (
    groupModules: PlatformModule[],
    permission: PermissionLevel | "",
  ) => {
    if (disabled || !onChange) return;
    for (const mod of groupModules) {
      onChange(mod.key, permission);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs divide-y divide-slate-100">
      <div className="grid grid-cols-[1fr_180px] gap-3 bg-slate-50/90 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Module</span>
        <span>Access level</span>
      </div>

      {modulesByGroup.map(([group, groupModules]) => {
        const isExpanded = expandedGroups.has(group);
        const { granted, total } = groupAccessSummary(groupModules, permissions);

        return (
          <div key={group} className="bg-white">
            <div className="grid grid-cols-[1fr_180px] items-center gap-3 px-5 py-3">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="flex min-w-0 items-center gap-2 text-left transition-colors hover:text-emerald-800"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                    isExpanded ? "rotate-0" : "-rotate-90",
                  )}
                />
                <span className="truncate text-sm font-semibold text-slate-900">{group}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {total} pages
                </span>
                {granted > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {granted} granted
                  </span>
                )}
              </button>
              <select
                disabled={disabled}
                defaultValue=""
                key={`${group}-${granted}-${isExpanded}`}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                  disabled
                    ? "cursor-default border-slate-100 bg-slate-50 text-slate-700"
                    : "border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                )}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  setGroupPermission(
                    groupModules,
                    value === "__none__" ? "" : (value as PermissionLevel),
                  );
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="" disabled>
                  Set all…
                </option>
                {PERM_OPTIONS.filter((o) => o.value !== "").map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    All {opt.label}
                  </option>
                ))}
                <option value="__none__">All No access</option>
              </select>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/40">
                {groupModules.map((mod) => (
                  <div
                    key={mod.key}
                    className="grid grid-cols-[1fr_180px] items-center gap-3 border-t border-slate-100 px-5 py-2.5 pl-11 first:border-t-0"
                  >
                    <span className="text-sm font-medium text-slate-700">{mod.label}</span>
                    <select
                      disabled={disabled}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                        disabled
                          ? "cursor-default border-slate-100 bg-slate-50 text-slate-700"
                          : "border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                      )}
                      value={permissions[mod.key] ?? ""}
                      onChange={(e) =>
                        onChange?.(mod.key, e.target.value as PermissionLevel | "")
                      }
                    >
                      {PERM_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function UserProfileCard({ user }: { user: ManagedUserDto }) {
  const isLinked = Boolean(user.employeeId || user.linkedEmployee);
  const initials = user.initials || getListTableInitials(user.name);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-xl font-bold text-white shadow-md shadow-emerald-900/10">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">{user.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {user.role}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              {user.status ?? "Active"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                isLinked
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800",
              )}
            >
              {isLinked ? (
                <>
                  <Link2 className="h-3 w-3" /> Portal linked
                </>
              ) : (
                <>
                  <Link2Off className="h-3 w-3" /> No portal access
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailsInfoList({
  user,
  employees,
}: {
  user: ManagedUserDto;
  employees: EmployeeOption[];
}) {
  const linkedEmployee = user.linkedEmployee;
  const fallbackEmployee = employees.find((e) => e.id === user.employeeId);
  const isLinked = Boolean(user.employeeId || linkedEmployee);
  const employeeLabel = linkedEmployee
    ? `${linkedEmployee.empCode} · ${linkedEmployee.firstName} ${linkedEmployee.lastName}`
    : fallbackEmployee
      ? `${fallbackEmployee.empCode} · ${fallbackEmployee.name}`
      : "Not linked to any employee";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
      <DetailInfoRow
        icon={<UserRound className="h-4 w-4" />}
        label="Full name"
        value={user.name}
      />
      <DetailInfoRow
        icon={<Mail className="h-4 w-4" />}
        label="Email (login)"
        value={user.email}
      />
      <DetailInfoRow
        icon={<Briefcase className="h-4 w-4" />}
        label="Role label"
        value={user.role}
      />
      <DetailInfoRow
        icon={<Link2 className="h-4 w-4" />}
        label="Linked employee"
        value={
          isLinked ? (
            <span>
              {employeeLabel}
              {(linkedEmployee?.email ?? fallbackEmployee?.email) && (
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  {linkedEmployee?.email ?? fallbackEmployee?.email}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-500">Not linked — cannot sign in to employee portal</span>
          )
        }
      />
    </div>
  );
}

function AccessSummary({ permissions }: { permissions: Record<string, PermissionLevel> }) {
  const values = Object.values(permissions);
  const writeCount = values.filter((v) => v === "write" || v === "admin").length;
  const readCount = values.filter((v) => v === "read").length;
  const granted = writeCount + readCount;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Modules granted", value: granted, accent: "text-emerald-700 bg-emerald-50 border-emerald-100" },
        { label: "Write access", value: writeCount, accent: "text-violet-700 bg-violet-50 border-violet-100" },
        { label: "Read only", value: readCount, accent: "text-blue-700 bg-blue-50 border-blue-100" },
      ].map((stat) => (
        <div
          key={stat.label}
          className={cn("rounded-xl border px-3 py-2.5 text-center", stat.accent)}
        >
          <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function UserDetailsFields({
  form,
  setForm,
  employees,
  employeeLinkMap,
  editingUserId,
  showPasswordHint,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  employees: EmployeeOption[];
  employeeLinkMap: Map<string, ManagedUserDto>;
  editingUserId?: string | null;
  showPasswordHint?: boolean;
}) {
  const selectedEmployeeConflict = useMemo(() => {
    if (!form.employeeId) return null;
    const owner = employeeLinkMap.get(form.employeeId);
    if (!owner) return null;
    if (editingUserId && owner.id === editingUserId) return null;
    return owner;
  }, [form.employeeId, employeeLinkMap, editingUserId]);

  const onSelectEmployee = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    setForm((f) => ({
      ...f,
      employeeId,
      ...(emp
        ? {
            name: emp.name || f.name,
            email: emp.email || f.email,
          }
        : {}),
    }));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-1 sm:col-span-2">
        <span className="text-xs font-medium text-slate-600">Link to employee</span>
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={form.employeeId}
          onChange={(e) => onSelectEmployee(e.target.value)}
        >
          <option value="">— No employee (admin only) —</option>
          {employees.map((emp) => {
            const owner = employeeLinkMap.get(emp.id);
            const takenByOther = owner && owner.id !== editingUserId;
            return (
              <option key={emp.id} value={emp.id} disabled={Boolean(takenByOther)}>
                {emp.empCode} · {emp.name} ({emp.email})
                {takenByOther ? " — already linked" : ""}
              </option>
            );
          })}
        </select>
      </label>

      {selectedEmployeeConflict && (
        <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          This employee is already linked to{" "}
          <strong>{selectedEmployeeConflict.name}</strong> (
          {selectedEmployeeConflict.email}). Choose another employee or unlink them first.
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600">Full name</span>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600">Email (login)</span>
        <input
          type="email"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          disabled={Boolean(editingUserId && form.employeeId)}
        />
        {form.employeeId && !editingUserId && (
          <span className="text-[11px] text-slate-500">
            Email is synced from the selected employee when saving.
          </span>
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600">
          {editingUserId ? "New password (optional)" : "Password"}
        </span>
        <input
          type="password"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        {showPasswordHint && editingUserId && (
          <span className="text-[11px] text-slate-500">Leave blank to keep current password.</span>
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600">Role label</span>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        />
      </label>
    </div>
  );
}

export function UserManagementView() {
  const [users, setUsers] = useState<ManagedUserDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [userRows, modRows, empRows] = await Promise.all([
        platformService.listUsers(),
        platformService.listModules(),
        hrEmployeeService.list(),
      ]);
      setUsers(userRows);
      setModules(modRows);
      setEmployees(
        empRows.map((e) => ({
          id: String(e.id),
          empCode: String(e.empCode ?? e.emp_code ?? ""),
          name: `${e.firstName ?? e.first_name ?? ""} ${e.lastName ?? e.last_name ?? ""}`.trim(),
          email: String(e.email ?? ""),
        })),
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to load");
      setToastVariant("error");
    } finally {
      setLoading(false);
    }
  };

  const { canRead, canWrite } = usePermissions();

  useEffect(() => {
    if (!canRead("hr_user_management")) return;
    void load();
  }, [canRead]);

  const manageableUsers = useMemo(
    () => users.filter((u) => !u.isSuperAdmin),
    [users],
  );

  const selected = useMemo(
    () => manageableUsers.find((u) => u.id === selectedId) ?? null,
    [manageableUsers, selectedId],
  );

  const employeeLinkMap = useMemo(() => {
    const map = new Map<string, ManagedUserDto>();
    for (const u of manageableUsers) {
      if (u.employeeId) map.set(u.employeeId, u);
    }
    return map;
  }, [manageableUsers]);

  const modulesByGroup = useMemo(() => {
    const groups = new Map<string, PlatformModule[]>();
    for (const mod of modules) {
      const group = mod.group ?? "Other";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(mod);
    }
    return Array.from(groups.entries());
  }, [modules]);

  const stats = useMemo(() => {
    const linked = manageableUsers.filter((u) => u.employeeId || u.linkedEmployee).length;
    const portalReady = manageableUsers.filter((u) => u.employeeId).length;
    return { total: manageableUsers.length, linked, portalReady };
  }, [manageableUsers]);

  const populateFormFromUser = (u: ManagedUserDto) => {
    const perms: Record<string, PermissionLevel> = {};
    for (const p of u.permissions) {
      perms[p.moduleKey] = p.permission;
    }
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      employeeId: u.employeeId ?? "",
      permissions: perms,
    });
  };

  const openCreateModal = () => {
    setCreateForm(emptyForm());
    setCreateModalOpen(true);
  };

  const openUserDrawer = (userId: string) => {
    const u = manageableUsers.find((row) => row.id === userId);
    if (!u) return;
    setSelectedId(userId);
    populateFormFromUser(u);
    setDrawerTab("details");
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
    setForm(emptyForm());
    setDrawerTab("details");
    setIsEditing(false);
  };

  const startEditing = () => {
    if (selected) populateFormFromUser(selected);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (selected) populateFormFromUser(selected);
    setIsEditing(false);
  };

  const setPerm = (
    target: "form" | "createForm",
    moduleKey: string,
    permission: PermissionLevel | "",
  ) => {
    const setter = target === "form" ? setForm : setCreateForm;
    setter((f) => {
      const next = { ...f.permissions };
      if (!permission) delete next[moduleKey];
      else next[moduleKey] = permission;
      return { ...f, permissions: next };
    });
  };

  const flattenPermissions = (perms: Record<string, PermissionLevel>) =>
    Object.entries(perms).map(([moduleKey, permission]) => ({
      moduleKey,
      permission,
    }));

  const getEmployeeConflict = (employeeId: string, exceptUserId?: string | null) => {
    if (!employeeId) return null;
    const owner = employeeLinkMap.get(employeeId);
    if (!owner) return null;
    if (exceptUserId && owner.id === exceptUserId) return null;
    return owner;
  };

  const handleCreate = async () => {
    const conflict = getEmployeeConflict(createForm.employeeId);
    if (conflict) {
      setToast(
        `Employee already linked to ${conflict.name} (${conflict.email}).`,
      );
      setToastVariant("error");
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      if (!createForm.password) throw new Error("Password is required for new users");
      await platformService.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        employeeId: createForm.employeeId || null,
        permissions: flattenPermissions(createForm.permissions),
      });
      setToast("User created successfully.");
      setToastVariant("success");
      setCreateModalOpen(false);
      setCreateForm(emptyForm());
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Create failed");
      setToastVariant("error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;

    const conflict = getEmployeeConflict(form.employeeId, selected.id);
    if (conflict) {
      setToast(
        `Employee already linked to ${conflict.name} (${conflict.email}).`,
      );
      setToastVariant("error");
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      const payload: Parameters<typeof platformService.updateUser>[1] = {
        name: form.name,
        role: form.role,
        employeeId: form.employeeId || null,
        permissions: flattenPermissions(form.permissions),
      };
      await platformService.updateUser(selected.id, payload);
      setToast("User updated successfully.");
      setToastVariant("success");
      await load();
      setIsEditing(false);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Save failed");
      setToastVariant("error");
    } finally {
      setSaving(false);
    }
  };

  if (!canRead("hr_user_management")) {
    return (
      <ModulePageShell
        eyebrow="Human Resource"
        title="User Management"
        description="Administrator access required."
      >
        <p className="text-sm text-red-600">You do not have permission to manage users.</p>
      </ModulePageShell>
    );
  }

  const createConflict = getEmployeeConflict(createForm.employeeId);
  const editConflict = selected ? getEmployeeConflict(form.employeeId, selected.id) : null;

  return (
    <ModulePageShell
      toast={toast}
      toastVariant={toastVariant}
      onDismissToast={() => setToast(null)}
      eyebrow="Human Resource"
      title="User Management"
      description="Create login accounts, link them to employees for the employee portal, and set module permissions."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "User Management" },
      ]}
      primaryAction={
        canWrite("hr_user_management")
          ? { label: "New user", onClick: openCreateModal }
          : undefined
      }
      stats={[
        {
          label: "Total users",
          value: stats.total,
          icon: Users,
          accent: "text-emerald-700",
        },
        {
          label: "Employee linked",
          value: stats.linked,
          icon: Link2,
          accent: "text-blue-700",
        },
        {
          label: "Portal access",
          value: stats.portalReady,
          sublabel: "Can sign in to employee app",
          icon: CheckCircle2,
          accent: "text-violet-700",
        },
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <ListTable>
          <ListTableHead>
            <ListTableHeaderCell>User</ListTableHeaderCell>
            <ListTableHeaderCell>Employee</ListTableHeaderCell>
            <ListTableHeaderCell>Role</ListTableHeaderCell>
            <ListTableHeaderCell>Portal</ListTableHeaderCell>
            <ListTableHeaderCell>Status</ListTableHeaderCell>
          </ListTableHead>
          <ListTableBody>
            {loading ? (
              <ListTableEmptyState message="Loading users…" colSpan={5} />
            ) : manageableUsers.length === 0 ? (
              <ListTableEmptyState
                message='No users yet. Click "New user" to create one.'
                colSpan={5}
              />
            ) : (
              manageableUsers.map((u) => {
                const isLinked = Boolean(u.employeeId || u.linkedEmployee);
                const employeeLabel = u.linkedEmployee
                  ? `${u.linkedEmployee.empCode} · ${u.linkedEmployee.firstName} ${u.linkedEmployee.lastName}`
                  : "—";
                return (
                  <ListTableRow
                    key={u.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => openUserDrawer(u.id)}
                  >
                    <ListTableCell>
                      <ListTablePersonCell
                        name={u.name}
                        subtitle={u.email}
                        initials={u.initials || getListTableInitials(u.name)}
                      />
                    </ListTableCell>
                    <ListTableCell>
                      <span className={cn("text-sm", isLinked ? "text-emerald-700" : "text-slate-400")}>
                        {employeeLabel}
                      </span>
                    </ListTableCell>
                    <ListTableCell>
                      <span className="text-sm text-slate-700">{u.role}</span>
                    </ListTableCell>
                    <ListTableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          isLinked
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {isLinked ? (
                          <>
                            <Link2 className="h-3 w-3" /> Linked
                          </>
                        ) : (
                          <>
                            <Link2Off className="h-3 w-3" /> Unlinked
                          </>
                        )}
                      </span>
                    </ListTableCell>
                    <ListTableCell>
                      <span className="text-sm text-slate-600">{u.status ?? "Active"}</span>
                    </ListTableCell>
                  </ListTableRow>
                );
              })
            )}
          </ListTableBody>
        </ListTable>
      </div>

      {/* Create user modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create user"
        description="Add a login account and optionally link it to an employee."
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() => void handleCreate()}
              disabled={saving || Boolean(createConflict)}
            >
              {saving ? "Creating…" : "Create user"}
            </Button>
          </>
        }
      >
        <UserDetailsFields
          form={createForm}
          setForm={setCreateForm}
          employees={employees}
          employeeLinkMap={employeeLinkMap}
        />
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Module permissions
          </p>
          <div className="mt-3">
            <PermissionsTable
              modulesByGroup={modulesByGroup}
              permissions={createForm.permissions}
              onChange={(key, perm) => setPerm("createForm", key, perm)}
            />
          </div>
        </div>
      </Modal>

      {/* User detail drawer */}
      <Drawer
        isOpen={drawerOpen && Boolean(selected)}
        onClose={closeDrawer}
        title={selected?.name ?? "User details"}
        subtitle={selected?.email}
        icon={<UserCog className="h-5 w-5 text-emerald-700" />}
        maxWidth="2xl"
        footer={
          isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => void handleUpdate()}
                disabled={saving || Boolean(editConflict)}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={closeDrawer}>
                Close
              </Button>
              {canWrite("hr_user_management") ? (
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={startEditing}
                >
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Edit
                </Button>
              ) : null}
            </>
          )
        }
      >
        {selected && (
          <>
            <UserProfileCard user={selected} />

            <div
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
              role="tablist"
            >
              {(
                [
                  { id: "details" as const, label: "Details" },
                  { id: "permissions" as const, label: "Access" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={drawerTab === tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  className={cn(
                    "rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                    drawerTab === tab.id
                      ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {drawerTab === "details" && (
              <div role="tabpanel" className="pt-1">
                {isEditing ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <UserDetailsFields
                      form={form}
                      setForm={setForm}
                      employees={employees}
                      employeeLinkMap={employeeLinkMap}
                      editingUserId={selected.id}
                      showPasswordHint
                    />
                  </div>
                ) : (
                  <UserDetailsInfoList user={selected} employees={employees} />
                )}
              </div>
            )}

            {drawerTab === "permissions" && (
              <div role="tabpanel" className="space-y-4 pt-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Module permissions</p>
                      <p className="text-xs text-slate-500">
                        {isEditing
                          ? "Choose access level for each module using the dropdowns below."
                          : "View access levels below. Click Edit to make changes."}
                      </p>
                    </div>
                  </div>
                  <AccessSummary
                    permissions={
                      isEditing
                        ? form.permissions
                        : Object.fromEntries(
                            selected.permissions.map((p) => [p.moduleKey, p.permission]),
                          )
                    }
                  />
                </div>
                <PermissionsTable
                  modulesByGroup={modulesByGroup}
                  permissions={
                    isEditing
                      ? form.permissions
                      : Object.fromEntries(
                          selected.permissions.map((p) => [p.moduleKey, p.permission]),
                        )
                  }
                  disabled={!isEditing}
                  onChange={
                    isEditing
                      ? (key, perm) => setPerm("form", key, perm)
                      : undefined
                  }
                />
              </div>
            )}
          </>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
