# KubeGram Database Backup Management

This directory contains automated database backups created by the KubeGram Database Manager.

## 📁 Backup File Structure

Each backup consists of multiple files:

```
kubegram_backup_YYYYMMDD_HHMMSS.sql       # Main SQL backup file
kubegram_backup_YYYYMMDD_HHMMSS.json      # Backup metadata
kubegram_backup_YYYYMMDD_HHMMSS_tables.txt # List of backed-up tables
```

## 🔧 Backup Management

### Automatic Rotation
- **Maximum backups**: 2 (most recent)
- **Cleanup**: Older backups are automatically removed
- **Location**: `scripts/backups/`

### Manual Management

#### List Backups
```bash
make clear-db          # Interactive -> Select "List Backups"
./scripts/clear-database.sh --status-only
```

#### Create Backup
```bash
make db-backup
npm run db:backup
./scripts/clear-database.sh --backup-only
```

#### Restore Backup
```bash
make restore-db
npm run db:restore
./scripts/restore-database.sh
```

## 📊 Backup Metadata

Each backup includes comprehensive metadata:

```json
{
  "backup_id": "kubegram_backup_20260208_202847",
  "timestamp": "2026-02-08T20:28:47Z",
  "database": "kubegram",
  "container": "kubegram-server-postgres-1",
  "tables_backed_up": ["companies", "users", "projects", ...],
  "total_records": 150,
  "total_size_mb": 2.3,
  "checksum": "sha256:a1b2c3d4e5f6..."
}
```

## 🔐 Security & Integrity

### Checksums
- **Algorithm**: SHA-256
- **Verification**: Automatic during restore
- **Storage**: In metadata JSON file

### Access Control
- Backups inherit system file permissions
- Regular files (no special permissions)
- Local storage only (no cloud sync)

## 🚨 Emergency Procedures

### Manual Restore
If automated restore fails:

1. Stop application: `docker-compose down`
2. Restore manually: 
   ```bash
   docker exec -i kubegram-server-postgres-1 psql -U postgres -d kubegram < backup_file.sql
   ```
3. Restart application: `docker-compose up -d`

### Backup Verification
Verify backup integrity manually:
```bash
# Check file exists and is readable
ls -la scripts/backups/kubegram_backup_*.sql

# Verify checksum
shasum -a 256 backup_file.sql
```

## 📅 Backup Lifecycle

### Creation
- **Triggered**: Before any database clearing operation
- **Scope**: Full database (all tables)
- **Format**: Plain SQL with DROP/CREATE statements

### Retention
- **Keep**: 2 most recent backups
- **Cleanup**: Automatic during new backup creation
- **Exclusion**: Manual deletion not prevented

### Expiration
Old backups are automatically removed when:
1. Creating new backup (3rd backup exists)
2. Manual rotation triggered
3. Explicit cleanup requested

## 🔧 Troubleshooting

### Common Issues

#### "Permission denied"
```bash
# Fix permissions
chmod 755 scripts/backups/
chown -R $USER:$USER scripts/backups/
```

#### "No space left on device"
```bash
# Check disk space
df -h

# Clean old backups manually
rm scripts/backups/kubegram_backup_*.sql*
```

#### "Container not running"
```bash
# Check container status
docker ps | grep postgres

# Restart if needed
docker-compose up -d postgres
```

### Recovery from Failed Backup

1. **Identify issue**: Check error logs
2. **Find working backup**: Try previous backup
3. **Manual restore**: Use direct SQL restore
4. **Verify**: Check table counts and data

## 📞 Support

For backup-related issues:

1. **Check logs**: `docker-compose logs postgres`
2. **Verify connectivity**: `make db-status`
3. **Test backup**: `npm run db:backup`
4. **Contact**: Development team with error details

---

**Important**: This directory should be included in your system backup strategy!
Consider copying backups to external storage regularly.