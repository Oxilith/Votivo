---
active: true
iteration: 1
max_iterations: 10
completion_promise: "Done"
started_at: "2025-12-31T04:24:50Z"
---

Fix linting issue in backend workspace for tests - production build works, type-check also works, lint does not work because it has issue with vitest type recognition for test. You must not disable rules for these, since it hacky workaround, and not real fix.
