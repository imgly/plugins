import { PluginContext } from './PluginContext';
import { Subscribable } from './Subscribable';
type Translation<K extends string | symbol | number> = Record<K, string>;
type Translations<K extends string | symbol | number = string> = {
    [locale: string]: Translation<K>;
};
export declare class I18N<K extends string | symbol> extends Subscribable<"register", Translations> {
    #private;
    constructor(ctx: PluginContext);
    setTranslations(translations: Translations): void;
    translate(key: K, fallback?: string | undefined): any;
    setLocale(locale: string): void;
    t: (key: K, fallback?: string | undefined) => any;
}
export type I18NType<K extends string | symbol = string> = {
    i18n?: I18N<K>;
};
export {};
