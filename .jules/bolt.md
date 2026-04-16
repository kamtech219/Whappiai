## 2024-05-18 - [Parallelize Bulk Message Sending Endpoint]
**Learning:** Refactoring a sequential `for...of` loop to use `Promise.all` for bulk message processing must be combined with chunking (concurrency limits). Direct mapping of user input (e.g., `req.body`) to parallel tasks creates unbounded concurrency, leading to resource exhaustion, `EMFILE` errors, or triggering rate-limit bans when hitting external APIs or processing many queues simultaneously.
**Action:** When parallelizing operations on user-provided arrays in Node.js, always implement a `CONCURRENCY_LIMIT` and process the array in smaller chunks to protect server resources and maintain system stability.

## 2024-05-20 - [Optimize Webhook Dispatch]
**Learning:** In `src/services/WebhookService.js`, webhooks were previously dispatched using a sequential `for...of` loop where the `this.send` (which uses Axios) was called without an `await`. This effectively launched all outgoing HTTP requests instantaneously and simultaneously. While non-blocking to the Node event loop, launching unbounded concurrent Axios requests for many webhooks can lead to immediate socket exhaustion (`EMFILE`), `EADDRNOTAVAIL` errors, or memory spikes.
**Action:** When dispatching background network requests over arrays, even if you do not want to block the caller, you must use chunking combined with `Promise.allSettled` (e.g., `CONCURRENCY_LIMIT = 10`) to enforce a safe maximum number of parallel outbound connections.

## 2024-12-06 - [Optimize DB queries for API Stats Dashboard]
**Learning:** In \`src/models/ActivityLog.js\` the \`getSummary\` method executed 4 separate sequential queries to retrieve summary analytics for the dashboard (total activities, grouped actions, grouped users, success counts). Grouping on multiple independent dimensions required multiple full table scans using \`COUNT\` or reducing massive row objects in JS.
**Action:** Replaced sequential DB calls with a single optimized SQLite query leveraging \`COUNT(*)\` and \`SUM(CASE WHEN ...)\` combined with a multi-column \`GROUP BY action, user_email\`. In SQLite, fetching a aggregated payload and parsing it reduces I/O round trips considerably and prevents JS memory bloat from fetching raw logs.

## 2026-04-16 - [Optimize DB queries for API Stats Dashboard]
**Learning:** Consolidating multiple independent aggregation queries (like `COUNT(*)` or `SUM(amount)`) on different tables into a single query using subselects reduces overhead when working with `better-sqlite3`. I verified this by writing a benchmark that compared running 6 queries sequentially vs. 1 query with 6 subselects.
**Action:** Replaced sequential DB calls with a single query leveraging subselects to improve performance by reducing overhead of multiple round-trips/execution contexts.
