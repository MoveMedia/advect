# Advect
Write plain html and unlock the power of web components NO BUILD STEP, and with as little "Magic" as possible,

I think every front end developer got hyped when when webcomponents were announced

Advect brings locality of behavior to web compenents.


On the web we have 3 types of html content
- Plain Jane html



## Installation

npm
```bash
npx i @advect/advect
```

## Features
#### Create webcomponents with Plain HTML and Vue syntax

  Components are single-file `.vue` documents: one `<template advect="...">`
  per file, with an optional `<script setup>` and `<style>` block as siblings
  of the template (just like a Vue SFC). The template content is the layout,
  and the `<script setup>` is optional.

  ```html
  <!-- my-counter.vue -->
  <template advect="my-counter" root="shadow" shadow="open">
    <button @click="$state.count--">Subtract</button>
    <output :class="{ low: state.count < 10 }" v-text="state.count"></output>
    <button @click="$state.count++">Add</button>
  </template>

  <script setup>
    $state.count = 0;
  </script>

  <style>
    output.low { color: red; }
  </style>
  ```

  `<script setup>` has no `export default` and no `type="module"`. It runs once
  with the element context injected as locals (`$state`, `state`, `$element`,
  `$refs`, `$attr`, `$internals`). Every top-level declaration is automatically
  exposed to the template, and top-level lifecycle functions
  (`onConnect`, `onDisconnect`, `onMove`, `onAdopt`, `onWatchedAttrChanged`)
  are wired up automatically:

  ```html
  <script setup>
    function greet() {
      return "hello " + state.name;
    }

    function onConnect() {
      $state.ready = true;
    }
  </script>
  ```

  Only the injected `state` and `$state` proxies are reactive (`$state` also
  schedules a render on write). Declaring your own `const state = {...}`
  shadows them and is plain, static data.

  A component with no `<script setup>` simply renders its template without a
  view-model (no lifecycle hooks):

  ```html
  <!-- static-badge.vue -->
  <template advect="static-badge" root="shadow" shadow="open">
    <span class="badge">New</span>
  </template>
  ```

  Load advect and import the components from your page. The `type="advect"`
  script is never executed by the browser; advect reads its imports and
  registers each component (one component per file).

  ```html
  <script src="advect.js" type="module"></script>
  <script type="advect">
    import "./my-counter.vue";
  </script>

  <my-counter></my-counter>
  ```

  A component can import other components from its own `<script setup>` with
  side-effect imports:

  ```html
  <script setup>
    import "./child.vue";
    import "./another-child.vue";

    $state.ready = true;
  </script>
  ```

  Supported template syntax: `{{ }}` interpolation, `v-if / v-else-if / v-else`,
  `v-for="(item, index) in list"` with `:key`, `v-bind`/`:attr`, `v-on`/`@event`
  (with `.stop .prevent .self .once .capture .passive` and key modifiers),
  `v-model` for native form controls, `v-show`, `v-html`, `v-text`, `v-once`,
  `v-pre`, and native named slots with `<template v-slot:name>`.
- HTMX Compatibility 

