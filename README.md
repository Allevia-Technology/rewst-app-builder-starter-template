# Rewst App Builder Template

A barebones starter template for building single-page apps on the Rewst App Builder platform.

**Author:** Nick Zipse

> **Disclaimer:** This project is a community contribution and is not an official Rewst product.

## Quick Start

### Use the template (build the example)
1. Clone this repo
2. Run `node build.js`
3. Copy `dist/dashboard-spa-main-compiled.html` into a **HTML component** in Rewst App Builder

### Start a new project
```bash
node new-project.js my-app-name
cd projects/my-app-name
node build.js
```

Creates `projects/my-app-name/` with its own git repo, pre-wired to auto-sync libs from this repo on every build.

### Update libs across all your projects
```bash
git pull                 # get latest libs
node sync-libs.js        # rebuild every project in projects/ with the latest
```

## What's Included

### Skeleton
- **Collapsible sidebar** with page navigation
- **Sticky header** that shrinks on scroll (subtitle hides, buttons go icon-only)
- **Toggle switch**, **Refresh button**, and **Filters button** in the header
- **Slide-out filter drawer** on the right with placeholder filter slots
- **Page switching** system — sidebar clicks swap pages and update the header

### Core Libraries (src/)
- **RewstDOM** (`rewst-dom-builder.js`) — UI component library: tables with sorting/search/pagination, metric cards, autocomplete, dropdowns, alerts, loading skeletons
- **RewstApp** (`zip-graphql-js-lib-v2-optimized.js`) — Rewst GraphQL API wrapper: run workflows, submit forms, fetch executions, manage orgs
- **Rewst Theme** (`rewst-override-tailwind.css`) — Rewst brand colors and component styles layered on Tailwind CSS

### Pages
- **Components** — Kitchen sink showing every available UI component (metric cards, tables, autocomplete, dropdowns, buttons, badges, alerts, colors, skeletons)
- **Starter** — Blank page with a welcome card and commented examples to get you going

## Project Structure

```
├── dashboard-spa-main-template.html   # HTML shell with {{ MARKER }} placeholders
├── build.js                           # Builds the template's own example dist/
├── new-project.js                     # Creates a new project in projects/
├── sync-libs.js                       # Rebuilds all projects/ with latest libs
├── dist/
│   └── dashboard-spa-main-compiled.html  # Compiled output → paste into Rewst
├── src/                               # Canonical lib files (source of truth)
│   ├── rewst-dom-builder.js
│   ├── zip-graphql-js-lib-v2-optimized.js
│   └── rewst-override-tailwind.css
├── pages/
│   ├── components.js                  # Kitchen sink demo page
│   └── starter.js                     # Blank starter page
└── projects/                          # Your projects live here (gitignored)
    └── my-app/                        # Own git repo, auto-syncs from src/ on build
```

## How to Build

```bash
node build.js
```

The build script replaces `{{ MARKER }}` placeholders in the template with actual file contents and writes the result to `dist/`. No npm install needed.

## Adding New Pages

See [CLAUDE.md](CLAUDE.md) for step-by-step instructions on adding pages, using components, and avoiding gotchas.

## Markers

| Marker | Source File |
|--------|-------------|
| `{{ CSS_THEME }}` | src/rewst-override-tailwind.css |
| `{{ GRAPHQL_LIB }}` | src/zip-graphql-js-lib-v2-optimized.js |
| `{{ DOM_BUILDER }}` | src/rewst-dom-builder.js |
| `{{ PAGE_COMPONENTS }}` | pages/components.js |
| `{{ PAGE_STARTER }}` | pages/starter.js |
