import { BlockAPI } from "@cesdk/cesdk-js";
export declare const readPropValue: (block: BlockAPI, id: number, propKey: string, propType?: string) => string | number | boolean | (import("@cesdk/cesdk-js").RGBAColor | import("@cesdk/cesdk-js").CMYKColor | import("@cesdk/cesdk-js").SpotColor);
export declare const writePropValue: (block: BlockAPI, id: number, propKey: string, propValue: any, propType?: string) => void;
