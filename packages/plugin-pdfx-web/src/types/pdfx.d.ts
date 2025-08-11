export interface ConversionOptions {
  iccProfile?: Blob;
  colorConversionStrategy?: 'CMYK' | 'Gray' | 'RGB' | 'UseDeviceIndependentColor' | 'LeaveColorUnchanged';
  renderingIntent?: 'Default' | 'Perceptual' | 'Saturation' | 'RelativeColorimetric' | 'AbsoluteColorimetric';
  blackGeneration?: 'Default' | 'None' | 'Low' | 'Medium' | 'High';
  underColorRemoval?: 'Default' | 'None' | 'Low' | 'Medium' | 'High';
  transferFunction?: 'Default' | 'Apply' | 'Remove' | 'Preserve';
  preserveBlack?: boolean;
  preserveOverprint?: boolean;
  overrideICC?: boolean;
}
