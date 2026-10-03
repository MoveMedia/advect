# AGENTS.md

Advect is a **browser runtime, not a build-time compiler**: on load it scans the DOM for
`<template advect="tag">` and registers custom elements. Components are single-file `.vue`
documents; the runtime fetches and parses them and follows component `import`s. There is no
root `package.json` or workspace; the three folders below are independent.

## Layout
- `project/` - core library `@advect/advect` (Bun + TypeScript). Entrypoint `project/src/advect.ts`; runtime DOM logic in `advect.element.ts`; types/config in `advect.lib.ts`.
- `extension/` - VS Code extension. It **vendors** the core into `extension/src/advect/`; after editing `project/src`, re-run `npm run copy:advect` from `extension/`.
- `site/` - Hono static demo served by Bun. The real app is `site/static/`; `site/static/components/**` are working Advect usage examples.

## Commands (Bun; run inside each folder)
- Core: `bun install`; `bun run build` (bundles `src/advect.ts` -> `project/dist/advect.js`); `bun run publish` (build, then npm, then JSR).
- Site: `bun install`; `bun run dev` (Hono at http://localhost:3000).
- Extension: `npm install`; `npm run compile` (tsc -> `out/`); `npm run watch`; `npm run lint` (ESLint).
- Core tests: `bun test` in `project/` (Bun test + `happy-dom` via `project/test/setup.ts`).

## Gotchas
- `project` scripts `build-site` and `debug` assume a `project/site/` folder that does not exist (the site is at repo-root `site/`), so both fail. `project/build.ts` writes to an absolute `/site/...` path and is wired to no script; use `bun run build`.
- Build outputs are tracked in git despite `.gitignore`: `project/dist/`, `extension/out/`, `site/static/advect/`. Rebuilding dirties the working tree.
- Stale infra: `.github/workflows/astro.yml` deploys an Astro project at `advect.org` (does not exist) and triggers on `master` while the default branch is `main`; root `.vscode/tasks.json` targets a nonexistent `advect.io/*.csproj`.
- `README.md` examples track the current Vue-style syntax.
- Version drift: `project/package.json` is 2.1.1, `project/jsr.json` is 2.1.0, and `jsr.json` includes a nonexistent `mod.ts`.

## Advect syntax (implemented)
- Component file (`.vue`): exactly **one** `<template advect="my-tag" root="light|shadow|none" shadow="open|closed">`. The template content is the layout; an optional `<datalist><option name type>` declares watched attrs and is stripped from the layout. The optional `<script setup>` (no `type`, no `export default`; a component renders without it) and `<style>` blocks are **top-level siblings** of the template, not children.
- `<script setup>` runs once with the element context injected as locals (`$state`, `state`, `$element`, `$refs`, `$attr`, `$internals`; declared names shadow them). All top-level declarations are auto-exposed to the template and top-level `onConnect`/`onDisconnect`/`onMove`/`onAdopt`/`onWatchedAttrChanged` functions are auto-wired as VM hooks. Only the injected `state`/`$state` proxies are reactive.
- Multiple top-level `<style>` blocks are concatenated; `@import` rules are hoisted to the top.
- Component imports: side-effect `import "./child.vue";` inside `<script setup>` loads/registers another component (resolved relative to the file URL). Every static import is removed from the wrapped body and non-component imports are hoisted to the module top; the body runs via a `data:` URL module.
- Entry point: `<script type="advect">import "./root.vue";</script>` in a page (the browser ignores `type="advect"`; the runtime parses its imports). `script[rel]` loading is removed.
- Directives are attributes: `v-if`/`v-else-if`/`v-else`, `v-for="(item, i) in list"`, `:attr`/`v-bind`, `@event`/`v-on`, `v-model`, `v-show`, `v-html`, `v-text`, `v-once`, `v-pre`, `v-slot`/`#name`, `ref="name"`, `{{ expr }}` interpolation.
- Expressions/scripts run via `new Function` and `data:` URL imports - unsandboxed, no build step.
- CSS `@property` syntax encodes `<`/`>` as `.-` / `-.` (`decodePropertySyntax`).
