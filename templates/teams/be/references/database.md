---
title: Database
description: Schema standards, indexing rules, query optimization, and migration best practices for relational databases.
whenToRead: When designing schemas, writing migrations, or optimizing database queries
tags: [be, database, schema, indexing]
---

# Database

## Schema Standards

- Every table has: `id` (UUID v7 or ULID — sortable, no sequential guessing), `created_at`, `updated_at` timestamps
- Soft deletes: `deleted_at` column. All queries filter `WHERE deleted_at IS NULL`. Never hard-delete unless legally required (GDPR).
- Use `NOT NULL` with defaults wherever possible. Nullable columns require explicit justification.

## Indexes

- Create indexes for every column used in `WHERE`, `JOIN`, or `ORDER BY`
- Composite indexes: left-prefix rule — put the most selective (high-cardinality) column first
- Cover frequently used queries with covering indexes (include all SELECT columns)
- Run `EXPLAIN ANALYZE` on every new/modified query to verify index usage
- Create indexes concurrently in production: `CREATE INDEX CONCURRENTLY` (Postgres) to avoid table locks

## Query Performance

- A single API request should execute ≤ 5 queries. More = missing JOIN or need to denormalize.
- N+1 detection: enable ORM query logging in tests, count queries per endpoint.
- Use `EXPLAIN ANALYZE` to check:
  - Seq Scan on large tables (missing index)
  - Hash Join on large datasets (consider optimization)
  - Sort operations (add index for ORDER BY)
  - High row estimates vs actuals (stale statistics → `ANALYZE`)

## Transactions

- Use for any operation modifying multiple tables
- Scope as narrowly as possible — don't hold locks during HTTP calls
- Read-only queries outside transactions (no unnecessary locking)
- Use optimistic locking (`version` column) for concurrent update scenarios:
  ```sql
  UPDATE orders SET status = 'confirmed', version = version + 1
  WHERE id = :id AND version = :expected_version
  ```

## Connection Pooling

- Pool size: `(number_of_cores * 2) + effective_spindle_count` — typically 10-20 per service instance
- Never unlimited connections
- Monitor pool usage — exhaustion causes cascading failures
- Use PgBouncer or application-level pooling for serverless environments

## Migration Safety

**Zero-downtime migration sequence (for breaking changes):**
1. Add new column with default value (backward compatible)
2. Deploy code that writes to BOTH old and new columns
3. Backfill existing data in batches (not in the migration)
4. Deploy code that reads from new column
5. Drop old column (separate migration, after verification)

**Rules:**
- Schema migrations must complete in < 30 seconds
- Data backfills in separate scripts, run in batches of 1000
- Always test `down` migration — verify rollback works
- Large table migrations: `ALTER TABLE ... ADD COLUMN ... DEFAULT` is fast in Postgres 11+ (metadata-only)
- Test with production-scale data volume

## Read Replicas

- Use for reporting, analytics, search queries
- Write to primary only
- Account for replication lag in application code — after write, read from primary for consistency
