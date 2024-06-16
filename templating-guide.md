# Templating Guide
## Defining a template
### Adding markup
### Adding styles
### Rendering Views
When you need to do complex rendering the ```<advect-view>``` 
#### Twig / Blade / Liquid / JSX
If youre rendering your html with another engine their may be a collision between the Mustache template in your ```<advect-view>``` and your templating engine. to avoid this we use ```"[["  "]]"``` as tags in our mustache template There are you may need to wrap the section in your engines "raw" features this example is in twig

wrap your ```<advect-view>```  inside a ```{% verbatum %}``` like
```twig
<!--
    ... Other content 
-->
{% verbatum %}
    <advect-view id="stats" data-name="john" data-height="5'7" weight="100lb">
        Hey [[name]],
        your height is [[height]] and your weight is [[weight]]
    </advect-view>
{% endverbatum %}
```
   

