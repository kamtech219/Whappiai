## 2026-04-19 - [Admin API] Subselects instead of sequential scalar queries
**Learning:** In SQLite with `better-sqlite3`, making a separate `db.prepare(...).get()` call for scalar aggregations (like COUNT or SUM on different tables) introduces measurable synchronous I/O and statement compilation overhead.
**Action:** When querying disparate data for summary dashboards, bundle these aggregations into a single query using subselects (e.g. `SELECT (SELECT COUNT(...) FROM tableA), (SELECT SUM(...) FROM tableB)`). This reduces the sequential querying bottleneck significantly.
