import { AConstructor, AdvectRenderFunction } from "./utils";
import AdvectBase from "./AdvectBase";

export interface AdvectPlugin{

    priorityOrAfter: number | string;
    priority: number;

    name: string;
    /**
     * 
     * @param existing the existing plugins
     */
    plugin_init?(existing:Map<string, AdvectPlugin>): void;

    /**
     * A new plugin has been discovered
     * @param $new the new plugin that has been discovered
     */
    plugin_discovered?($new:AdvectPlugin): void;
    /**
     * A new template has been built
     * @param template the Class that has been built
     * @returns the modified template class
     */
    template_built?(template: AConstructor<any> & any): any;
    /**
     * A new template document has been loaded
     * @param doc the document that has been loaded
     * @returns the modified document
     */
    template_loaded?(doc:Document): Document;

    /**
     * An AdvectsBase has been connected
     * @param el the AdvectBase that has been connected
     * this can be custom elements or templates, or adv-views
     */
    component_connected?(el:AdvectBase): void;
        /**
     * An Advect Base has been disconnected
     * @param el the AdvectBase that has been disconnected
     * this can be custom elements or templates, or adv-views
     */
    component_disconnected?(el:HTMLElement): void;
    
    /**
     * Called when a ref is hooked in the shadowDom
     * @param template 
     */
    ref_found?(ref:HTMLElement,base:AdvectBase): void;


    /**
     * Only for adv-views this allows you to use a different template engine, or build your own
     * the default is squirlly
     * @param name the name to match the renderer attribute
     * @param el the element to render
     */
    renderers?: Record<string, AdvectRenderFunction>
    view_rendered?(el:AdvectBase): void;
    component_mutated?(el:AdvectBase, mut:MutationRecord): void;
    
}


export class PluginSystem implements AdvectPlugin{
    priorityOrAfter = 0; // formality
    priority = 0; // formality
    name = "plugin_system";// formality
    plugins = new Map<string, AdvectPlugin>();
    #last_plugin_length = 0;
    #plugin_list: AdvectPlugin[] = [];
    getRenderer(name:string):AdvectRenderFunction | undefined{ 
        return this.unfoldPlugins()
            .map((plugin) => plugin.renderers)
            .find( r => r && r[name])?.[name]
    }

    addPlugin( plugin: AdvectPlugin) {
        if (!plugin.name) {
            console.error("Plugin must have a name");
            return;
        }
        this.plugins.set(plugin.name, plugin);
        this.plugin_discovered(plugin);
    }
    getPlugin(name: string) {
        return this.plugins.get(name);
    }

    removePlugin(name: string) {
        this.plugins.delete(name);
    }

    unfoldPlugins(){
        if (this.#last_plugin_length === this.plugins.size) {
            return this.#plugin_list;
        }
        for (const [name, plugin] of this.plugins.entries()) {
            if (typeof plugin.priorityOrAfter === "string") {
                const after = this.plugins.get(plugin.priorityOrAfter);
                if (after) {
                    plugin.priority = after.priority + 1;
                } else {
                    console.error(`Plugin ${name} depends on ${plugin.priorityOrAfter} which is not loaded`);
                }
            } else {
                plugin.priority = plugin.priorityOrAfter;
            }
        }
        this.#last_plugin_length = this.plugins.size;
        this.#plugin_list = Array.from(this.plugins.values()).sort((a,b) => a.priority - b.priority);
        return this.#plugin_list;
    }


    plugin_discovered($new:AdvectPlugin): void{
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.plugin_discovered && plugin.name != $new.name) plugin.plugin_discovered($new);
        }
        if ($new.plugin_init) $new.plugin_init(this.plugins);
    };

    template_built(template: AConstructor<any>){
        let lastResult = template;
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.template_built) lastResult = plugin?.template_built(template);
        }
        return lastResult;
    };

    template_loaded(doc:Document){
       const plugins = 
       this.unfoldPlugins()
            .filter( p => p.template_loaded)
        
        let lastResult = doc;
        for (const plugin of plugins) {
            if (plugin.template_loaded) lastResult = plugin.template_loaded(lastResult);
        }
        return lastResult
    };


 
    component_connected(el:AdvectBase){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.component_connected) plugin.component_connected(el);
        }
    };

    component_disconnected?(el:HTMLElement){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.component_disconnected) plugin.component_disconnected(el);
        }
    };
    

    view_rendered(el:AdvectBase){    
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.view_rendered) plugin.view_rendered(el);
        }
    };

    component_mutated(el: AdvectBase, mut:MutationRecord): void {
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.component_mutated) plugin.component_mutated(el, mut);
        }
    }


    ref_found?(ref:HTMLElement, base:AdvectBase){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.ref_found) plugin.ref_found(ref,base);
        }
    };


}