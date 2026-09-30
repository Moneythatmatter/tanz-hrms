import { api } from "@/services/api";
import { safeGetStorage, safeRemoveStorage, safeSetStorage } from "@/lib/utils";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  isSuperAdmin?: boolean;
};

export type LoginResult = {
  user: AuthUser;
  token: string;
};

const SESSION_KEY = "pms_session";
const TOKEN_KEY = "pms_token";

export function getSessionUser(): AuthUser | null {
  return safeGetStorage<AuthUser | null>(SESSION_KEY, null);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(user: AuthUser | null, token?: string | null) {
  if (user && token) {
    safeSetStorage(SESSION_KEY, user);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } else {
    safeRemoveStorage(SESSION_KEY);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

function toAuthUser(raw: AuthUser & Record<string, unknown>): AuthUser {
  return {
    id: String(raw.id),
    name: String(raw.name),
    email: String(raw.email),
    role: String(raw.role),
    initials: String(raw.initials ?? ""),
    isSuperAdmin: Boolean(raw.isSuperAdmin),
  };
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const result = await api.post<LoginResult>("/api/auth/login", {
    email,
    password,
  });
  const user = toAuthUser(result.user as AuthUser & Record<string, unknown>);
  setSession(user, result.token);
  return user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = toAuthUser(
      (await api.get<AuthUser>("/api/auth/me")) as AuthUser & Record<string, unknown>,
    );
    setSession(user, token);
    return user;
  } catch {
    setSession(null);
    return null;
  }
}

export function logoutSession() {
  setSession(null);
}

/** Super admin flag or legacy Admin role — can manage users & properties. */
export function isPlatformAdmin(user?: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const role = String(user.role ?? "").trim().toLowerCase();
  return role === "admin" || role === "administrator";
}
