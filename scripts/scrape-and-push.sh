#!/bin/bash
# Esegue lo scraping localmente e pusha i dati aggiornati su GitHub.
# Immobiliare.it blocca gli IP datacenter (GitHub Actions),
# quindi questo script va eseguito dal tuo Mac.
#
# Uso:  ./scripts/scrape-and-push.sh
# Cron: Aggiungi al crontab per esecuzione settimanale:
#       0 8 * * 1 cd /Users/verre/Desktop/Start_up/Immobiliare/app && ./scripts/scrape-and-push.sh

set -euo pipefail

# Setup PATH per fnm/node
export PATH="/Users/verre/.fnm/node-versions/v24.16.0/installation/bin:$PATH"

cd "$(dirname "$0")/.."

echo "=== Veneto RE Cockpit — Aggiornamento dati ==="
echo ""

# 1. Scrape prezzi da Immobiliare.it
echo "▶ Scraping Immobiliare.it..."
npm run scrape:prices

# 2. Esporta database in JSON
echo ""
echo "▶ Esportazione JSON..."
npm run export:json

# 3. Commit e push
echo ""
echo "▶ Commit e push..."
git add data/immobiliare.db data/zones.json
if git diff --staged --quiet; then
  echo "  Nessun cambiamento nei dati."
else
  git commit -m "chore: update data from local scraping [$(date +%Y-%m-%d)]"
  git push
  echo "  ✓ Dati aggiornati e pushati!"
fi

echo ""
echo "=== Completato! Netlify ri-deployerà automaticamente. ==="
