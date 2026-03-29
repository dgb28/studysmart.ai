import { api } from "./api";

/** Report module/topic activity so daily goal suggestions can adapt (best-effort). */
export function recordStudyActivity(body: {
  module_id: string;
  topic_id?: string | null;
  event: "content_viewed" | "quiz_passed" | "topic_opened";
}) {
  return api("/goals/activity", {
    method: "POST",
    json: {
      module_id: body.module_id,
      topic_id: body.topic_id ?? null,
      event: body.event,
    },
  }).catch(() => {});
}
