# AEO.GEO — production deploy runbook

Target: a single Linux VPS (2+ vCPU, 4+ GB RAM) with Docker + Docker Compose,
and two DNS records pointing at it:

| Record | Serves |
|---|---|
| `LANDING_DOMAIN` (e.g. `aeo.example.com`) | marketing landing (Next.js) |
| `APP_DOMAIN` (e.g. `app.aeo.example.com`) | dashboard SPA + Django API |

## 1. First deploy

```bash
git clone <repo> aeo-geo && cd aeo-geo
cp .env.prod.example .env
nano .env        # domains, DJANGO_SECRET_KEY, POSTGRES_PASSWORD, SMTP, AI keys

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo  # optional demo data
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Smoke check:

```bash
curl -H "Host: $APP_DOMAIN" http://localhost/api/health/     # {"status":"ok",...}
curl -H "Host: $LANDING_DOMAIN" http://localhost/ | head     # landing HTML
```

Safety notes baked in:
- Backend refuses to boot with `DEBUG=false` + the dev SECRET_KEY.
- Postgres/Redis/Qdrant are not exposed on the host.
- Same-origin API (proxy) — CORS not needed in production.
- `AEO_MODE=auto`: with no AI keys the product runs in mock mode; adding
  `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` to `.env` + `docker compose ... up -d`
  switches those providers live. No code changes.

## 2. TLS (Let's Encrypt)

Simplest: certbot on the host in front of the proxy.

```bash
sudo apt install certbot python3-certbot-nginx
# stop the container proxy on :80 OR run certbot in webroot mode; easiest:
# put PROXY_HTTP_PORT=8080 in .env, install host nginx as TLS terminator:
sudo certbot --nginx -d $LANDING_DOMAIN -d $APP_DOMAIN
```

Host-nginx server blocks then proxy to `127.0.0.1:8080` (the container proxy).
`SECURE_PROXY_SSL_HEADER` is already configured — Django trusts
`X-Forwarded-Proto` from the proxy.

## 3. Updating

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build   # migrate runs on start
```

## 4. Backups

- Postgres: `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U aeo aeo | gzip > backup-$(date +%F).sql.gz` (cron it daily).
- Qdrant volume (`qdrant_data`) can be re-built from Postgres content if lost
  (re-run document processing), but snapshotting the volume is cheaper.
- Media volume (`media_data`) holds uploaded source documents.

## 5. Ops crib sheet

```bash
docker compose -f docker-compose.prod.yml ps                     # health
docker compose -f docker-compose.prod.yml logs -f backend        # API logs
docker compose -f docker-compose.prod.yml logs celery-worker     # scans/crawls
docker compose -f docker-compose.prod.yml exec backend python manage.py shell
```

Emails: with `EMAIL_BACKEND` unset the app logs emails to the backend container
logs (fine for staging); set the SMTP vars for real delivery.

CI: `.github/workflows/ci.yml` runs backend tests + both frontend builds on
every push once the repo is on GitHub.
