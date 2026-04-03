#!/usr/bin/env node
/**
 * sync-server.mjs — Serveur de synchronisation WiFi MonCompte
 *
 * Usage: node sync-server.mjs
 *
 * Lance un serveur HTTP local sur le port 7789.
 * Affiche un QR code dans le terminal pour que le téléphone puisse
 * se connecter directement via l'IP locale.
 *
 * Endpoints:
 *   GET  /ping          → { ok: true }
 *   GET  /data          → renvoie le JSON de données du PC
 *   POST /data          → reçoit le JSON du téléphone, sauvegarde localement
 *   GET  /qr            → page HTML avec QR code (pour navigateur PC)
 */

import http   from 'http';
import fs     from 'fs';
import path   from 'path';
import os     from 'os';
import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const PORT      = 7789;
const DATA_FILE = path.join(process.cwd(), 'www', 'moncarnetcompte_backup.json');

// Token généré une fois au démarrage — à saisir dans l'app
const TOKEN = crypto.randomBytes(4).toString('hex'); // ex: a3f8c21b

// ── Trouver l'IP locale ───────────────────────────────────────
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of (ifaces ?? [])) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// ── QR code ASCII dans le terminal ───────────────────────────
async function printQr(url) {
  try {
    const QRCode = require('qrcode');
    const qr = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log(qr);
  } catch {
    console.log('(installe qrcode avec: npm install qrcode pour afficher le QR)');
  }
  console.log(`\n  URL : ${url}\n`);
}

// ── CORS headers ──────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── Vérification token ────────────────────────────────────────
function isAuthorized(req) {
  const auth = req.headers['authorization'] ?? '';
  return auth === `Bearer ${TOKEN}`;
}

// ── Serveur HTTP ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const url = new URL(req.url, `http://localhost`);

  // GET /ping
  if (req.method === 'GET' && url.pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ts: Date.now() }));
    return;
  }

  // GET /data → envoie les données PC
  if (req.method === 'GET' && url.pathname === '/data') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Token invalide' }));
      console.log('[!] Accès refusé /data (mauvais token)');
      return;
    }
    if (!fs.existsSync(DATA_FILE)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Pas de données PC disponibles' }));
      return;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(raw);
    console.log(`[→] Données PC envoyées au téléphone (${raw.length} octets)`);
    return;
  }

  // POST /data → reçoit les données du téléphone
  if (req.method === 'POST' && url.pathname === '/data') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Token invalide' }));
      console.log('[!] Accès refusé /data (mauvais token)');
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        JSON.parse(body); // valider JSON
        fs.writeFileSync(DATA_FILE, body, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        console.log(`[←] Données téléphone reçues → ${DATA_FILE} (${body.length} octets)`);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON invalide' }));
      }
    });
    return;
  }

  // GET /qr → page HTML avec QR code
  if (req.method === 'GET' && url.pathname === '/qr') {
    const ip = getLocalIp();
    const syncUrl = `http://${ip}:${PORT}`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>MonCompte Sync</title>
<style>body{font-family:sans-serif;text-align:center;padding:2rem;background:#f0f4f8}
h1{color:#1e3a5f}img{margin:1rem auto;display:block}code{background:#e2e8f0;padding:.2rem .5rem;border-radius:4px}</style>
</head>
<body>
<h1>MonCompte — Sync WiFi</h1>
<p>Scannez ce QR avec l'appli MonCompte sur votre téléphone :</p>
<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(syncUrl)}" width="250" height="250" alt="QR">
<p>Ou entrez manuellement : <code>${syncUrl}</code></p>
</body></html>`);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const ip = getLocalIp();
const baseUrl = `http://${ip}:${PORT}`;

server.listen(PORT, '0.0.0.0', async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  MonCompte — Serveur de synchronisation  ');
  console.log('══════════════════════════════════════════\n');
  await printQr(baseUrl);
  console.log('  Scannez le QR avec MonCompte sur Android');
  console.log(`\n  Token : ${TOKEN}  ← à saisir dans l'app`);
  console.log('  Ctrl+C pour arrêter\n');
  console.log(`  Page QR navigateur : http://localhost:${PORT}/qr\n`);
});
