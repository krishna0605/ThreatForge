# Backup & Disaster Recovery Strategy

## Database (Supabase)

| Item | Strategy | Frequency |
|------|----------|-----------|
| PostgreSQL data | Supabase automatic backups (Pro plan: PITR) | Daily / continuous |
| Schema | Versioned in `supabase-setup.sql` | On every schema change |
| RLS policies | Included in setup script | On every policy change |

**Manual backup:**
```bash
# Export via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

## File Uploads

Uploaded scan files are stored in the `uploads` Docker volume.

```bash
# Backup uploads volume
docker run --rm -v threatforge_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data

# Restore uploads volume
docker run --rm -v threatforge_uploads:/data -v $(pwd):/backup alpine \
  tar xzf /backup/uploads_YYYYMMDD.tar.gz -C /
```

## Redis

Redis stores ephemeral data (rate-limit counters, token blocklist). Data loss is acceptable — counters reset and blocked tokens are also checked against the database.

## Rollback Procedures

| Service | Platform | Rollback Method |
|---------|----------|-----------------|
| Frontend | Vercel | Dashboard → Deployments → Promote previous |
| Backend | Railway | Dashboard → Deployments → Rollback |
| ML Service | HF Spaces | `git revert HEAD && git push space main` |

## Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single service crash | < 1 min (auto-restart) | 0 (no data loss) |
| Full stack restart | < 5 min | 0 |
| Database corruption | < 1 hour | Last backup point |
| Secret compromise | < 30 min | Rotate + redeploy |
