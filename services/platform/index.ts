import { api } from "../api";
import type { PermissionLevel } from "@/lib/permissions";

export type PlatformModule = {
  key: string;
  label: string;
  group?: string;
};

export type UserPermissionDto = {
  moduleKey: string;
  permission: PermissionLevel;
};

export type LinkedEmployeeDto = {
  id: string;
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
} | null;

export type ManagedUserDto = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  status: string;
  isSuperAdmin?: boolean;
  employeeId?: string | null;
  linkedEmployee: LinkedEmployeeDto;
  permissions: Array<{
    id?: string;
    moduleKey: string;
    permission: PermissionLevel;
  }>;
};

export const platformService = {
  listModules: () => api.get<PlatformModule[]>("/api/platform/modules"),
  myPermissions: () =>
    api.get<Record<string, PermissionLevel>>("/api/platform/permissions/me"),
  listUsers: () => api.get<ManagedUserDto[]>("/api/platform/users"),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    role?: string;
    isSuperAdmin?: boolean;
    employeeId?: string | null;
    permissions?: UserPermissionDto[];
  }) => api.post<ManagedUserDto>("/api/platform/users", body),
  updateUser: (
    id: string,
    body: Partial<{
      name: string;
      role: string;
      status: string;
      isSuperAdmin: boolean;
      employeeId: string | null;
      permissions: UserPermissionDto[];
    }>,
  ) => api.put<ManagedUserDto>(`/api/platform/users/${id}`, body),
};
