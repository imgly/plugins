import formatsIconSprite from './icons/formats';

const Icons = {
  Formats: formatsIconSprite
};

export { Icons };

export {
  CustomAssetSource,
  type CustomAssetSourceOptions,
  type SelectValue
} from './assetSources/CustomAssetSource';

export { IndexedDBAssetSource } from './assetSources/IndexedDBAssetSource';

export { AggregatedAssetSource } from './assetSources/AggregatedAssetSource';

export { default as Metadata } from './metadata/Metadata';

export { default as FillProcessingMetadata } from './metadata/FillProcessingMetadata';

export { default as fillProcessing } from './processing/fillProcessing';

export { default as initializeFillProcessing } from './processing/initializeFillProcessing';

export { default as registerFillProcessingComponents } from './processing/registerFillProcessingComponents';

export { type Optional } from './types/Optional';

export {
  type Location,
  type UserInterfaceConfiguration
} from './types/UserInterfaceConfiguration';

export { hexToRgba, isValidHexColor, rgbaToHex } from './utils/colors';

export {
  uploadBlob,
  fetchImageBlob,
  bufferURIToObjectURL,
  mimeTypeToExtension
} from './utils/upload';

export { default as uuid } from './utils/uuid';

export {
  getImageDimensionsFromURL,
  getImageUri,
  isSvgFill
} from './utils/images';

export { default as isDefined } from './utils/isDefined';

export { default as toArray } from './utils/toArray';

export { supportsTranslateAPI, hasTranslateAPI } from './translationHelpers';
