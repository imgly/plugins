import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import Manifest from './manifest';


export interface PluginConfiguration {
  // uploader ? 
}

export { Manifest };

export default () => {
  return {
    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      polyfill(cesdk);
    }
  };
};



// we could polyfill them 
import { merge } from 'lodash';
import { flatten } from './utils/flatten';

export class I18N {
  #translations: any = {};
  #locale: string = 'en';

  setTranslations(translations: any) {
    const flattenedTranslations = flatten(translations);
    this.#translations = merge(this.#translations, flattenedTranslations);
  }

  translate(key: string, fallback: string | undefined = undefined) {
    const lookup = this.#locale.concat('.', key);
    return this.#translations[lookup] ?? fallback ?? key;
  }
  t = this.translate.bind(this)
}

export interface I18N {
  setTranslations: (translations: any) => void;
  translate(key: string, fallback: string | undefined): string;

}

export type I18NType =  & { i18n?: I18N } 

export type Translations = { [locale: string]: object; }

export function polyfill(sdk: CreativeEditorSDK) {

  const Polyfill = class extends I18N {
    #translations: any = {};
    #locale: string = 'en';
    #origSetTranslations = sdk.setTranslations.bind(sdk);
    
    constructor(params: any) {
      super();
      sdk.setTranslations = this.setTranslations.bind(this);
    }
    setTranslations(translations: Translations) {
      this.#translations = merge(this.#translations, flatten(translations));
      this.#origSetTranslations(translations);
    }

    translate(key: string, fallback: string | undefined = undefined) {
      const lookup = this.#locale.concat('.', key);
      return this.#translations[lookup] ?? fallback ?? key;
    }
    t = this.translate.bind(this)
  }

  // @ts-ignore
  if (!sdk.i18n) {
    // @ts-ignore
    sdk.i18n = new Polyfill()
  }
}