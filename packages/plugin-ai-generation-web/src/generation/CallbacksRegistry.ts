import { ApplyCallbacks } from './getApplyCallbacks';

export type Callbacks = {
  /**
   * Callbacks for the confirmation process.
   */
  applyCallbacks?: ApplyCallbacks;

  /**
   * Callback when generation is cancelled.
   */
  onCancelGeneration?: () => void;
};

/**
 * Global registry for managing callbacks for quick action menus across different
 * components.
 */
export class CallbacksRegistry {
  /** Map storing all registered callbacks by their ID */
  private actions: Map<number, Callbacks> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Gets the singleton instance of the CallbacksRegistry.
   * Uses global object storage to ensure singleton across different bundle contexts.
   */
  public static get(): CallbacksRegistry {
    const globalKey = '__imgly_callbacks_registry__';
    const globalObj = (
      typeof window !== 'undefined' ? window : globalThis
    ) as any;

    if (!globalObj[globalKey]) {
      globalObj[globalKey] = new CallbacksRegistry();
    }
    return globalObj[globalKey];
  }

  /**
   * Registers apply callbacks in the registry.
   */
  public register(blockId: number, callbacks: Partial<Callbacks>) {
    const currentCallbacks = this.actions.get(blockId) ?? {};
    this.actions.set(blockId, {
      ...currentCallbacks,
      ...callbacks
    });
  }

  /**
   * Gets the callbacks for the given block id.
   */
  public get(blockId: number): Callbacks {
    return this.actions.get(blockId) ?? {};
  }
}

export default CallbacksRegistry;
