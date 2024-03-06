import { Context } from './Context';
import { Subscribable } from './Subscribable';


import { merge } from 'lodash';

export type Translation<K extends string | symbol | number> = Record<K, string>
export type Translations<K extends string | symbol | number = string> = { [locale: string]: Translation<K>; }

export class I18N<K extends string | symbol> extends Subscribable<"register", Translations> {
  #translations: Translations<K> = {};

  #locale: string = navigator.language ?? "en";

  #ctx: Context


  constructor(ctx: Context) {
    super()
    this.#ctx = ctx
  }

  async registerTranslations(translations: Translations<K>) {
    this.#translations = merge(this.#translations, translations);
    await this.notify("register", translations)
  }
  
  translate(key: K, fallback: string | undefined = undefined) {
    const translation = this.findTranslation(key, this.#locale)
    if (!translation) {
      this.#ctx.logger?.warn(`Translation in "${this.#locale}" for key ${key as string} not found!`);
    }
    return translation ?? fallback ?? key;
  }

  findTranslation(key: K, language?: string) {
    const locale = language ?? this.#locale;
    const [lang, region] = locale.split('-');
    return this.#translations[locale][key] ?? this.#translations[lang][key] ?? undefined

  }

  hasTranslation(key: string, language?: string): boolean {
    const locale = language ?? this.#locale;
    const lookup = locale.concat('.', key as string);
    return !!this.findTranslation(key as K, language)
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
