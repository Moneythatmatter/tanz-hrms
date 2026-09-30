"use client";

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    return "https://tnz-hrms-backend.onrender.com";
  }
  return envUrl.replace(/\/$/, "");
};

const API_BASE = getApiBaseUrl();

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("pms_token") : null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Backend is unreachable at ${API_BASE}. Make sure the backend server is running.`,
      503
    );
  }

  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("pms_token");
    localStorage.removeItem("pms_session");
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("Invalid JSON response from API", res.status);
  }

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: "DELETE" }),
};

export const foPath = (segment: string) =>
  `/api/front-office${segment.startsWith("/") ? segment : `/${segment}`}`;

export const psPath = (segment: string) =>
  `/api/purchase-stores${segment.startsWith("/") ? segment : `/${segment}`}`;
