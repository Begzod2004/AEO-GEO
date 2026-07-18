#!/usr/bin/env bash
# Nightly backup: Postgres (source of truth) + the media volume (uploaded
# documents). Qdrant is deliberately skipped — every vector is re-derivable
# from the documents, so backing it up would only duplicate them.
#
# Install (from the repo root on the server):
#   ln -sf /opt/aeo-geo/deploy/backup.sh /etc/cron.daily/aeo-geo-backup
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/aeo-geo}"
DEST="${DEST:-/root/backups/aeo-geo}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COMPOSE="docker compose -f $PROJECT_DIR/docker-compose.prod.yml"
STAMP="$(date +%F)"
LOG="$DEST/backup.log"

mkdir -p "$DEST"
log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }

log "backup started"

# Postgres — custom format so it restores with pg_restore -c.
if $COMPOSE exec -T postgres pg_dump -U aeo -d aeo -Fc > "$DEST/db-$STAMP.dump.part"; then
    mv "$DEST/db-$STAMP.dump.part" "$DEST/db-$STAMP.dump"
    log "postgres OK ($(du -h "$DEST/db-$STAMP.dump" | cut -f1))"
else
    rm -f "$DEST/db-$STAMP.dump.part"
    log "postgres FAILED"
    exit 1
fi

# Uploaded documents.
if $COMPOSE exec -T backend tar -cz -C /app media > "$DEST/media-$STAMP.tar.gz.part" 2>/dev/null; then
    mv "$DEST/media-$STAMP.tar.gz.part" "$DEST/media-$STAMP.tar.gz"
    log "media OK ($(du -h "$DEST/media-$STAMP.tar.gz" | cut -f1))"
else
    rm -f "$DEST/media-$STAMP.tar.gz.part"
    log "media FAILED (non-fatal)"
fi

find "$DEST" -name '*.dump' -o -name '*.tar.gz' -type f -mtime "+$KEEP_DAYS" -print -delete >> "$LOG" 2>&1 || true
log "backup finished; $(ls -1 "$DEST"/*.dump 2>/dev/null | wc -l) dumps retained"
