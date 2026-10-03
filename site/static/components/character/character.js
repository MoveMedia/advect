
export function createCharacterRecord({name, age, height, image}) {
    return {
        id: crypto.randomUUID(),
        name,
        age,
        height,
        image,
        created : new Date().toISOString()
    }
}
/**
 * @typedef {ReturnType<typeof createCharacterRecord>} CharacterRecord 
 */


export class CharacterChannel {
    /** @type {BroadcastChannel} */
    static #broadcast = null
    static get broadcast(){
        if(CharacterChannel.#broadcast == null){
            CharacterChannel.#broadcast = new BroadcastChannel("character-data-channel");
        }
        return CharacterChannel.#broadcast;

    }
    static actions = {
        GET_CHARACTERS: 'getCharacters',
        ADD_CHARACTER: 'addCharacter',
        REMOVE_CHARACTER: 'removeCharacter',
        UPDATE_CHARACTER: 'updateCharacter'
    }
    static codes = {
        SUCCESS: "success",
        ERROR: "error"
    }
    static addCharacter(character) {
        CharacterChannel.broadcast.postMessage({
            action: CharacterChannel.actions.ADD_CHARACTER,
            result: character
        })
    }
    static removeCharacter(character) {
        CharacterChannel.broadcast.postMessage({
            action: CharacterChannel.actions.REMOVE_CHARACTER,
            result: character
        })
    }

    /**
     * 
     * @param {} characters 
     */
    static gotCharacters(characters) {
        CharacterChannel.broadcast.postMessage({
            action: CharacterChannel.actions.GET_CHARACTERS,
            result: characters
        })
    }

    static subscribe ( {onAdd, onRemove} ){
        const channel = new BroadcastChannel("character-data-channel");
        channel.onmessage = (event) => {
            const { action, result } = event.data;
            switch(action){
                case CharacterChannel.actions.ADD_CHARACTER:
                    onAdd(result);
                    break;
                case CharacterChannel.actions.REMOVE_CHARACTER:
                    onRemove(result);
                    break;
                case CharacterChannel.actions.GET_CHARACTERS:
                    CharacterChannel.gotCharacters(result);
                    break;
            }
        }
        return channel;
    }
     
}

export class CharacterDB {
    /** @type {IDBDatabase | null} */
    static db = null
    /**
     * @returns {Promise<IDBDatabase>}
     */
    static async getDb() {
        

        return new Promise((resolve, reject) => {
            if (CharacterDB.db == null) {
                
                const request = self.indexedDB.open("character-db");

                request.onsuccess = (event) => {
                    CharacterDB.db = event.target.result;
                    resolve(CharacterDB.db);
                }
                request.onerror = (event) => {
                    console.warn('Errored DB', event)
                    reject(event.target?.error?.message);
                }
                request.onupgradeneeded = async (event) => {
                    CharacterDB.db = event.target.result;
                    const characterStore = CharacterDB.db.createObjectStore("characters", {
                        autoIncrement: true,
                        keyPath: "id"
                    });
                    
                }

            }
            else {
                resolve(CharacterDB.db);
            }
        })
    }
    /**
     * 
     * @param {{name:string, age:number, height:number}} character
     * @returns {Promise<{data: CharacterRecord | null, result:string, message?:string }>}
     */
    static async addCharacter(character) {
        return new Promise(async (resolve, reject) => {
            const db = await CharacterDB.getDb();
            const transaction = db.transaction("characters", "readwrite");
            const characterStore = transaction.objectStore("characters");
            transaction.onsuccess = (event) => {
                const result = { data: event.target.result, result: CharacterChannel.codes.SUCCESS };
                resolve(result);
            }
            transaction.oncomplete = (event) => {
                const result = { data: null, result: CharacterChannel.codes.SUCCESS };
                CharacterChannel.addCharacter(character);
                resolve(result);
            }
            transaction.onerror = (event) => {
                const result = { data: null, result: CharacterChannel.codes.ERROR };
                CharacterChannel.addCharacter(character);
                reject(result);
            }
            characterStore.add(character);
        });
    } 
    static async removeCharacter(character) {
        const db = await CharacterDB.getDb();
        const transaction = db.transaction("characters", "readwrite");
        const characterStore = transaction.objectStore("characters");

    }

    static async getCharacters() {
        const db = await CharacterDB.getDb();
        const characterStore = db.transaction("characters","readwrite").objectStore("characters");
        const characters = characterStore.getAll();
        return new Promise((resolve, reject) => {
            characters.onsuccess = (event) => {
                resolve({data: event.target.result, result: CharacterChannel.codes.SUCCESS});
            }
            characters.onerror = (event) => {
                reject({data: null, result: CharacterChannel.codes.ERROR});
            }
        })
    }

}