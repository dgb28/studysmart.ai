import { ApiError } from "./api";

/** Turn FastAPI / network errors into a short user-facing string. */
export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return err.message;
    }
    try {
      const j = JSON.parse(err.body) as { detail?: unknown };
      const d = j.detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d)) {
        return d
          .map((item: { msg?: string; loc?: unknown }) => {
            if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
              return item.msg;
            }
            return JSON.stringify(item);
          })
          .join("; ");
      }
    } catch {
      if (err.body?.trim()) return err.body.slice(0, 200);
    }
    return err.message || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
