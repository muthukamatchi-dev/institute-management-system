# Database Backup Strategy

This system supports hybrid multi-tenancy:

1) Shared database (single DB, tenant_id column)
2) Dedicated databases per tenant

Backups should include both the shared database and all dedicated databases.

## Daily Backups via cron (Linux)

Create a backup folder:

```bash
mkdir -p /var/backups/ims
```

Create a backup script:

```bash
#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +"%Y-%m-%d")
BACKUP_DIR="/var/backups/ims"

# Shared DB
mysqldump -u root -p --single-transaction --routines --triggers ims_shared_db \
  | gzip > "${BACKUP_DIR}/ims_shared_db_${DATE}.sql.gz"

# Dedicated DBs
DEDICATED_DBS=$(mysql -u root -p -N -e "SHOW DATABASES LIKE 'ims\\_%\\_db'")
for db in $DEDICATED_DBS; do
  mysqldump -u root -p --single-transaction --routines --triggers "$db" \
    | gzip > "${BACKUP_DIR}/${db}_${DATE}.sql.gz"
done

# Optional: delete backups older than 14 days
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +14 -delete
```

Make it executable:

```bash
chmod +x /usr/local/bin/ims_backup.sh
```

Schedule it via cron (daily at 2:00 AM):

```bash
0 2 * * * /usr/local/bin/ims_backup.sh
```

## Windows Task Scheduler (optional)

Use PowerShell to call `mysqldump` similarly and schedule it daily.

## Notes

- Use a dedicated DB user with minimal privileges for backups.
- Store backups on a separate disk or secure object storage.
- Consider encryption-at-rest or server-side encryption.
