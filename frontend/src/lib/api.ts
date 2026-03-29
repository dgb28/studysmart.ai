const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, message: string, body: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sp_token");
}

export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem("sp_token", t);
  else localStorage.removeItem("sp_token");
}

export async function api<T>(
  path: string,
  opts: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, headers: h, ...rest } = opts;
  const token = getToken();
  const headers: Record<string, string> = {
    ...(h as Record<string, string>),
  };
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let r: Response;
  try {
    r = await fetch(`${API}/api/v1${path}`, {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch (e) {
    throw new ApiError(0, "Network error — is the API running at " + API + "?", String(e));
  }

  if (!r.ok) {
    const errBody = await r.text();
    throw new ApiError(r.status, errBody || r.statusText, errBody);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}

/** Use in catch: only treat 401 as logged out. */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

/** Human-readable message from FastAPI `{ "detail": ... }` or network failures. */
export function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message;
    try {
      const j = JSON.parse(err.body) as {
        detail?: string | Array<{ msg?: string; loc?: unknown[] }>;
      };
      if (typeof j.detail === "string") return j.detail;
      if (Array.isArray(j.detail)) {
        const first = j.detail[0];
        if (first?.msg) return first.msg;
      }
    } catch {
      if (err.body?.trim()) return err.body.slice(0, 200);
    }
    return fallback;
  }
  return fallback;
}
