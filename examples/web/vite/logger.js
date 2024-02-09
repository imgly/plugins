import { createLogger as createViteLogger } from "vite";


export const createLogger = () => {
    // We create a custom logger in order to filter messages that are persistent 
    const logger = createViteLogger();
    const originalWarning = logger.warn;

    logger.warn = (msg, options) => {
        if (msg.includes('[plugin:vite:resolve]')) return;
        originalWarning(msg, options);
    };
    return logger;
}