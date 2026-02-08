---
'@jspsych/extension-tobii': patch
---

Make startTracking() idempotent to prevent double-subscribing to gaze data, which caused the second validation trial to fail with "Server failed to start tracking".
