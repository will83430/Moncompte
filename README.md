# MonCarnetCompte

Application de suivi financier personnel — style bancaire CIC, installable sur Android (APK natif via Capacitor).

## Structure du projet

```text
Moncompte/
├── index.html        ← Application principale
├── setup.html        ← Import / configuration initiale
├── js/
│   ├── app.js        ← Logique applicative complète
│   ├── pin.js        ← Gestion code PIN
│   └── storage.js    ← Chiffrement AES-256 + LocalStorage
├── css/app.css       ← Styles
├── www/              ← Copie compilée pour Capacitor (APK)
├── android/          ← Projet Android natif (hors git)
└── capacitor.config.json
```

## Fonctionnalités

### Dashboard

- Ajout de transactions (revenus / dépenses) avec 50+ catégories
- Recherche par libellé ou montant
- Filtres : type, catégorie, montant min/max
- Tri : date, montant, catégorie
- Dépenses récurrentes (import automatique en début de mois)
- Import relevé CIC (glisser-déposer CSV)

### Statistiques

- Graphique revenus / dépenses 3D — 3, 6 ou 12 mois
- Donut 3D cliquable par catégorie → liste des transactions
- Comparaison mois vs mois sur chaque indicateur

### Analyse

- Graphique évolution du solde 3D — 3, 6 ou 12 mois
- Solde bancaire réel (projection depuis un solde de référence)
- Catégories personnalisées (ajout / suppression)
- Export JSON / CSV
- Import JSON (restauration)

### Sécurité

- Code PIN à 4 chiffres obligatoire au démarrage
- Chiffrement **AES-GCM 256 bits** (Web Crypto API)
- Données stockées chiffrées dans le LocalStorage

### Android

- APK natif signé via Capacitor v6
- Widget écran d'accueil (solde du mois)
- Sauvegarde automatique après chaque modification
- Restauration automatique au démarrage si données vides
- Mise à jour sans désinstallation : `adb install -r app-release.apk`

## Installation APK sur Android

### Avec câble USB

```bash
adb install -r /chemin/vers/app-release.apk
```

### Via ADB WiFi (sans câble)

1. Paramètres → Options développeur → Débogage sans fil
2. Noter l'IP et le port affichés

```bash
adb connect 192.168.1.X:PORT
adb install -r app-release.apk
```

## Build APK

```bash
# Synchroniser les sources web vers www/
cp js/app.js www/js/app.js
cp css/app.css www/css/app.css
cp index.html www/index.html

# Sync Capacitor
npx cap sync android

# Compiler l'APK release signé
cd android && ./gradlew assembleRelease
# APK : android/app/build/outputs/apk/release/app-release.apk
```

Le keystore de signature est à `/home/will/moncompte.keystore` (hors git).

## Sauvegarde des données

Les données sont chiffrées dans le LocalStorage de la WebView Android.

- **Sauvegarde auto** : fichier `moncarnetcompte_backup.json` écrit après chaque modification — conservé lors des mises à jour via `adb install -r`
- **Export manuel** : Analyse → Export JSON → fichier daté dans Téléchargements
- **Avant désinstallation complète** : toujours exporter manuellement d'abord

## Branches

| Branche | Rôle |
| --- | --- |
| `main` | Production stable |
| `dev` | Développement général |
| `dev-donut3D` | Graphiques 3D (branche active) |
