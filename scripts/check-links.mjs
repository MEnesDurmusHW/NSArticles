#!/usr/bin/env node
// Tüm HTML dosyalarındaki göreli src/href referanslarının gerçek bir dosyaya
// çözümlendiğini doğrular. Kullanım: node scripts/check-links.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const SKIP = /^(https?:)?\/\/|^#|^mailto:|^tel:|^data:|^javascript:/i;
let broken = 0;

for (const file of htmlFiles(ROOT)) {
  const html = readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (SKIP.test(ref)) continue;
    if (/['+\s]/.test(ref)) continue; // JS içinde dinamik kurulan URL parçaları
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = resolve(dirname(file), clean);
    if (!existsSync(target)) {
      broken++;
      console.log(`KIRIK  ${file.slice(ROOT.length + 1)}  ->  ${ref}`);
    }
  }
}

if (broken === 0) console.log('Tüm göreli referanslar geçerli.');
else { console.log(`\n${broken} kırık referans.`); process.exit(1); }
