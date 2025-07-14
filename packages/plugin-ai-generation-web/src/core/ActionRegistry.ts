import {
  BuilderRenderFunctionContext,
  CreativeEngine,
  SceneMode,
  Scope
} from '@cesdk/cesdk-js';
import { OutputKind, Output } from './provider';
import { Result } from '../generation/createGenerateFunction';

/**
 * Base properties shared by all action definitions.
 */
interface BaseActionDefinition {
  /** Unique identifier for the action */
  id: string;
  /** Human-readable label for the action */
  label?: string;
  /** Detailed description of what the action does */
  description?: string;
  /** Optional metadata for additional information */
  meta?: Record<string, any>;
  /** The scene mode for which this action is only applicable */
  sceneMode?: SceneMode;
}

/**
 * Definition for a plugin action - a global action that can be invoked from apps, command palettes, etc.
 */
export interface PluginActionDefinition extends BaseActionDefinition {
  /** Action type discriminator */
  type: 'plugin';
  /** ID of the plugin that registered this action */
  pluginId: string;
  /** Function to execute the action */
  execute: () => void;
}

/**
 * Render context for quick actions with generation capability.
 */
export interface QuickActionRenderContext<Q = Record<string, any>> {
  /** Toggle between collapsed and expanded state */
  toggleExpand: () => void;
  /** Whether the quick action is currently expanded */
  isExpanded: boolean;
  /** Close the entire quick action popover */
  close: () => void;
  /** Generate output using the quick action input */
  generate: (
    input: Q,
    options?: { blockIds?: number[] }
  ) => Promise<Result<Output>>;
  /** The ID of the provider used for this quick action */
  providerId: string;
}

/**
 * Definition for a quick action - a context-sensitive action that operates on selected blocks.
 */
export interface QuickActionDefinition<Q extends Record<string, any>>
  extends BaseActionDefinition {
  /** Action type discriminator */
  type: 'quick';
  /** The kind of block this action operates on */
  kind: OutputKind;
  /**
   * Defines if the quick action is enabled or not by using the
   * feature api.
   */
  enable: boolean | ((context: { engine: CreativeEngine }) => boolean);
  /**
   * Define the necessary scopes for this quick action.
   */
  scopes?: Scope[];

  /**
   * Overrides the defaults for this quick action.
   */
  defaults?: {
    /** Should the generation be directly applied or does it need confirmation */
    confirmation?: boolean;
    /** Whether the block should be locked */
    lock?: boolean;
  };

  /** Render function for the quick action UI */
  render: (
    context: BuilderRenderFunctionContext<any> & QuickActionRenderContext<Q>
  ) => void;
}

/**
 * Union type of all supported action definitions.
 */
export type ActionDefinition =
  | PluginActionDefinition
  | QuickActionDefinition<Record<string, any>>;

/**
 * Event types for ActionRegistry subscriptions.
 */
export type ActionRegistryEventType = 'registered' | 'unregistered';

/**
 * Callback function for ActionRegistry subscriptions.
 */
export type ActionRegistrySubscriberCallback = (
  action: ActionDefinition,
  event: ActionRegistryEventType
) => void;

/**
 * Filters for querying and subscribing to specific types of actions.
 * Used by both getBy() and subscribeBy() methods.
 */
export interface ActionRegistryFilters {
  /** Filter by action type */
  type?: ActionDefinition['type'];
  /** Filter by plugin ID */
  pluginId?: string;
  /** Filter by action ID */
  id?: string;
  /** Filter by kind (only applicable for quick actions) */
  kind?: OutputKind;
}

/**
 * Global registry for managing plugin actions and quick actions.
 * Uses singleton pattern to ensure a single source of truth across the application.
 */
export class ActionRegistry {
  /** Map storing all registered actions by their ID */
  private actions: Map<string, ActionDefinition> = new Map();

  /** Map storing subscribers with their filters (null = subscribe to all) */
  private subscribers: Map<
    ActionRegistrySubscriberCallback,
    ActionRegistryFilters | null
  > = new Map();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Gets the singleton instance of the ActionRegistry.
   * Uses global object storage to ensure singleton across different bundle contexts.
   * @returns The ActionRegistry instance
   */
  public static get(): ActionRegistry {
    const globalKey = '__imgly_action_registry__';
    const globalObj = (
      typeof window !== 'undefined' ? window : globalThis
    ) as any;

    if (!globalObj[globalKey]) {
      globalObj[globalKey] = new ActionRegistry();
    }
    return globalObj[globalKey];
  }

