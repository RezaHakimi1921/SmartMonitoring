#!/usr/bin/env bash
# Run once on the server as reza (will prompt for sudo password):
#   bash /var/www/monitoring/deploy/enable-nginx.sh
set -euo pipefail
CONF=/etc/nginx/snippets/monitoring.conf
SRC=/var/www/monitoring/deploy/nginx-monitoring.conf
SITE=/etc/nginx/sites-enabled/taskos

sudo cp "$SRC" "$CONF"
if ! grep -q 'snippets/monitoring.conf' "$SITE"; then
  sudo sed -i '/location \/api\//i\    include /etc/nginx/snippets/monitoring.conf;' "$SITE"
fi
sudo nginx -t
sudo systemctl reload nginx
echo "OK: http://192.168.210.196/monitoring/"
