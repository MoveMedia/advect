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
#### Create webcomponents with Plain HTML
  ```html
  <!-- import advect -->
  <script src="advect.js"></script>
  
  <!-- 
    define a webcompnent with a template tag that has a "adv" attribute
    the id will become the tag of the new component in this case "my-btn"
   -->
<template id="simple-counter" adv>
    <div>
      <button ref onclick="refs.counter.data.count--">Subtract</button>`
      <adv-view ref="counter" onload="$this.data.count = 0">
        <output></output>
        <template>
          <span>
            {{ $self.data.count }} - 
          </span>
          <if check="$self.data.count < 10">
            Low Value
            <else />
            High Value
          </if>
        </template>
      </adv-view>
      <button ref onclick="refs.counter.data.count++">Add</button>
    </div>
  </template>


<simple-counter/>
  ```
- HTMX Compatibility 

