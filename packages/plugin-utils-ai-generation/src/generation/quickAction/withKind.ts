import type CreativeEditorSDK from "@cesdk/cesdk-js";
import { type Output,type  OutputKind } from "../provider";
import { ApplyCallbacks } from "./types";

type WithOptions = {
  kind: OutputKind;
  blockIds: number[];
  cesdk: CreativeEditorSDK;
};

type WithReturnValue<O extends Output> = {
  returnValue: O;
  applyCallbacks?: ApplyCallbacks;
};
function withKind<O extends Output>(
  fn: () => Promise<O>,
  options: WithOptions
): () => Promise<WithReturnValue<O>> {
  switch (options.kind) {
    case 'text':
      return () => withText(fn, options);
    case 'image':
      return () => withImage(fn, options);
    case 'video':
      return () => withVideo(fn, options);
    case 'audio':
      return () => withAudio(fn, options);
    default:
      throw new Error(`Unsupported output kind: ${options.kind}`);
  }
}

async function withText<O extends Output>(
  fn: () => Promise<O>,
  options: WithOptions
): Promise<WithReturnValue<O>> {
  const { cesdk, blockIds } = options;

  const beforeTexts = blockIds.map((blockId) => {
    return cesdk.engine.block.getString(blockId, 'text/text');
  });

  const output = await fn();
  if (output.kind !== 'text') {
    throw new Error('Output kind from generation is not text');
  }

  const onAfter = () => {
    options.blockIds.forEach((blockId) => {
      options.cesdk.engine.block.setString(blockId, 'text/text', output.text);
    });
  };
  const onBefore = () => {
    options.blockIds.forEach((blockId, i) => {
      options.cesdk.engine.block.setString(
        blockId,
        'text/text',
        beforeTexts[i]
      );
    });
  };
  const onCancel = onBefore;
  const onApply = onAfter;

  return {
    returnValue: output,
    applyCallbacks: {
      onBefore,
      onAfter,
      onCancel,
      onApply
    }
  };
}

async function withImage<O extends Output>(
  _fn: () => Promise<O>,
  _options: WithOptions
): Promise<WithReturnValue<O>> {
  // TODO: Implement withImage
  throw new Error('Function not implemented.');
}

async function withVideo<O extends Output>(
  _fn: () => Promise<Output>,
  _options: WithOptions
): Promise<WithReturnValue<O>> {
  throw new Error('Function not implemented.');
}

async function withAudio<O extends Output>(
  _fn: () => Promise<Output>,
  _options: WithOptions
): Promise<WithReturnValue<O>> {
  throw new Error('Function not implemented.');
}

export default withKind;
