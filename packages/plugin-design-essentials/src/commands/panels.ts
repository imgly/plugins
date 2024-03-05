import { PluginContext } from '@imgly/plugin-core'

const panelIds = [
    '//ly.img.panel/settings',

    '//ly.img.panel/inspector',
    '//ly.img.panel/inspector/placeholderSettings',

    '//ly.img.panel/assetLibrary',
    '//ly.img.panel/assetLibrary.replace',

    '//ly.img.panel/inspector/image/adjustments',
    '//ly.img.panel/inspector/image/filters',
    '//ly.img.panel/inspector/image/effects',
    '//ly.img.panel/inspector/image/blurs',

    '//ly.img.panel/inspector/crop',
    '//ly.img.panel/inspector/adjustments',
    '//ly.img.panel/inspector/filters',
    '//ly.img.panel/inspector/effects',
    '//ly.img.panel/inspector/blur',
    '//ly.img.panel/inspector/trim',
    '//ly.img.panel/inspector/fill',
    '//ly.img.panel/inspector/fill/color',
    '//ly.img.panel/inspector/text/properties',
    '//ly.img.panel/inspector/stroke/properties',
    '//ly.img.panel/inspector/stroke/color',
    '//ly.img.panel/inspector/shadow',
    '//ly.img.panel/inspector/shadow/color',
    '//ly.img.panel/inspector/transform',
    '//ly.img.panel/inspector/editColor',
    '//ly.img.panel/inspector/colorLibrary',
  ];

export const panelSettingsOpen = async (ctx: PluginContext) => {
    const { ui } = ctx;
    ui?.openPanel("//ly.img.panel/settings")
}

export const panelSettingsClose = async (ctx: PluginContext) => {
    const { ui } = ctx;
    ui?.closePanel("//ly.img.panel/settings")
}



// export const panelInspectorOpen = async (ctx: PluginContext) => {
//     const { ui } = ctx;
//     ui?.openPanel("//ly.img.panel/inspector")
// }

// export const panelInspectorClose = async (ctx: PluginContext) => {
//     const { ui } = ctx;
//     ui?.closePanel("//ly.img.panel/inspector")
// }


// export const panelAssetLibraryOpen = async (ctx: PluginContext) => {
//     const { ui } = ctx;
//     ui?.openPanel("//ly.img.panel/asset-library")
// }
