# KNOWN_ISSUES.md
> Tracked bugs, limitations, and workarounds for StudyPulse.

---

## Open Issues

| # | Severity | Area | Description | Workaround |
|---|---|---|---|---|
| 1 | Medium | Agents | OpenAI Realtime Audio API sometimes truncates responses if the user breathes heavily | Instruct user to use push-to-talk instead of voice activity detection (VAD). |
| 2 | High | Frontend | Real-time friction detection WebSocket drops if tab goes to sleep. | Currently catching the disconnect and re-syncing session time on focus event. |
| 3 | Low | Backend | Adaptive Study Plan chron job doesn't adjust if time zone changes. | Ensure users have UTC offset defined in their profile. |
| 4 | Low | Frontend | Docker on Windows sometimes fails to hot-reload source changes. | Restart the container manually: `docker compose restart frontend`. |

---

## Template for New Issues

```
| N | Critical/High/Medium/Low | Area | Description | Workaround |
```
