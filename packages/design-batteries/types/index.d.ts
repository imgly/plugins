import { PluginContext } from '@imgly/plugin-api-utils';
export interface PluginConfiguration {
}
declare const _default: (ctx: PluginContext, _config: PluginConfiguration) => {
    initializeUserInterface(): Promise<void>;
};
export default _default;
