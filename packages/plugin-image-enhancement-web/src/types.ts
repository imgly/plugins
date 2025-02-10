export type Location =
  | 'inspectorBar'
  | 'navigationBar'
  | 'canvasBarTop'
  | 'canvasBarBottom'
  | 'canvasMenu'
  | 'dock';

export interface UserInterfaceConfiguration {
  locations?: Location | Location[];
}
