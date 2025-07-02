import CreativeEditorSDK from '@cesdk/cesdk-js';
import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';

export type GetQuickActionDefinitionContext = {
  cesdk: CreativeEditorSDK;
};

export type GetQuickActionDefinition = (
  context: GetQuickActionDefinitionContext
) => QuickActionDefinition;
