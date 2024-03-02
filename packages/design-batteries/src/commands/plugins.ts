import { PluginContext } from "@imgly/plugin-api-utils";

export const pluginRegisterAndOpenCustomPanel = async (ctx: PluginContext, _params: { blockIds?: number[] }) => {
    const { ui } = ctx;
    ui?.unstable_registerCustomPanel('ly.img.foo', (domElement) => {
        domElement.appendChild(document.createTextNode('Hello World'));
        return () => {
            console.log('Apps disposer called');
        };
    });

    ui?.openPanel("ly.img.foo")
}

