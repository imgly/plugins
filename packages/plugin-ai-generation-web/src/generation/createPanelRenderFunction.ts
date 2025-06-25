import { BuilderRenderFunction } from '@cesdk/cesdk-js';
import {
  Output,
  OutputKind,
  PanelInputCustom,
  PanelInputSchema
} from './provider';
import { InitializationContext } from './types';
import createPanelRenderFunctionFromCustom from './createPanelRenderFunctionFromCustom';
import createPanelRenderFunctionFromSchema from './createPanelRenderFunctionFromSchema';

/**
 * Creates a panel render function based on the provided context, i.e. on the provider.
 */
async function createPanelRenderFunction<
  K extends OutputKind,
  I,
  O extends Output
>(
  context: InitializationContext<K, I, O>
): Promise<BuilderRenderFunction<any> | undefined> {
  if (context.panelInput == null) {
    return undefined;
  }

  switch (context.panelInput.type) {
    case 'custom': {
      return createPanelRenderFunctionFromCustom<K, I, O>(
        context as InitializationContext<K, I, O, PanelInputCustom<K, I>>
      );
    }

    case 'schema': {
      return createPanelRenderFunctionFromSchema<K, I, O>(
        context as InitializationContext<K, I, O, PanelInputSchema<K, I>>
      );
    }

    default: {
      if (context.config.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          // @ts-ignore
          `Invalid panel input type '${panelInput.type}' - skipping`
        );
      }
    }
  }
}

export default createPanelRenderFunction;
