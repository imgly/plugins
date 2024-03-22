import { BG_REMOVAL_ID } from './constants';
import { QRCodeExtension } from './qr-extension/QRCodePlugin';

const Plugin = () => ({
  name: BG_REMOVAL_ID,
  version: PLUGIN_VERSION,
  ...QRCodeExtension
});

export default Plugin;
