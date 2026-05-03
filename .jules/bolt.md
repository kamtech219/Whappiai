## 2024-05-18 - [Parallelize Bulk Message Sending Endpoint]
**Learning:** Refactoring a sequential `for...of` loop to use `Promise.all` for bulk message processing must be combined with chunking (concurrency limits). Direct mapping of user input (e.g., `req.body`) to parallel tasks creates unbounded concurrency, leading to resource exhaustion, `EMFILE` errors, or triggering rate-limit bans when hitting external APIs or processing many queues simultaneously.
**Action:** When parallelizing operations on user-provided arrays in Node.js, always implement a `CONCURRENCY_LIMIT` and process the array in smaller chunks to protect server resources and maintain system stability.

## 2024-05-20 - [Optimize Webhook Dispatch]
**Learning:** In `src/services/WebhookService.js`, webhooks were previously dispatched using a sequential `for...of` loop where the `this.send` (which uses Axios) was called without an `await`. This effectively launched all outgoing HTTP requests instantaneously and simultaneously. While non-blocking to the Node event loop, launching unbounded concurrent Axios requests for many webhooks can lead to immediate socket exhaustion (`EMFILE`), `EADDRNOTAVAIL` errors, or memory spikes.
**Action:** When dispatching background network requests over arrays, even if you do not want to block the caller, you must use chunking combined with `Promise.allSettled` (e.g., `CONCURRENCY_LIMIT = 10`) to enforce a safe maximum number of parallel outbound connections.

## 2024-12-06 - [Optimize DB queries for API Stats Dashboard]
**Learning:** In \`src/models/ActivityLog.js\` the \`getSummary\` method executed 4 separate sequential queries to retrieve summary analytics for the dashboard (total activities, grouped actions, grouped users, success counts). Grouping on multiple independent dimensions required multiple full table scans using \`COUNT\` or reducing massive row objects in JS.
**Action:** Replaced sequential DB calls with a single optimized SQLite query leveraging \`COUNT(*)\` and \`SUM(CASE WHEN ...)\` combined with a multi-column \`GROUP BY action, user_email\`. In SQLite, fetching a aggregated payload and parsing it reduces I/O round trips considerably and prevents JS memory bloat from fetching raw logs.

## 2024-12-07 - [Optimize DB queries for counting active sessions]
**Learning:** In `src/routes/api.js` inside the `POST /sessions` endpoint, the logic to verify session limits fetched all session IDs for the user and then executed an individual `Session.findById(id)` query for each ID in a loop to check its status. This resulted in an N+1 query problem, creating unnecessary overhead.
**Action:** Created `getConnectedSessionIdsByOwner` in `src/models/Session.js` to fetch only 'CONNECTED' session IDs in a single SQL query, then filtered these IDs against the `activeSockets` in-memory map. This avoids fetching complete session objects repeatedly and eliminates the N+1 query overhead.
