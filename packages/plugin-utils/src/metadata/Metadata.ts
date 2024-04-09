import type CreativeEditorSDK from '@cesdk/cesdk-js';

class Metadata<V> {
  cesdk: CreativeEditorSDK;

  key: string;

  constructor(cesdk: CreativeEditorSDK, key: string) {
    this.cesdk = cesdk;
    this.key = key;
  }

  hasData(blockId: number): boolean {
    return this.cesdk.engine.block.hasMetadata(blockId, this.key)
  }

  get(blockId: number): V | undefined {
    if (this.hasData(blockId)) {
      return JSON.parse(this.cesdk.engine.block.getMetadata(blockId, this.key));
    }
    return undefined;
  }

  set(blockId: number, value: V) {
    this.cesdk.engine.block.setMetadata(
      blockId,
      this.key,
      JSON.stringify(value)
    );
  }

  clear(blockId: number) {
    if (this.cesdk.engine.block.hasMetadata(blockId, this.key)) {
      this.cesdk.engine.block.removeMetadata(blockId, this.key);
    }
  }
}

export default Metadata;
