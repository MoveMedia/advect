import { AdvectPlugin } from "../plugins";
import { AConstructor } from "../utils";

const zustandPlugin: AdvectPlugin = {
    ontemplate_build: function <T>(template: AConstructor<T>): T {
       
    }
}

export default zustandPlugin;