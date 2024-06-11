# Advect
Write plain html and unlock the power of web components NO BUILD STEP, and with as little "Magic" as possible,

I think every front end developer got hyped when when webcomponents were announced

Advect brings locality of behavior to web compenents.

Usually 

On the web we have 3 types of html content
- Plain Jane ht



## Installation
npm
```bash
npx jsr add @advect/advect
```
pnpm
```bash
pnpm dlx jsr add @advect/advect
```
bun
```bash
bunx jsr add @advect/advect
```
yarn
```bash
yarn dlx jsr add @advect/advect
```
deno
```bash
deno add @advect/advect
```

## Features
#### Create webcomponents with Plain HTML
  ```html
  <!-- import advect -->
  <script src="advect.js"></script>
  
  <!-- 
    define a webcompnent with a template tag that has a "adv" attribute
    the id will become the tag of the new component in this case "my-btn"
   -->
  <template id="my-btn" adv> 
    <!-- style the new compnent -->
    <style>
        :host{
            button {
                color:blue;
            }
        }
    </style>
    <button>
        <slot name="name">Default Name</slot>
        <slot name="icon">🤯</slot>
    </button>
  </template>

    <!-- Now your web compnent is ready to use -->
    <my-btn>
        <span slot="name">New icon / name</span>
        <span slot="icon">😉</span>
    </my-btn>

    <my-btn onclick="alert('unless you want to')">
        <span slot="name">No JS</span>
        <span slot="icon">😍</span>
    </my-btn>
  ```
- HTMX Compatibility 


### About
#### Philosophy
#### Goals
#### Motivations
#### Insprations
- HATEOS
- Lit, Alpine, 
