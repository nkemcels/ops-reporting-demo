#!/usr/bin/env bash
# Build the static export and sync it to the server.
# Usage: ./deploy/deploy.sh            (defaults to the Contabo box)
#        DEPLOY_HOST=user@host ./deploy/deploy.sh
set -euo pipefail

HOST="${DEPLOY_HOST:-root@81.17.98.153}"
REMOTE_DIR="/var/www/ops-reporting-demo"

cd "$(dirname "$0")/.."
npm run build
# --delete keeps the remote folder an exact mirror of out/ (it is dedicated to this app).
rsync -az --delete out/ "$HOST:$REMOTE_DIR/"
echo "Deployed to $HOST:$REMOTE_DIR"
