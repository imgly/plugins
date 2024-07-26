export interface VectorPath {
  transform: {
    x: number;
    y: number;
    rotation: number;
    width: number;
    height: number;
  };
  shape: {
    path: string;
  };
  fill: {
    kind: 'Color';
    color: number[];
  };
}
