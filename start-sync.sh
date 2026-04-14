#!/usr/bin/env bash
# ═══════════════════════════════════════════════════
#  MonCarnetCompte — Serveur de sync WiFi
#  Double-clic sur le bureau pour démarrer
# ═══════════════════════════════════════════════════

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MonCarnetCompte — Sync WiFi  ⚡    ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── Node.js 22 via nvm ───────────────────────────
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
  nvm use 22 --silent 2>/dev/null || nvm use default --silent 2>/dev/null
fi

NODE_VER=$(node --version 2>/dev/null || echo "introuvable")
echo "  ▸ Node.js : $NODE_VER"

# ── Détection téléphone USB (adb) ────────────────
ADB=$(which adb 2>/dev/null)
PHONE_CONNECTED=false

if [ -n "$ADB" ]; then
  DEVICES=$("$ADB" devices 2>/dev/null | grep -v "List of" | grep "device$")
  if [ -n "$DEVICES" ]; then
    echo "  ▸ Téléphone USB détecté — configuration du tunnel..."
    "$ADB" reverse tcp:7789 tcp:7789 2>/dev/null && \
      echo "  ✓ Tunnel USB actif  →  http://localhost:7789" || \
      echo "  ⚠ Tunnel USB échoué (essaie déverrouiller l'écran)"
    PHONE_CONNECTED=true
  else
    echo "  ▸ Pas de téléphone USB — mode WiFi"
  fi
else
  echo "  ▸ adb non trouvé — mode WiFi uniquement"
fi

echo ""

# ── Lancement du serveur ─────────────────────────
cd "$DIR"
echo "  ✓ Serveur démarré sur le port 7789"
echo "  ✓ QR code : http://localhost:7789/qr"
echo ""
echo "  ┌─ Ferme cette fenêtre pour arrêter le serveur ─┐"
echo ""

node sync-server.mjs

# Pause si le serveur s'arrête (affiche l'erreur)
echo ""
echo "  Le serveur s'est arrêté. Appuie sur Entrée pour fermer."
read
