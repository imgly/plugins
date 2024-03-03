import { PluginContext } from "../../../plugin-core/types";

export const pluginRegisterCustomPanel = async (ctx: PluginContext, _params: { blockIds?: number[] }) => {
    const { ui } = ctx;
    ui?.unstable_registerCustomPanel('ly.img.foo', (domElement) => {
        domElement.appendChild(document.createTextNode('Hello World'));
        return () => {
            console.log('Apps disposer called');
        };
    });
}



export const pluginOpenCustomPanel = async (ctx: PluginContext, _params: { blockIds?: number[] }) => {
    const { ui } = ctx;
    ui?.openPanel('ly.img.foo');
}