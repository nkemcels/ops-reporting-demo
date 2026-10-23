# Deployment

The preview is a static export (`npm run build` → `out/`) served by the host's
existing nginx. No container, port or background process is added.

## What lives on the server

| Item | Path |
|---|---|
| Site files | `/var/www/ops-reporting-demo/` |
| nginx site | `/etc/nginx/sites-available/ops-reporting-demo.epicrallytennis.com` + symlink in `sites-enabled/` |
| TLS certificate | certbot certificate `ops-reporting-demo.epicrallytennis.com` |
| Logs | `/var/log/nginx/ops-reporting-demo.*.log` |
| DNS | Cloudflare `A` record `ops-reporting-demo` → server (proxied) |

## First-time setup

```bash
scp deploy/nginx.conf root@SERVER:/etc/nginx/sites-available/ops-reporting-demo.epicrallytennis.com
ssh root@SERVER '
  mkdir -p /var/www/ops-reporting-demo &&
  ln -s /etc/nginx/sites-available/ops-reporting-demo.epicrallytennis.com /etc/nginx/sites-enabled/ &&
  nginx -t && systemctl reload nginx'
./deploy/deploy.sh
# once DNS resolves:
ssh root@SERVER 'certbot --nginx -d ops-reporting-demo.epicrallytennis.com --redirect'
```

## Updating

```bash
./deploy/deploy.sh
```

## Removing everything

```bash
ssh root@SERVER '
  certbot delete --cert-name ops-reporting-demo.epicrallytennis.com --non-interactive
  rm /etc/nginx/sites-enabled/ops-reporting-demo.epicrallytennis.com
  rm /etc/nginx/sites-available/ops-reporting-demo.epicrallytennis.com
  nginx -t && systemctl reload nginx
  rm -rf /var/www/ops-reporting-demo /var/log/nginx/ops-reporting-demo.*'
```

Then delete the `ops-reporting-demo` DNS record in Cloudflare.
