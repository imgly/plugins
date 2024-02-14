import CreativeEditorSDK from '@cesdk/cesdk-js';
import Manifest from './manifest';
export interface PluginConfiguration {
}
export { Manifest };
declare const _default: () => {
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
};
export default _default;
export declare class I18N {
    #private;
    setTranslations(translations: any): void;
    t: {
        (key: string, fallback?: string | undefined): any;
        (key: string, fallback: string | undefined): string;
    };
}
export interface I18N {
    setTranslations: (translations: any) => void;
    translate(key: string, fallback: string | undefined): string;
}
export type I18NType = {
    i18n?: I18N;
};
export type Translations = {
    [locale: string]: object;
};
export declare function polyfill(sdk: CreativeEditorSDK): void;
