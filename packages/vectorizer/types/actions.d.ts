import type CreativeEditorSDK from '@cesdk/cesdk-js';
/**
 * Apply the vectorization process to the image.
 */
/**
 * Triggers the vectiorize process.
 */
export declare function vectorizeAction(cesdk: CreativeEditorSDK, params: {
    blockId: number;
}): Promise<void>;
