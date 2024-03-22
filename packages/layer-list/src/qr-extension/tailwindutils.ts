import { tailwindToCSS } from 'tw-to-css';
// @ts-ignore
// import config from '../../tailwind.config.mjs';

const { twi, twj } = tailwindToCSS({
  // config
});

export { twi, twj };
