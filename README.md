# MonCarnetCompte

Application de suivi financier personnel — style bancaire CIC, installable sur Android (APK natif via Capacitor).

## Stack technique

| Couche | Technos |
|--------|---------|
| Frontend | TypeScript + Vite |
| Mobile | Capacitor v8 (Android) |
| Tests | Vitest |
| Chiffrement | Web Crypto API (AES-GCM 256 bits + PBKDF2) |
| Stockage | LocalStorage chiffré + Filesystem Capacitor |
| Sync | Serveur HTTP Node (WiFi LAN, port 7789) |

## Structure du projet

```text
src/
├── core/       — logique métier pure (types, balance, virements, catégories, migrations)
├── ui/         — dashboard, stats, graphiques 3D, PIN, récurrentes
├── storage/    — chiffrement AES-GCM, persistence
└── services/   — backup, import CSV CIC, sync WiFi
www/            — build Vite (webDir Capacitor)
android/        — projet Android natif (hors git)
sync-server.mjs — serveur de sync WiFi (Node, port 7789)
tests/core/     — suites Vitest (balance, transfers, migrations, service)
```

## Fonctionnalités

### Dashboard
- Ajout de transactions (revenus / dépenses / virements) avec 50+ catégories
- Recherche par libellé, catégorie ou montant
- Dépenses récurrentes (import automatique en début de mois)
- Import relevé CIC (CSV)
- Mode Réel / Prévisionnel

### Statistiques
- Graphique revenus / dépenses 3D — 3, 6 ou 12 mois
- Donut 3D cliquable par catégorie

### Analyse
- Graphique évolution du solde 3D
- Export JSON / CSV
- Import JSON (restauration)

### Sécurité
- Code PIN 4 chiffres (PBKDF2 100k itérations)
- Chiffrement **AES-GCM 256 bits** (Web Crypto API natif)
- Clé jamais persistée

### Android
- APK natif signé via Capacitor v8
- Widget écran d'accueil : solde (vert/rouge), prévision fin de mois, barre budget, revenus/dépenses
- Sauvegarde auto Filesystem après chaque modification
- Restauration automatique au démarrage

### Sync WiFi PC ↔ Téléphone
- Authentification par token (affiché au démarrage du serveur)
- Sync automatique à chaque modification (debounce 5s)
- Boutons manuels Envoyer / Recevoir

```bash
# Lancer le serveur sur le PC
node sync-server.mjs

# Tunnel USB (si pas de WiFi commun)
adb reverse tcp:7789 tcp:7789
# Puis utiliser http://localhost:7789 dans l'app
```

## Build APK

```bash
# Prérequis : Node.js 22+ (nvm use 22)

# Build web
npx vite build

# Sync Capacitor + APK release signé
npx cap sync android
cd android && ./gradlew assembleRelease
# APK : android/app/build/outputs/apk/release/app-release.apk

# Installer sur le téléphone
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Keystore de signature : `/home/will/moncompte.keystore` (hors git — ne pas perdre).

## Tests

```bash
npx vitest run
```

## Sauvegarde des données

- **Auto** : `moncarnetcompte_backup.json` écrit après chaque modification (Filesystem Android)
- **Sync WiFi** : envoi automatique vers le PC à chaque modification
- **Export manuel** : Analyse → Export JSON
- **Mise à jour APK** : `adb install -r` conserve toutes les données (pas de `pm clear`)

## Branches

| Branche | Rôle |
|---------|------|
| `main` | Production stable |
| `v4` | Développement en cours |
| `v3` | Version précédente archivée |
