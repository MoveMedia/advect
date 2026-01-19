
export function createCharacterRecord({id, name, age, height, image}) {
    return {
        id,
        name,
        age,
        height,
        image,
    }
}
/**
 * @typedef {ReturnType<typeof createCharacterRecord>} CharacterRecord 
 */


export class CharacterChannel {
    broadcast = new BroadcastChannel("character-data-channel");
    static actions = {
        GET_CHARACTERS: 'getCharacters',
        ADD_CHARACTER: 'addCharacter'
    }
    static codes = {
        SUCCESS: "success",
        ERROR: "error"
    }
    addedCharacter(character) {
        this.broadcast.postMessage({
            action: CharacterChannel.actions.ADD_CHARACTER,
            data: character
        })
    }
    /**
     * 
     * @param {} characters 
     */
    gotCharacters(characters) {
        this.broadcast.postMessage({
            action: CharacterChannel.actions.GET_CHARACTERS,
            data: characters
        })
    }

}

export class CharacterDB {
    /** @type {CharacterChannel | null} */
    static channel = new CharacterChannel();
    /** @type {IDBDatabase | null} */
    static db = null
    /**
     * @returns {Promise<IDBDatabase>}
     */
    static async getDb() {
        CharacterDB.channel.broadcast.onmessage = (event) => { }

        return new Promise((resolve, reject) => {
            if (CharacterDB.db == null) {
                CharacterDB.channel = new CharacterChannel();
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
                        autoIncrement: true
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
            console.log('starting add')
            const db = await CharacterDB.getDb();
            const transaction = db.transaction("characters", "readwrite");
            const characterStore = transaction.objectStore("characters");
            transaction.onsuccess = (event) => {
                const result = { data: event.target.result, result: CharacterChannel.codes.SUCCESS };
                resolve(result);
            }
            transaction.oncomplete = (event) => {
                const result = { data: null, result: CharacterChannel.codes.SUCCESS };
                CharacterDB.channel.addedCharacter(character);
                resolve(result);
            }
            transaction.onerror = (event) => {
                const result = { data: null, result: CharacterChannel.codes.ERROR };
                CharacterDB.channel.addedCharacter(character);
                resolve(result);
            }
            characterStore.add(character);
        });
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
    static async seed() {
        const allChars = CharacterDB.getCharacters()
        if (allChars.length > 0) {
            return Promise.resolve();
        }
        const characters = [
            createCharacterRecord({id: 1, name: "That Guy", age:10, height:60, image:'https://picsum.photos/seed/1/200/300'}),
            createCharacterRecord({id: 2, name: "Mike Posner", age:24, height:60, image:'https://picsum.photos/seed/2/200/300'}),
            createCharacterRecord({id: 3, name: "Guy Richie", age:66, height:60, image:'https://picsum.photos/seed/3/200/300'}),
            createCharacterRecord({id: 4, name: "Blue Face", age:44, height:60, image:'https://picsum.photos/seed/4/200/300'}),
            createCharacterRecord({id: 5, name: "Ricky Martins", age:5, height:60, image:'https://picsum.photos/seed/5/200/300'}),
            createCharacterRecord({id: 6, name: "Banana Man", age:30, height:60, image:'https://picsum.photos/seed/6/200/300'}),
            createCharacterRecord({id: 7, name: "Drake", age:54, height:60, image:'https://picsum.photos/seed/7/200/300'}),
        ]
    
        return Promise.all(characters.map(c => CharacterDB.addCharacter(c)))
    }


}