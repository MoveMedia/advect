import { AConstructor } from "./utils";

export interface AdvectPlugin{
    ontemplate_build<T>(template:AConstructor<T>) : T;
}