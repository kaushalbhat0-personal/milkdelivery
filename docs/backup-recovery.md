# Backup & Recovery

## Database

The application uses Neon PostgreSQL (serverless). Neon provides automatic backups via its point-in-time recovery (PITR) feature.

### Automatic Backups

- Neon retains a 7-day recovery window by default
- Backups are continuous via WAL archiving
- No manual backup configuration required

### Manual Backup

```bash
# Export full database
pg_dump "$DATABASE_URL" --no-owner --no-acl > backup-$(date +%Y-%m-%d).sql

# Export specific schema only
pg_dump "$DATABASE_URL" --schema-only --no-owner > schema-$(date +%Y-%m-%d).sql

# Export specific table
pg_dump "$DATABASE_URL" --table=customers --no-owner > customers-$(date +%Y-%m-%d).sql
```

### Restore

```bash
# Restore from dump
psql "$DATABASE_URL" < backup-2026-06-01.sql

# Restore to a different database (branch)
psql "$NEW_DATABASE_URL" < backup-2026-06-01.sql
```

### Neon Branching

Neon supports branching for safe testing:

1. In Neon Console, select your project
2. Go to **Branches**
3. Click **Create branch** — this forks the database at a point in time
4. Use the branch URL for testing without affecting production

## Migrations

### Applying Migrations

```bash
# Using the migration script (recommended for Neon)
npx tsx scripts/apply-migration.ts

# Using drizzle-kit (may hang on pooler URLs)
npx drizzle-kit migrate
```

### Migration Recovery

If a migration fails:

1. Identify the failed migration file in `drizzle/`
2. Check the apply-migration script for partial application
3. Manually revert with:

```sql
ALTER TABLE customers DROP COLUMN IF EXISTS delivery_start_date;
```

4. Fix the migration file and re-apply

### Rollback Strategy

Drizzle Kit does not support down migrations. To roll back:

1. Generate a reverse migration manually:

```sql
ALTER TABLE customers DROP COLUMN IF EXISTS delivery_start_date;
DROP INDEX IF EXISTS customers_delivery_type_idx;
```

2. Update the `_drizzle_migrations` table if tracking manually
3. Revert any related code changes

## Verification After Restore

After any restore or rollback:

```bash
# Run data integrity audit
npx tsx scripts/data-integrity-audit.ts

# Verify key pages load
# - /dashboard (admin)
# - /route (driver)
# - /delivery (admin)
```

## Environment Variables

Required for backup/restore:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Disaster Recovery

In case of catastrophic data loss:

1. Create a new Neon project
2. Restore from the latest backup dump
3. Update `DATABASE_URL` in `.env`
4. Run `npx tsx scripts/apply-migration.ts` to ensure schema is current
5. Verify with data integrity audit
6. Test with a single driver session
