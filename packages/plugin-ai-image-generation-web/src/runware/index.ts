// Text-to-Image providers
import { Flux11Pro } from './Flux11Pro';
import { Flux11ProUltra } from './Flux11ProUltra';
import { Imagen4 } from './Imagen4';
import { Imagen4Ultra } from './Imagen4Ultra';
import { Imagen4Fast } from './Imagen4Fast';
import { NanoBanana } from './NanoBanana';
import { GptImage1 } from './GptImage1';
import { Seedream4 } from './Seedream4';
import { Ideogram3 } from './Ideogram3';
import { Kolors21 } from './Kolors21';
import { BriaFibo } from './BriaFibo';

// Image-to-Image providers
import { FluxKontextPro } from './FluxKontextPro';
import { FluxKontextMax } from './FluxKontextMax';
import { GptImage1Edit } from './GptImage1Edit';
import { SeedEdit3 } from './SeedEdit3';
import { Ideogram3Remix } from './Ideogram3Remix';

const Runware = {
  // Text-to-Image
  Flux11Pro,
  Flux11ProUltra,
  Imagen4,
  Imagen4Ultra,
  Imagen4Fast,
  NanoBanana,
  GptImage1,
  Seedream4,
  Ideogram3,
  Kolors21,
  BriaFibo,
  // Image-to-Image
  FluxKontextPro,
  FluxKontextMax,
  GptImage1Edit,
  SeedEdit3,
  Ideogram3Remix
};

export default Runware;

// Re-export types
export type { RunwareProviderConfiguration } from './types';
