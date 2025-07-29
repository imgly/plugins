// Re-export types from @privyid/ghostscript
export type { GSModule as EmscriptenModule } from '@privyid/ghostscript';
export type { FS as EmscriptenFS } from '@privyid/ghostscript';

// Type alias for compatibility
export type GhostscriptModuleFactory = typeof import('@privyid/ghostscript').default;