import { initProvider } from '@imgly/plugin-utils-ai-generation';
import {
    createMinimaxProvider,
  createPixverseProvider,
  createRecraft20bProvider,
  createRecraftV3Provider
} from '.';
import { PluginConfiguration } from './type';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

type Model =
  | 'recraft-v3'
  | 'recraft-20b'
  | 'pixverse-v3.5-text-to-video'
  | 'minimax/video-01-live/image-to-video';

async function initFalProvider(
  model: Model,
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
) {
  switch (model) {
    case 'recraft-v3': {
      const provider = createRecraftV3Provider(config, cesdk);
      return initProvider(
        provider,
        {
          cesdk,
          engine: cesdk.engine
        },
        {
          debug: config.debug
        }
      );
    }

    case 'recraft-20b': {
      const provider = createRecraft20bProvider(config);
      return initProvider(
        provider,
        {
          cesdk,
          engine: cesdk.engine
        },
        {
          debug: config.debug
        }
      );
    }

    case 'pixverse-v3.5-text-to-video': {
      const provider = createPixverseProvider(config);
      return initProvider(
        provider,
        {
          cesdk,
          engine: cesdk.engine
        },
        {
          debug: config.debug
        }
      );
    }

    case 'minimax/video-01-live/image-to-video': {
      const provider = createMinimaxProvider(config);
      return initProvider(
        provider,
        {
          cesdk,
          engine: cesdk.engine
        },
        {
          dryRun: true,
          debug: config.debug
        }
      );
    }
    default: {
      throw new Error(`Unknown model: ${model}`);
    }
  }
}

export default initFalProvider;
