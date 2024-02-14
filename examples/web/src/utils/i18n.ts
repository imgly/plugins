// // we could polyfill them 
// import { merge } from 'lodash';
// import { flatten } from './flatten';

// export class I18N {
//     #translations: any = {};
//     #locale: string = 'en';

//     setTranslations(translations: any) {
//         const flattenedTranslations = flatten(translations);
//         this.#translations = merge(this.#translations, flattenedTranslations);
//     }

//     translate(key: string, fallback: string | undefined = undefined) {
//         const lookup = this.#locale.concat('.', key);
//         return this.#translations[lookup] ?? fallback ?? key;
//     }
//     t = this.translate.bind(this)
// }

// const i18n = new I18N();

// export default i18n;




