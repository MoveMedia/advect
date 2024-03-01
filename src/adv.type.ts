import { createStore } from "zustand/vanilla"

const html = String.raw;
const $window = (window as Window & any);

export type DocumentDataValidator<T> = (value: string) => {
    isValid: boolean;
    hasValue: boolean;
    parsedValue: T | null;
    error?: string
};

export interface DocumentDataRef<T> {
    id: string;
    type: DocumentDataType<T>;
    value?: T;
}

export interface DocumentDataType<T> {
    name: string;
    default: T;
    validator: DocumentDataValidator<T>;
    description: string;

}
export interface DocumentDataStore {
    types: Map<string, DocumentDataType<any>>;
    type: <T>(name: string, default_value: T, validator: DocumentDataValidator<T>, description: string) => boolean;
    values: Map<string, DocumentDataRef<any>>;
    value: <T>(name: string, typeName: string, initialVal?: T) => DocumentDataRef<T> | null;
}

const types = new Map<string, DocumentDataType<any>>();
types.set("string", {
    default: "",
    name: "string",
    description: "A string of characters",
    validator: (val: string) => {
        return {
            isValid: true,
            hasValue: val ? true : false,
            parsedValue: val
        }
    },
}).set("number", {
    default: 0,
    name: "number",
    description: "A number",
    validator: (val: string) => {
        const parsedValue = Number(val);
        const isValid = !Number.isNaN(parsedValue);
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue
        }
    },
}).set("boolean", {
    default: false,
    name: "boolean",
    description: "A boolean value",
    validator: (val: string) => {
        const isValid =
            val === "true" ||
            val === "false" ||
            val === "1" ||
            val === "0" ||
            false;

        const parsedValue = val === "true" || val === "1"
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue,
        };
    },
}).set("bigint", {
    default: 0n,
    name: "bigint",
    description: "A big integer",
    validator: (val: string) => {
        const parsedValue = BigInt(val);
        const isValid = !Number.isNaN(parsedValue);
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue
        }
    },
}).set("callback", {
    default: () => { },
    name: "callback",
    description: "A function",
    validator: (val: string) => {
        let parsedValue;
        try {
            parsedValue = adv.callbacks.get(val);
        }
        catch (e) {
            console.error(e);
        }
        const isValid = parsedValue instanceof Function;
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue,
        };
    }
}).set("record", {
    default: {},
    name: "record",
    description: "A key-value pair object",
    validator: (val: string) => {
        let parsedValue;
        try {
            parsedValue = adv.records.get(val);
        }
        catch (e) {
            console.error(e);
        }
        const isValid = parsedValue instanceof Object;
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue,
        };
    }
}).set("json", {
    default: null,
    name: "json",
    description: "A JSON object",
    validator: (val: string) => {
        let parsedValue;
        try {
            parsedValue = JSON.parse(val);
        }
        catch (e) {
            console.error(e);
        }
        const isValid = parsedValue instanceof Object;
        return {
            isValid,
            hasValue: val ? true : false,
            parsedValue,
        };
    }
});



export const $dds = $window.dds = createStore<DocumentDataStore>((set, get) => ({
    types,
    type: <T>(name: string, default_value: T, validator: DocumentDataValidator<T>, description: string) => {
        const state = get();
        const existingType = state.types.get(name);
        if (existingType) {
            console.warn(`Type ${name} already exists`);
            return false;
        }
        state.types.set(name, { name, default: default_value, validator, description });
        set({ types: state.types });
        return true
    },
    values: new Map<string, {id:string, type:string, value:any}>(),
    value: <T>(id: string, typeName: string, initialVal?: T) => {
        const state = get()
        const type = state.types.get(typeName);
        if (!type) {
            console.warn(`Type ${typeName} does not exist`);
            return null;
        }
        state.values.set(id, { id, type, value: initialVal });
        set({values: state.values});

        const newValue =
            new Proxy({
                id, type,
            }, {
                get: (target, prop) => {
                    const state = get();
                    if (prop === "value") return state.values.get(id).value ??  initialVal ?? type.default;
                    return null
                },
                set: (target, prop, value) => {
                    if (prop === "value") {
                        const state = get();
                        const { isValid, hasValue, parsedValue, error } = type.validator(value);
                        if (!isValid) {
                            console.warn(`Invalid value for ${id}: ${value}`);
                            return false
                        }
                        state.values.set(id, { id, type: typeName, value: parsedValue });
                        set({values: state.values});
                    }
                    return true
                }
            })

        return newValue;
    }
}));




