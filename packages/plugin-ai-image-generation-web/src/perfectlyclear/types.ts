/**
 * PerfectlyClear SDK TypeScript definitions
 * Adapted from pfc.d.mts
 */

export enum InferenceOption {
  local = 0,
  remote = 1,
  remoteSocket = 2
}

export enum PFCFEATURE {
  CALC_CORE = 1,
  CALC_NR = 2,
  CALC_FB = 4,
  CALC_RE = 8,
  CALC_ALL = 15,
  CALC_NOTINTCALC = 16,
  CALC_NOFAE = 32,
  CALC_FAEHISPEED = 64,
  CALC_CARTOON_DETECTOR = 128,
  CALC_SHARP = 256,
  CALC_SCENE_DETECTION = 512,
  CALC_COMPOSITE = 1024,
  CALC_SKINTONE = 2048,
  CALC_AICOLOR = 4096,
  CALC_DYNAMIC = 65536
}

export enum PFCPRESETID {
  PRESET_NONE = -1,
  PRESET_BEAUTIFY = 0,
  PRESET_BEAUTIFYPLUS = 1,
  PRESET_DETAILS = 2,
  PRESET_VIVID = 3,
  PRESET_INTELLIGENTAUTO = 4,
  PRESET_IAUTO_2019 = 5,
  PRESET_IAUTO_2019_RE = 6,
  PRESET_IAUTO_21 = 7,
  PRESET_IAUTO_21_ASIA = 8,
  PRESET_IAUTO_PEOPLE = 9
}

// Simplified type definitions for the PFC SDK
// These match the interfaces from the WASM module
export interface PfcImage {
  originalImage: any;
  image: {
    getImageData(): any;
  };
  profile: any;
  sceneId?: number;
  delete(): void;
}

export interface PfcParam {
  // Add parameter properties as needed
}

export interface PfcOptions {
  distDir: string;
  modelsDir?: string;
  clientAPIKey: string;
  urlGetCertificate: string;
  pfcWasmCertificate: string | null;
  pfcAiServerUrl: string;
  inference: InferenceOption;
  looks?: string;
  numWorkers?: number;
  assetsBaseURL?: string;
}

export interface Pfc {
  init(options: PfcOptions): Promise<string | null | undefined>;
  createImage(imageData: ImageData): PfcImage | null;
  deleteImage(image: PfcImage): Promise<void>;
  createProfile(
    image: PfcImage,
    features: number,
    aiFeatures: number
  ): Promise<number | null>;
  createParam(): PfcParam | null;
  setParam(param: PfcParam, presetId: PFCPRESETID): void;
  readScenePreset(param: PfcParam, sceneId: number): number | undefined;
  loadScenePresets(preset: string): Promise<void>;
  apply(image: PfcImage, param: PfcParam): Promise<any>;
  workerPool?: {
    terminate(): void;
  };
}

// Constructor type for dynamic import
export interface PfcConstructor {
  new (): Pfc;
}

// Module type for dynamic import
export interface PfcModule {
  Pfc: PfcConstructor;
  PFCFEATURE: typeof PFCFEATURE;
  PFCPRESETID: typeof PFCPRESETID;
  InferenceOption: typeof InferenceOption;
}
