# Operational Runbook

## Service Architecture

```
Frontend (Vercel/Docker:3000)
    → Backend (Railway/Docker:5000)
        → ML Service (HF Spaces/Docker:7860)
        → Redis (Docker:6379)
        → Supabase (Managed PostgreSQL)
```

## Startup Order

1. Redis
2. ML Service (waits for healthcheck)
3. Backend (waits for Redis + ML healthy)
4. Frontend (waits for Backend healthy)

```bash
# Start all services
docker compose up -d

# Check health status
docker compose ps

# View logs
docker compose logs -f backend
```

## Health Check Endpoints

| Service | URL | Expected |
|---------|-----|----------|
| Backend | `GET /api/health` | `200 {"status": "ok"}` |
| ML Service | `GET /health` | `200 {"status": "healthy"}` |
| Frontend | `GET /` | `200` |
| Redis | `redis-cli ping` | `PONG` |

## Common Issues & Fixes

### Backend returns 502/503
1. Check `docker compose logs backend`
2. Verify Supabase is reachable: `curl $SUPABASE_URL/rest/v1/`
3. Restart: `docker compose restart backend`

### ML Service timeout
1. Check `docker compose logs ml-service`
2. Large file analysis can take 30s+ — check file size limits
3. Restart: `docker compose restart ml-service`

### Redis connection refused
1. Check `docker compose logs redis`
2. If data corruption: `docker compose down redis && docker volume rm threatforge_redis-data && docker compose up -d redis`

### 401 Unauthorized on all endpoints
1. JWT secret mismatch — verify `JWT_SECRET_KEY` matches across restarts
2. Check token blocklist: restart backend to clear in-memory cache

## Secret Rotation

```bash
# 1. Generate new secrets
python -c "import secrets; print(secrets.token_hex(32))"

# 2. Update in deployment platform (Railway/Vercel/HF)
# 3. Redeploy all services
# 4. Existing JWTs will be invalidated (users must re-login)
```

## Manual Deploy

```bash
# Deploy single service
docker compose build backend
docker compose up -d backend

# Force rebuild (no cache)
docker compose build --no-cache backend
```

## Emergency Rollback

1. **Vercel:** Dashboard → Project → Deployments → click "..." → Promote to Production
2. **Railway:** Dashboard → Project → Deployments → Rollback
3. **HF Spaces:** `cd ml-service && git revert HEAD && git push space main`
4. **Docker Compose:** `git checkout HEAD~1 -- docker-compose.yml && docker compose up -d`

## Monitoring Checklist

- [ ] Backend `/api/health` returns 200
- [ ] ML `/health` returns 200
- [ ] Frontend loads in browser
- [ ] Login flow works end-to-end
- [ ] File upload + scan completes
- [ ] Redis `PING` returns `PONG`
