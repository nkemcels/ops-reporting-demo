# Deployment

The preview is a static export (`npm run build` → `out/`) served by the host's
existing nginx. No container, port or background process is added.

## What lives on the server

| Item | Path |
|---|---|
| Site files | `/var/www/ops-reporting-demo/` |
| nginx site | `/etc/nginx/sites-available/ops-reporting.nkemtasoft.com` + symlink in `sites-enabled/` |
| TLS certificate | certbot certificate `ops-reporting.nkemtasoft.com` |
| Logs | `/var/log/nginx/ops-reporting-demo.*.log` |
| DNS | Cloudflare `A` record `ops-reporting` on nkemtasoft.com → server (proxied) |

## First-time setup

```bash
scp deploy/nginx.conf root@SERVER:/etc/nginx/sites-available/ops-reporting.nkemtasoft.com
ssh root@SERVER '
  mkdir -p /var/www/ops-reporting-demo &&
  ln -s /etc/nginx/sites-available/ops-reporting.nkemtasoft.com /etc/nginx/sites-enabled/ &&
  nginx -t && systemctl reload nginx'
./deploy/deploy.sh
# once DNS resolves:
ssh root@SERVER 'certbot --nginx -d ops-reporting.nkemtasoft.com --redirect'
```

## Updating

```bash
./deploy/deploy.sh
```

## Removing everything

```bash
ssh root@SERVER '
  certbot delete --cert-name ops-reporting.nkemtasoft.com --non-interactive
  rm /etc/nginx/sites-enabled/ops-reporting.nkemtasoft.com
  rm /etc/nginx/sites-available/ops-reporting.nkemtasoft.com
  nginx -t && systemctl reload nginx
  rm -rf /var/www/ops-reporting-demo /var/log/nginx/ops-reporting-demo.*'
```

Then delete the `ops-reporting` DNS record in Cloudflare.
