import chalk from 'chalk';
import { exec } from 'child_process';
import log from './log.mjs';

const dtsPlugin = {
  name: 'dts',
  setup(build) {
    let dtsError;
    let dtsStdio = undefined;
    let dtsResolved;
    build.onStart(() => {
      dtsError = undefined;
      dtsStdio = undefined;
      dtsResolved = false;
      log('Generating types...');
      exec('yarn types:create', (error, stdio) => {
        if (error) {
          dtsError = error;
          dtsStdio = stdio;
        }
        dtsResolved = true;
      });
    });
    build.onEnd(async () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (dtsResolved) {
            clearInterval(interval);
            if (dtsError) {
              log(chalk.red('Type Error'));
              console.log(dtsStdio);
            } else {
              log(`Type Generation ${chalk.green('succeeded')}`);
            }
            resolve();
          }
        }, 200);
      });
    });
  }
};

export default dtsPlugin;
