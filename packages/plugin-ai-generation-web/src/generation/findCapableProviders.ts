import { QuickActionDefinition } from '../ActionRegistry';
import Provider, { Output, OutputKind } from './provider';

interface QuickActionCapability {
  quickActionId: string;
  kind: OutputKind;


}

function checkProvidersCapabilities<K extends OutputKind, I, O extends Output>({
  quickAction
}: {
  quickAction: QuickActionDefinition;
  provider: Provider<K, I, O>;
}): boolean {
  return false;
}

export default checkProvidersCapabilities;
