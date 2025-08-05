#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const LOG_DIR = '.';
const LOG_BASE = 'CLAUDE';
const LOGFILE = path.join(LOG_DIR, `${LOG_BASE}.log`);
const MD_FILE = path.join(process.cwd(), 'CLAUDE.md');
const MAX_SUMMARY_LINES = 3;

function appendLog(entry) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} | ${entry}\n`;
  fs.appendFileSync(LOGFILE, line, 'utf8');
}

function getLastEntries(n) {
  if (!fs.existsSync(LOGFILE)) return [];
  const all = fs.readFileSync(LOGFILE, 'utf8').trim().split('\n').filter(Boolean);
  return all.slice(-n);
}

function updateSummary() {
  if (!fs.existsSync(MD_FILE)) return;
  const md = fs.readFileSync(MD_FILE, 'utf8').split('\n');
  const summaryHeader = '## Claude Activity Summary';
  const existingIndex = md.findIndex(l => l.trim() === summaryHeader);
  const lastEntries = getLastEntries(MAX_SUMMARY_LINES);
  const summaryBlock = [
    summaryHeader,
    '',
    'Este archivo no contiene el log completo. Las acciones se registran en `CLAUDE.log` con timestamp UTC.',
    'Últimos cambios clave:'
  ];
  lastEntries.forEach(e => summaryBlock.push(`- ${e}`));
  summaryBlock.push('');

  if (existingIndex === -1) {
    md.push('', ...summaryBlock);
  } else {
    let end = existingIndex + 1;
    while (end < md.length && !md[end].startsWith('## ')) end++;
    md.splice(existingIndex, end - existingIndex, ...summaryBlock);
  }

  fs.writeFileSync(MD_FILE, md.join('\n'), 'utf8');
}

const watcher = chokidar.watch([
  'CLAUDE.md',
  // Puedes agregar más archivos si Claude modifica otros
], {
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 }
});

watcher.on('change', filePath => {
  const relative = path.relative(process.cwd(), filePath);
  appendLog(`Archivo modificado: ${relative}`);
  updateSummary();
});

watcher.on('add', filePath => {
  const relative = path.relative(process.cwd(), filePath);
  appendLog(`Archivo agregado: ${relative}`);
  updateSummary();
});

watcher.on('unlink', filePath => {
  const relative = path.relative(process.cwd(), filePath);
  appendLog(`Archivo eliminado: ${relative}`);
  updateSummary();
});

function rotateLogIfNeeded() {
  if (!fs.existsSync(LOGFILE)) return;
  const now = new Date();
  const currentSuffix = now.toISOString().slice(0,7);
  const stats = fs.statSync(LOGFILE);
  const mtime = new Date(stats.mtime);
  const fileSuffix = mtime.toISOString().slice(0,7);
  if (fileSuffix !== currentSuffix) {
    fs.renameSync(LOGFILE, path.join(LOG_DIR, `${LOG_BASE}-${fileSuffix}.log`));
    fs.writeFileSync(LOGFILE, ``, 'utf8');
    appendLog(`Rotación de log: creado nuevo log para ${currentSuffix}`);
    updateSummary();
  }
}

setInterval(rotateLogIfNeeded, 60 * 1000);

console.log('Claude logger corriendo. Monitoreando CLAUDE.md...');
