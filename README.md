# MonCompte 💳

Application de suivi financier personnel — style bancaire CIC, installable sur mobile (PWA).

## 🌐 URL de l'appli
```
https://will83430.github.io/Moncompte/moncompte.html
```

## 📁 Structure du projet
```
Moncompte/
├── index.html        ← (à créer) redirige vers moncompte.html
├── moncompte.html    ← fichier principal de l'appli
└── README.md
```

## 🚀 Déploiement
Le site est hébergé sur **GitHub Pages** (branche `main`).

Toute modification pushée sur `main` est automatiquement déployée.

## 💻 Travailler en local avec VS Code

### 1. Cloner le repo
```bash
git clone https://github.com/will83430/Moncompte.git
cd Moncompte
```

### 2. Lancer un serveur local
```bash
# Avec Python
python -m http.server 8000

# Puis ouvrir dans le navigateur
http://localhost:8000/moncompte.html
```

### 3. Modifier et pusher
```bash
git add .
git commit -m "Mise à jour MonCompte"
git push
```

## 📱 Installation sur mobile
1. Ouvrir l'URL dans Chrome ou Opera
2. Menu ⋮ → **Ajouter à l'écran d'accueil** → **Installer**

## 🔧 Fonctionnalités
- ✅ Suivi revenus / dépenses
- ✅ Catégories style CIC
- ✅ Dépenses récurrentes
- ✅ Import relevé CIC (CSV)
- ✅ Graphiques (donut, barres 6 mois)
- ✅ Analyse & conseils automatiques
- ✅ Objectifs d'épargne
- ✅ Export CSV / JSON
- ✅ Code PIN & mode discret
- ✅ PWA installable sur mobile

## 💾 Données
Stockées en **LocalStorage** dans le navigateur (clé `mc4_txs`, `mc4_recs`, `mc4_goals`).
Utiliser **Export JSON** pour sauvegarder avant de vider le cache.
