# Templating Guide
 Templates can be placed inside of a inline templating tag
## Recipes
### Metaframeworks 
#### Astro
#### Next
#### Nuxt
#### Svelte
#### Solid
### Traditional backends
#### Twig
If your backend renders using Twig their may be a collision between the Mustache template in your ```<advect-view>``` and your twig template. There are 2 solutions
1. wrap your ```<advect-view>```  inside a ```{% verbatum %}``` like
```twig
<!--
    ... Other content 
-->
{% verbatum %}
    <advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
        Hey {{name}},
        your height is {{height}} and your weight is {{weight}}
    </advect-view>
{% endverbatum %}
   ```
2. Embrace replace "{{" and "}}" in your ```<advect-view>```  with "\[\[" and "]]" like
```twig
<!--
    ... Other content 
-->
<advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
    Hey [[name]],
    your height is {{height}} and your weight is [[weight]]
</advect-view>
```
#### Liquid
If your backend renders using Liquid their may be a collision between the Mustache template in your ```<advect-view>``` and your liquid template. There are 2 solutions
1. wrap your ```<advect-view>```  inside a ```{% raw %}``` like
```liquid
<!--
    ... Other content 
-->
{% raw %}
<advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
    Hey {{name}},
    your height is {{height}} and your weight is {{weight}}
</advect-view>
{% endraw %}
```
2. Embrace replace "{{" and "}}" in your ```<advect-view>```  with "\[\[" and "]]" like
```twig
<!--
    ... Other twig content 
-->
<advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
    Hey [[name]],
    your height is {{height}} and your weight is [[weight]]
</advect-view>
```
#### Blade
If your backend renders using Blade their may be a collision between the Mustache template in your ```<advect-view>``` and your liquid template. There are 2 solutions
1. wrap your ```<advect-view>```  inside a ```{% raw %}``` like
```blade
<!--
    ... Other twig content 
-->
@verbatim
    <advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
        Hey {{name}},
        your height is {{height}} and your weight is {{weight}}
    </advect-view>
@endverbatim
```
2. Embrace replace "{{" and "}}" in your ```<advect-view>```  with "\[\[" and "]]" like
```twig
<!--
... Other twig content 
-->
<advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
    Hey [[name]],
    your height is {{height}} and your weight is [[weight]]
</advect-view>
```
   

