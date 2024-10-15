import { type RGBAColor } from '@cesdk/cesdk-js';

const HEX_COLOR_PATTERN = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i');
const HEX_SINGLE_CHAR_COMPONENTS_PATTERN = new RegExp(/[A-Fa-f0-9]{1}/, 'g');
const HEX_DOUBLE_CHAR_COMPONENTS_PATTERN = new RegExp(/[A-Fa-f0-9]{2}/, 'g');

/** @public */
export const rgbaToHex = (rgba: RGBAColor, includeAlpha = false): string => {
  const { r, g, b, a } = rgba;
  const rByte = Math.round(255 * r);
  const gByte = Math.round(255 * g);
  const bByte = Math.round(255 * b);
  const aByte = Math.round(255 * a);
  const byteToHex = (byte: number) => {
    return byte.toString(16).padStart(2, '0');
  };
  return `#${byteToHex(rByte)}${byteToHex(gByte)}${byteToHex(bByte)}${
    includeAlpha ? byteToHex(aByte) : ''
  }`;
};

/** @public */
export const hexToRgba = (hexString: string): RGBAColor => {
  const rgbaHexToColor = (
    r: string,
    g: string,
    b: string,
    a: string | undefined,
    max: number
  ) => {
    return {
      r: parseInt(r, 16) / max,
      g: parseInt(g, 16) / max,
      b: parseInt(b, 16) / max,
      a: a === undefined ? 1 : parseInt(a, 16) / max
    };
  };

  if (hexString.startsWith('#')) {
    if (hexString.length === 4 || hexString.length === 5) {
      const hexMatch = hexString.match(HEX_SINGLE_CHAR_COMPONENTS_PATTERN);
      if (hexMatch) {
        const [r, g, b, a] = hexMatch;
        return rgbaHexToColor(r, g, b, a, 15);
      }
    }
    if (hexString.length === 7 || hexString.length === 8) {
      const hexMatch = hexString.match(HEX_DOUBLE_CHAR_COMPONENTS_PATTERN);
      if (hexMatch) {
        const [r, g, b, a] = hexMatch;
        return rgbaHexToColor(r, g, b, a, 255);
      }
    }
  }

  throw new Error(
    'Invalid hex string! Allowed RGB formats are "#FFF" and "#FFFFFF". Allowed RGBA formats are "#FFFF" and "#FFFFFFFF'
  );
};

/** @public */
export const isValidHexColor = (hexString: string): boolean => {
  return HEX_COLOR_PATTERN.test(hexString);
};
