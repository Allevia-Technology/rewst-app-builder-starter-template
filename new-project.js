#!/usr/bin/env node
/**
 * new-project.js — Create a new connected project
 *
 * Run from bass template root:
 *   node new-project.js <project-name>
 *
 * Creates projects/<project-name>/ with full skeleton, git initialized.
 * The project's build.js auto-syncs libs from this repo's src/ on every build.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: node new-project.js <project-name>');
  console.error('Example: node new-project.js my-analytics-app');
  process.exit(1);
}

if (!/^[a-z0-9-_]+$/i.test(projectName)) {
  console.error('Project name must be letters, numbers, hyphens, or underscores only.');
  process.exit(1);
}

const BASS_ROOT = __dirname;
const PROJECTS_DIR = path.join(BASS_ROOT, 'projects');
const PROJECT_DIR = path.join(PROJECTS_DIR, projectName);

if (fs.existsSync(PROJECT_DIR)) {
  console.error(`Project "${projectName}" already exists at projects/${projectName}/`);
  process.exit(1);
}

console.log(`\nCreating project: ${projectName}\n`);

// Create directory structure
fs.mkdirSync(path.join(PROJECT_DIR, 'src'), { recursive: true });
fs.mkdirSync(path.join(PROJECT_DIR, 'pages'), { recursive: true });
fs.mkdirSync(path.join(PROJECT_DIR, 'dist'), { recursive: true });

// Copy src/ libs (all files)
const srcFiles = fs.readdirSync(path.join(BASS_ROOT, 'src'));
for (const file of srcFiles) {
  fs.copyFileSync(
    path.join(BASS_ROOT, 'src', file),
    path.join(PROJECT_DIR, 'src', file)
  );
}
console.log(`  src/ (${srcFiles.length} lib files)`);

// Copy pages
for (const page of ['starter.js', 'components.js']) {
  const src = path.join(BASS_ROOT, 'pages', page);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(PROJECT_DIR, 'pages', page));
    console.log(`  pages/${page}`);
  }
}

// Copy template HTML
fs.copyFileSync(
  path.join(BASS_ROOT, 'dashboard-spa-main-template.html'),
  path.join(PROJECT_DIR, 'dashboard-spa-main-template.html')
);
console.log(`  dashboard-spa-main-template.html`);

// Generate build.js with auto-sync logic baked in
const buildJs = `#!/usr/bin/env node
/**
 * Build script for ${projectName}
 *
 * Auto-syncs libs from bass template if this project is still inside projects/,
 * then compiles everything into a single HTML file in dist/.
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const BASS_SRC = path.resolve(PROJECT_ROOT, '../../src');
const LOCAL_SRC = path.join(PROJECT_ROOT, 'src');
const TEMPLATE = path.join(PROJECT_ROOT, 'dashboard-spa-main-template.html');
const OUTPUT = path.join(PROJECT_ROOT, 'dist/dashboard-spa-main-compiled.html');

console.log('\\nBuilding ${projectName}...\\n');

// Auto-sync libs from bass template if connected
if (fs.existsSync(BASS_SRC)) {
  const files = fs.readdirSync(BASS_SRC);
  for (const file of files) {
    fs.copyFileSync(path.join(BASS_SRC, file), path.join(LOCAL_SRC, file));
  }
  console.log(\`  synced \${files.length} lib files from bass template\`);
} else {
  console.log('  standalone mode (bass template src/ not found, using local src/)');
}

// Map markers to source files
const MARKERS = {
  '{{ CSS_THEME }}':      'src/rewst-override-tailwind.css',
  '{{ GRAPHQL_LIB }}':   'src/zip-graphql-js-lib-v2-optimized.js',
  '{{ DOM_BUILDER }}':   'src/rewst-dom-builder.js',
  '{{ PAGE_COMPONENTS }}': 'pages/components.js',
  '{{ PAGE_STARTER }}':  'pages/starter.js',
};

let template = fs.readFileSync(TEMPLATE, 'utf8');
let count = 0;

for (const [marker, filePath] of Object.entries(MARKERS)) {
  if (!template.includes(marker)) continue;
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  template = template.replaceAll(marker, () => content);
  if (content) {
    console.log(\`  \${marker} -> \${filePath}\`);
    count++;
  }
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, template);

const sizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
console.log(\`\\nDone: dist/dashboard-spa-main-compiled.html (\${sizeKB} KB)\`);
console.log('Paste dist/ file into Rewst App Builder HTML component.');
`;
fs.writeFileSync(path.join(PROJECT_DIR, 'build.js'), buildJs);
console.log(`  build.js (with auto-sync)`);

// Generate .gitignore
fs.writeFileSync(path.join(PROJECT_DIR, '.gitignore'), [
  'dist/',
  '.DS_Store',
  'node_modules/',
].join('\n') + '\n');
console.log(`  .gitignore`);

// Generate CLAUDE.md
fs.writeFileSync(path.join(PROJECT_DIR, 'CLAUDE.md'), `# ${projectName}

Scaffolded from appbuilder-bass-template. Part of the hub+projects system.

## Build
\`node build.js\` — auto-syncs libs from bass template (if connected), compiles to \`dist/dashboard-spa-main-compiled.html\`

To rebuild all connected projects at once, run from bass template root:
\`node sync-libs.js\`

## This project does
[describe what this project is for]

## Pages
- \`pages/starter.js\` — rename this and build out your first page
- \`pages/components.js\` — kitchen sink reference (read-only, gets overwritten on sync)
`);
console.log(`  CLAUDE.md`);

// Generate README.md
fs.writeFileSync(path.join(PROJECT_DIR, 'README.md'), `# ${projectName}

Built on appbuilder-bass-template. Compiles into a single HTML file for Rewst App Builder.

## Build

\`\`\`bash
node build.js
\`\`\`

Output: \`dist/dashboard-spa-main-compiled.html\` — paste this into Rewst App Builder's HTML component.

Libs are auto-synced from the bass template on every build (while this project lives in \`projects/\`).

## Go standalone

Move this folder out of \`projects/\` and it runs independently — \`build.js\` will detect it
has no bass template parent and use the local \`src/\` copy instead.
`);
console.log(`  README.md`);

// Git init + first commit
console.log('\nInitializing git repo...');
execSync('git init', { cwd: PROJECT_DIR, stdio: 'pipe' });
execSync('git add .', { cwd: PROJECT_DIR, stdio: 'pipe' });
execSync(
  'git commit -m "init: scaffolded from appbuilder-bass-template"',
  { cwd: PROJECT_DIR, stdio: 'pipe' }
);
console.log('  git init + first commit done');

console.log(`
Project ready: projects/${projectName}/

Next:
  cd projects/${projectName}
  node build.js
  Open this folder in Claude Code to start building.
`);
