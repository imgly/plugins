export interface Logger {
    log: (message: string) => void ,
    trace: (message: string) => void
    debug: (message: string) => void,
    warn: (message: string) => void,
    error: (message: string) => void,
    
  }