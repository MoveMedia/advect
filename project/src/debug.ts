const AdvectDebug =  {
    logging: import.meta.env.DEV,
    log: (message: string) => {
        if (AdvectDebug.logging) console.log(`[AdvDebug] ${message}`);
    },
    error: (message: string) => {
        if (AdvectDebug.logging)  console.error(`[AdvDebug] ${message}`);
    },
    warn: (message: string) => {
        if (AdvectDebug.logging)  console.warn(`[AdvDebug] ${message}`);
    },
    info: (message: string) => {
        if (AdvectDebug.logging) console.info(`[AdvDebug] ${message}`);
    },
    debug: (message: string) => {
        if (AdvectDebug.logging)  console.debug(`[AdvDebug] ${message}`);
    }
}

export default AdvectDebug;