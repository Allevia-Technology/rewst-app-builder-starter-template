#!/usr/bin/env node
/**
 * sync-libs.js — Sync libs to all connected projects and rebuild their dist/
 *
 * Run from bass template root after updating libs or after git pull:
 *   node sync-libs.js
 *
 * For each project in projects/ that has a build.js, runs its build.
 * Each project's build.js auto-pulls the latest src/ libs from this repo.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASS_ROOT = __dirname;
const PROJECTS_DIR = path.join(BASS_ROOT, 'projects');

if (!fs.existsSync(PROJECTS_DIR)) {
  console.log('No projects/ directory found. Run: node new-project.js <name>');
  process.exit(0);
}

const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
const projectDirs = entries.filter(e => e.isDirectory());

if (projectDirs.length === 0) {
  console.log('No projects found. Run: node new-project.js <name>');
  process.exit(0);
}

console.log(`\nSyncing libs + rebuilding ${projectDirs.length} project(s)...\n`);

let updated = 0;
let skipped = 0;
let failed = 0;

for (const entry of projectDirs) {
  const projectDir = path.join(PROJECTS_DIR, entry.name);
  const buildScript = path.join(projectDir, 'build.js');

  if (!fs.existsSync(buildScript)) {
    console.log(`  SKIP  ${entry.name}  (no build.js)`);
    skipped++;
    continue;
  }

  try {
    console.log(`--- ${entry.name} ---`);
    execSync('node build.js', { cwd: projectDir, stdio: 'inherit' });
    updated++;
  } catch (err) {
    console.error(`  FAIL  ${entry.name}: ${err.message}`);
    failed++;
  }

  console.log('');
}

const summary = [`${updated} rebuilt`];
if (skipped) summary.push(`${skipped} skipped`);
if (failed) summary.push(`${failed} failed`);
console.log(`Done: ${summary.join(', ')}`);
