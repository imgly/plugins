import { CreativeEngine } from '@cesdk/cesdk-js';
import { PluginMetadata } from './types';
/**
 * Checks if a block is supported by the given CreativeEngine.
 * @param engine - The CreativeEngine instance.
 * @param blockId - The ID of the block to check.
 * @returns A boolean indicating whether the block is supported or not.
 */
export declare const isBlockSupported: (engine: CreativeEngine, blockId: number) => boolean;
/**
 * Sets the metadata for the plugin state.
 */
export declare function setPluginMetadata(engine: CreativeEngine, id: number, metadata: PluginMetadata): void;
/**
 * Returns the current metadata for the plugin state. If no metadata
 * is set on the given block, it will return an IDLE state.
 */
export declare function getPluginMetadata(engine: CreativeEngine, id: number): PluginMetadata;
/**
 * If plugin metadata is set, it will be cleared.
 */
export declare function clearPluginMetadata(engine: CreativeEngine, id: number): void;
/**
 * Detect if the block has been duplicated with processed or processing state.
 * In that case the plugin state is still valid, but blockId and fillId have changed.
 */
export declare function isDuplicate(engine: CreativeEngine, blockId: number, metadata: PluginMetadata): boolean;
/**
 * Fixes the metadata if the block has been duplicated, i.e. the blockId and
 * fillId will be updated to the current block/fill.
 *
 * Please note: Call this method only on duplicates (see isDuplicate).
 */
export declare function fixDuplicateMetadata(engine: CreativeEngine, blockId: number): void;
/**
 * Check if the image has a consisten metadata state. A inconsistent state is
 * caused by outside changes of the fill data.
 *
 * @returns true if the metadata is consistent, false otherwise
 */
export declare function isMetadataConsistent(engine: CreativeEngine, blockId: number): boolean;
/**
 * Recover the initial values to avoid the loading spinner and have the same
 * state as before the process was started.
 */
export declare function recoverInitialImageData(engine: CreativeEngine, blockId: number): void;
export declare class Scheduler<T> {
    #private;
    schedule(task: () => Promise<T>): Promise<T>;
}
export declare function registerAction(engine: CreativeEngine, label: string, callback: (params: any) => Promise<void>): void;
export declare function executeAction(label: string, params: any): Promise<void>;
