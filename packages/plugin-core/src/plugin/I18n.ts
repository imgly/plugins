import { PluginContext } from './PluginContext';
import { Subscribable } from './Subscribable';


import { merge } from 'lodash';
import { flatten } from '../utils/flatten';

type Translation<K extends string | symbol | number> = Record<K, string>
type Translations<K extends string | symbol | number = string> = { [locale: string]: Translation<K>; }

export class I18N<K extends string | symbol> extends Subscribable<"register", Translations> {
  #translations: any = {};
  #locale: string = navigator.language ?? "en";
  #ctx: PluginContext


  constructor(ctx: PluginContext) {
    super()
    this.#ctx = ctx
  }

  setTranslations(translations: Translations) {
    this.#translations = merge(this.#translations, flatten(translations));
    this.notify("register", translations)
  }

  translate(key: K, fallback: string | undefined = undefined) {
    const translation = this.findTranslation(key, this.#locale)
    if (!translation) {
      this.#ctx.logger?.warn(`Translation in "${this.#locale}" for key ${key as string} not found!`);
    }
    return translation ?? fallback ?? key;
  }

  findTranslation(key: K, language?: string) {
    const [lang, region] = this.#locale.split('-');
    const langLookup = lang.concat('.', key as string);
    const langAndRegionLookup = lang.concat('.', key as string);
    return this.#translations[langAndRegionLookup] || this.#translations[langLookup]
  }

  hasTranslation(key: K, language?: string): boolean {
    const locale = language ?? this.#locale;
    const lookup = locale.concat('.', key as string);
    return !!this.findTranslation(key, language)
  }

  setLocale(locale: string) {
    this.#locale = locale;
  }
  locale() {
    return this.#locale;
  }

  locales() {
    return navigator.languages
  }
  t = this.translate.bind(this)
}


export type I18NType<K extends string | symbol = string> = { i18n?: I18N<K> }
