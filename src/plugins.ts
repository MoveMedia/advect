import { AConstructor, AdvectRenderFunction } from "./utils";
import AdvectBase from "./AdvectBase";
import { AdvectView } from "./AdvectView";

export interface AdvectPlugin{

    priorityOrAfter: number | string;
    priority: number;

    name: string;

    init?(existing:Map<string, AdvectPlugin>): void;
    discovered?($new:AdvectPlugin): void;
    built?(template: AConstructor<any>): any;
    loaded?(doc:Document): Document;


    /**
     * An Advect Base has been connected
     * @param el the AdvectBase that has been connected
     * this can be custom elements or templates, or adv-views
     */
    connected?(el:AdvectBase): void;
        /**
     * An Advect Base has been disconnected
     * @param el the AdvectBase that has been disconnected
     * this can be custom elements or templates, or adv-views
     */
    disconnected?(el:HTMLElement): void;
    
    /**
     * Called when a ref is hooked in the shadowDom
     * @param template 
     */
    refShadow?(ref:HTMLElement): void;
    /**
     * Called when a ref is hooked in the lightDom
     * @param template 
     */
    refLight?(ref:HTMLElement): void;

    /**
     * Only for adv-views this allows you to use a different template engine, or build your own
     * the default is mustache
     * @param name the name to match the renderer attribute
     * @param el the element to render
     */
    renderer?: AdvectRenderFunction

    rendered?(el:AdvectBase): void;

    mutated?(el:AdvectBase, mut:MutationRecord): void;
    
}


export class PluginSystem implements AdvectPlugin{
    priorityOrAfter = 0; // formality
    priority = 0; // formality
    name = "plugin_system";// formality
    plugins = new Map<string, AdvectPlugin>();
    
    getRenderer(name:string){ 
        console.log(Array.from(this.plugins.entries()));
        return this.plugins.get(name)?.renderer;
    }

    addPlugin( plugin: AdvectPlugin) {
        if (!plugin.name) {
            console.error("Plugin must have a name");
            return;
        }
        console.log(`Adding plugin ${plugin.name}`);
        this.plugins.set(plugin.name, plugin);
        this.discovered(plugin);
    }
    getPlugin(name: string) {
        return this.plugins.get(name);
    }

    removePlugin(name: string) {
        this.plugins.delete(name);
    }

    unfoldPlugins(){
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

        const plugins_list = Array.from(this.plugins.values()).sort((a,b) => a.priority - b.priority);
        return plugins_list;
    }


    discovered($new:AdvectPlugin): void{
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.discovered && plugin.name != $new.name) plugin.discovered($new);
        }
        if ($new.init) $new.init(this.plugins);
    };

    built(template: AConstructor<any>){
        let lastResult = template;
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.built) lastResult = plugin?.built(template);
        }
        return lastResult;
    };

    loaded(doc:Document){
       const plugins = 
       this.unfoldPlugins()
            .filter( p => p.loaded)
        
        let lastResult = doc;
        for (const plugin of plugins) {
            if (plugin.loaded) lastResult = plugin.loaded(lastResult);
        }
        return lastResult
    };


 
    connected(el:AdvectBase){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.connected) plugin.connected(el);
        }
    };

    disconnected?(el:HTMLElement){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.disconnected) plugin.disconnected(el);
        }
    };
    

    rendered(el:AdvectBase){    
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.rendered) plugin.rendered(el);
        }
    };

    mutated(el: AdvectBase, mut:MutationRecord): void {
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.mutated) plugin.mutated(el, mut);
        }
    }


    refShadow?(ref:HTMLElement){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.refShadow) plugin.refShadow(ref);
        }
    };
 
    refLight?(ref:HTMLElement){
        for (const plugin of this.unfoldPlugins()) {
            if (plugin.refLight) plugin.refLight(ref);
        }   
    };


}