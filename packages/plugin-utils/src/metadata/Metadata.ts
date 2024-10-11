import { type CreativeEngine } from '@cesdk/cesdk-js';

class Metadata<V> {
  engine: CreativeEngine;

  key: string;

  constructor(engine: CreativeEngine, key: string) {
    this.engine = engine;
    this.key = key;
  }

  hasData(blockId: number): boolean {
    return (
      this.engine.block.isValid(blockId) &&
      this.engine.block.hasMetadata(blockId, this.key)
    );
  }

  get(blockId: number): V | undefined {
    if (this.hasData(blockId)) {
      return JSON.parse(this.engine.block.getMetadata(blockId, this.key));
    }
    return undefined;
  }

  set(blockId: number, value: V) {
    this.engine.block.setMetadata(blockId, this.key, JSON.stringify(value));
  }

  clear(blockId: number) {
    if (this.engine.block.hasMetadata(blockId, this.key)) {
      this.engine.block.removeMetadata(blockId, this.key);
    }
  }
}

export default Metadata;
