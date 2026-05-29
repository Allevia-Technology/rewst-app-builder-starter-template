# Bass Template Hub + Nested Projects — Design Spec

**Date:** 2026-05-29
**Status:** Approved

---

## Problem

Core libs (`rewst-dom-builder.js`, `zip-graphql-js-lib-v3.js`, `rewst-override-tailwind.css`) are duplicated across every project with no sync mechanism. Updating the GraphQL lib or DOM builder requires manually touching every repo. Projects have drifted. There is no standard way to spin up a new project from the template.

---

## Solution Overview

`appbuilder-bass-template` becomes the **upstream hub**. Projects live as subfolders inside `projects/`, gitignored by the bass template, each with their own `.git`. Libs flow in one direction: `src/` → projects. Three scripts do all the work.

---

## Repository Structure

```
appbuilder-bass-template/              ← GitHub repo (source of truth)
  src/                                 ← canonical libs
    zip-graphql-js-lib-v3.js
    rewst-dom-builder.js
    rewst-override-tailwind.css
  pages/
    starter.js                         ← blank page template
    components.js                      ← kitchen sink reference
  dashboard-spa-main-template.html     ← skeleton shell
  build.js                             ← builds the bass template's own dist/
  new-project.js                       ← creates a new project in projects/
  sync-libs.js                         ← syncs libs to all connected projects + rebuilds their dist/
  .gitignore                           ← ignores projects/ wholesale
  CLAUDE.md
  README.md

  projects/                            ← gitignored, not tracked by bass template
    my-analytics-app/                  ← own .git repo
      src/                             ← copy of parent src/ (synced or severed)
      pages/                           ← project-specific pages
      dashboard-spa-main-template.html ← project's own shell (can diverge)
      build.js                         ← auto-syncs from ../../src/ then builds
      CLAUDE.md                        ← project-specific context for Claude
      README.md
      .gitignore
    ticket-search/                     ← own .git repo
      ...same structure...
```

---

## Scripts

### `new-project.js <project-name>` (bass template root)

Creates a new connected project. Run once to scaffold.

**What it does:**
1. Creates `projects/<name>/` directory
2. Copies from bass template:
   - `src/` (all 3 lib files)
   - `pages/starter.js`
   - `dashboard-spa-main-template.html`
3. Generates `build.js` (with auto-sync logic baked in — see below)
4. Generates `CLAUDE.md` with project name and placeholder sections
5. Generates `README.md` with project name and build instructions
6. Generates `.gitignore` (`dist/`, `.DS_Store`, `node_modules/`)
7. Runs `git init` inside the new project folder
8. Makes first commit: `"init: scaffolded from appbuilder-bass-template"`

**Usage:**
```bash
node new-project.js my-new-app
# → projects/my-new-app/ created, git initialized, ready to open in Claude Code
```

---

### `sync-libs.js` (bass template root)

The "push to all" command. Run after `git pull` to propagate lib updates to every connected project.

**What it does:**
1. Reads all subdirectories of `projects/`
2. For each subdirectory that contains a `build.js`:
   - Runs `node build.js` inside that project folder (the project's own build.js handles the lib copy from `../../src/` automatically)
3. Reports: which projects were updated, which were skipped, any errors

**Usage:**
```bash
# After pulling lib updates:
git pull
node sync-libs.js
# → all connected projects have fresh src/ + fresh dist/
```

---

### `build.js` (inside each project)

The single command for working inside a project. Auto-syncs then builds.

**What it does:**
1. Checks if `../../src/` exists (is this project still inside bass template?)
   - **YES (connected):** copies lib files from `../../src/` into `./src/`, logs which files were updated
   - **NO (severed):** skips sync, uses `./src/` as-is, prints a note that project is running standalone
2. Reads `dashboard-spa-main-template.html`, replaces `{{ MARKER }}` placeholders with contents of `src/` and `pages/`
3. Writes output to `dist/dashboard-spa-main-compiled.html`

**Usage:**
```bash
cd projects/my-app
node build.js
# → auto-synced from bass template src/ (if connected), dist/ updated
```

---

## Sever (Going Standalone)

No command needed. Just move the project folder out of `projects/`:

```bash
mv projects/my-app ~/Documents/code/my-app
```

Next time `node build.js` runs inside `my-app`, `../../src/` won't exist. It detects this, logs "running standalone", and uses local `./src/`. The project is now a fully independent repo. Its `src/` files are already there from the last sync.

To share or push to GitHub:
```bash
cd ~/Documents/code/my-app
git remote add origin <your-github-url>
git push -u origin main
```

---

## Top-Level `build.js` (bass template itself)

Unchanged from current behavior. Builds the bass template's own `dist/` — the kitchen sink reference that demonstrates all components. It does NOT touch `projects/`. It is the demo of the template, not a project builder.

---

## Lib Update Workflow

```
1. Edit src/rewst-dom-builder.js (or any lib) in bass template
2. git commit && git push
3. Users: git pull                    ← bass template src/ is now updated locally
4. Users: node sync-libs.js           ← libs copied to all projects + each dist/ rebuilt
   -- OR --
4. Users: cd projects/my-app && node build.js  ← same result for just one project
5. Paste dist/ file into Rewst App Builder     ← done
```

---

## CLAUDE.md Per Project (auto-generated by `new-project.js`)

```markdown
# <project-name>

Scaffolded from appbuilder-bass-template. Part of the hub+projects system.

## Build
`node build.js` — auto-syncs libs from bass template (if connected), compiles to dist/

## Sync libs across all projects
Run from bass template root: `node sync-libs.js`

## This project does
[describe what this project is for]

## Pages
- starter.js — rename and build out
```

---

## .gitignore for Bass Template (updated)

```
projects/
dist/
.DS_Store
node_modules/
```

---

## Constraints

- No npm, no bundler, no dev server — all scripts use Node.js built-ins only (`fs`, `path`, `child_process`)
- `sync-libs.js` uses `child_process.execSync` to run `node build.js` inside each project subfolder
- The `../../src/` path is relative and assumes projects live in `projects/` at exactly one level deep — if a project is moved deeper or out, it becomes severed (correct behavior)
- `new-project.js` and `sync-libs.js` must be run from the bass template root (they use `__dirname` to locate `src/` and `projects/`)

---

## Out of Scope

- Automatic git hooks for post-pull sync (too much hidden magic — explicit `node sync-libs.js` is better)
- Versioning or pinning of lib versions (copy-latest is the model)
- Automatic GitHub repo creation on `new-project.js` (user pushes when ready)
- Migrating existing projects into `projects/` (optional, not required)
