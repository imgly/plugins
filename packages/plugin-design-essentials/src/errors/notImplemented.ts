
export const notImplemented = (message?: string): never => {
    throw new Error(`Not implemented: ${message}`)
}