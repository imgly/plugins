import { PluginContext } from './PluginContext';
import { Subscribable } from './Subscribable';


import { merge } from 'lodash';
import { flatten } from '../utils/flatten';

type Translation<K extends string | symbol | number> = Record<K, string>
type Translations<K extends string | symbol | number = string> = { [locale: string]: Translation<K>; }

export class I18N <K extends string | symbol > extends Subscribable<"register", Translations> {
  #translations: any = {};
  #locale: string = 'en';
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
    const lookup = this.#locale.concat('.', key as string);
    const translation = this.#translations[lookup]
    if (!translation) {
      this.#ctx.logger?.warn(`Translation for key ${lookup} not found!`);
    }
    return translation ?? fallback ?? key;
  }

  setLocale(locale: string) {
    this.#locale = locale;
  }
  t = this.translate.bind(this)
}


export type I18NType<K extends string| symbol = string> =  { i18n?: I18N<K> }
