import { Context } from './Context';
import { Subscribable } from './Subscribable';
export type Translation<K extends string | symbol | number> = Record<K, string>;
export type Translations<K extends string | symbol | number = string> = {
    [locale: string]: Translation<K>;
};
export declare class I18N<K extends string | symbol> extends Subscribable<"register", Translations> {
    #private;
    constructor(ctx: Context);
    registerTranslations(translations: Translations<K>): Promise<void>;
    translate(key: K, fallback?: string | undefined): Translation<K>[K];
    findTranslation(key: K, language?: string): Translation<K>[K];
    hasTranslation(key: string, language?: string): boolean;
    setLocale(locale: string): void;
    locale(): string;
    locales(): readonly string[];
    t: (key: K, fallback?: string | undefined) => Translation<K>[K];
}
export type I18NType<K extends string | symbol = string> = {
    i18n?: I18N<K>;
};
