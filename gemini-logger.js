#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const LOG_DIR = '.';
const LOG_BASE = 'GEMINI';
const LOGFILE = path.join(LOG_DIR, `${LOG_BASE}.log`);
const MD_FILE = path.join(process.cwd(), 'GEMINI.md');
const MAX_SUMMARY_LINES = 3;

// Asegura existencia de log
function appendLog(entry) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} | ${entry}\n`;
  fs.appendFileSync(LOGFILE, line, 'utf8');
}

// Extrae últimas N entradas del log
function getLastEntries(n) {
  if (!fs.existsSync(LOGFILE)) return [];
  const all = fs.readFileSync(LOGFILE, 'utf8').trim().split('\n').filter(Boolean);
  return all.slice(-n);
}

// Actualiza la sección resumen en GEMINI.md
function updateSummary() {
  if (!fs.existsSync(MD_FILE)) return;
  const md = fs.readFileSync(MD_FILE, 'utf8').split('\n');
  const summaryHeader = '## Gemini Activity Summary';
  const existingIndex = md.findIndex(l => l.trim() === summaryHeader);
  const lastEntries = getLastEntries(MAX_SUMMARY_LINES);
  const summaryBlock = [
    summaryHeader,
    '',
    'Este archivo no contiene el log completo. Las acciones se registran en `GEMINI.log` con timestamp UTC.',
    'Últimos cambios clave:'
  ];
  lastEntries.forEach(e => summaryBlock.push(`- ${e}`));
  summaryBlock.push(''); // línea en blanco al final

  if (existingIndex === -1) {
    // agregar al final
    md.push('', ...summaryBlock);
  } else {
    // reemplazar bloque existente (desde header hasta la siguiente línea vacía doble o final)
    // buscamos dónde termina el bloque: hasta la siguiente cabecera de nivel igual o final simple heurístico
    let end = existingIndex + 1;
    while (end < md.length && !md[end].startsWith('## ') ) end++;
    md.splice(existingIndex, end - existingIndex, ...summaryBlock);
  }

  fs.writeFileSync(MD_FILE, md.join('\n'), 'utf8');
}

// Observador
const watcher = chokidar.watch([
  'GEMINI.md',
  // puedes agregar más rutas si quieres capturar otras modificaciones,
  // p.ej. 'package.json', 'backend/package.json', etc.
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

// Rotación mensual simple (renombra si cambió de mes)
function rotateLogIfNeeded() {
  if (!fs.existsSync(LOGFILE)) return;
  const now = new Date();
  const currentSuffix = now.toISOString().slice(0,7); // YYYY-MM
  const desiredName = `${LOG_BASE}-${currentSuffix}.log`;
  const desiredPath = path.join(LOG_DIR, desiredName);
  const stats = fs.statSync(LOGFILE);
  const mtime = new Date(stats.mtime);
  const fileSuffix = mtime.toISOString().slice(0,7);
  if (fileSuffix !== currentSuffix) {
    // renombrar archivo antiguo y empezar uno nuevo
    fs.renameSync(LOGFILE, path.join(LOG_DIR, `${LOG_BASE}-${fileSuffix}.log`));
    fs.writeFileSync(LOGFILE, ``, 'utf8'); // nuevo archivo
    appendLog(`Rotación de log: creado nuevo log para ${currentSuffix}`);
    updateSummary();
  }
}

// Chequeo periódico de rotación
setInterval(rotateLogIfNeeded, 60 * 1000); // cada minuto

console.log('Gemini logger corriendo. Monitoreando GEMINI.md...');