  /**
   * Registers an action in the registry.
   * @param action The action definition to register
   * @returns A disposer function that unregisters the action when called
   */
  public register(action: ActionDefinition): () => void {
    this.actions.set(action.id, action);
    this.notifySubscribers(action, 'registered');

    return () => {
      if (this.actions.get(action.id) === action) {
        this.actions.delete(action.id);
        this.notifySubscribers(action, 'unregistered');
      }
    };
  }

  /**
   * Gets all registered actions.
   * @returns Array of all action definitions
   */
  public getAll(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  /**
   * Gets actions matching the specified filters with full type safety.
   * @param filters Object containing optional filters for type, pluginId, and id
   * @returns Array of matching actions, typed based on the type filter
   * @example
   * // Get all plugin actions
   * registry.getBy({ type: 'plugin' }) // Returns PluginActionDefinition[]
   *
   * // Get all actions from a specific plugin
   * registry.getBy({ pluginId: 'ai-image-generation' }) // Returns ActionDefinition[]
   *
   * // Get specific action by ID
   * registry.getBy({ id: 'generate-image' }) // Returns ActionDefinition[]
   *
   * // Combine filters
   * registry.getBy({ type: 'quick', pluginId: 'ai-text' }) // Returns QuickActionDefinition[]
   *
   * // Filter quick actions by kind
   * registry.getBy({ type: 'quick', kind: 'image' }) // Returns QuickActionDefinition[]
   */
  public getBy<
    T extends ActionDefinition['type'] | undefined = undefined
  >(filters: {
    /** Filter by action type */
    type?: T;
    /** Filter by plugin ID */
    pluginId?: string;
    /** Filter by action ID */
    id?: string;
    /** Filter by kind (only applicable for quick actions) */
    kind?: OutputKind;
  }): T extends ActionDefinition['type']
    ? Extract<ActionDefinition, { type: T }>[]
    : ActionDefinition[] {
    const results = this.getAll().filter((action) =>
      this.matchesFilters(action, filters)
    );

    return results as T extends ActionDefinition['type']
      ? Extract<ActionDefinition, { type: T }>[]
      : ActionDefinition[];
  }

  /**
   * Subscribes to all registry events (register/unregister).
   * @param callback Function to call when any action is registered or unregistered
   * @returns Unsubscribe function
   */
  public subscribe(callback: ActionRegistrySubscriberCallback): () => void {
    this.subscribers.set(callback, null);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribes to registry events for actions matching the specified filters.
   * @param filters Filters to match actions against
   * @param callback Function to call when matching actions are registered or unregistered
   * @returns Unsubscribe function
   * @example
   * // Subscribe to plugin actions only
   * registry.subscribeBy({ type: 'plugin' }, (action, event) => {
   *   console.log(`Plugin action ${action.id} was ${event}`);
   * });
   *
   * // Subscribe to actions from specific plugin
   * registry.subscribeBy({ pluginId: 'ai-image' }, (action, event) => {
   *   updateUIForPlugin(action, event);
   * });
   */
  public subscribeBy(
    filters: ActionRegistryFilters,
    callback: ActionRegistrySubscriberCallback
  ): () => void {
    this.subscribers.set(callback, filters);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notifies all relevant subscribers about an action event.
   * @param action The action that was registered or unregistered
   * @param event The type of event that occurred
   */
  private notifySubscribers(
    action: ActionDefinition,
    event: ActionRegistryEventType
  ): void {
    this.subscribers.forEach((filters, callback) => {
      // If no filters (null), notify for all actions
      if (filters === null) {
        callback(action, event);
        return;
      }

      // Check if action matches the filters
      if (this.matchesFilters(action, filters)) {
        callback(action, event);
      }
    });
  }

  /**
   * Checks if an action matches the given filters.
   * Used by both getBy() and subscribeBy() methods.
   * @param action The action to check
   * @param filters The filters to match against
   * @returns True if the action matches all filters
   */
  private matchesFilters(
    action: ActionDefinition,
    filters: ActionRegistryFilters
  ): boolean {
    if (filters.type && action.type !== filters.type) return false;
    if (
      filters.pluginId &&
      action.type === 'plugin' &&
      action.pluginId !== filters.pluginId
    )
      return false;
    if (filters.id && action.id !== filters.id) return false;
    if (filters.kind) {
      // Kind filter only applies to quick actions
      if (action.type !== 'quick') return false;
      if (action.kind !== filters.kind) return false;
    }
    return true;
  }
}
