import chalk from 'chalk';
import log from './log.mjs';

const reporterPlugin = {
  name: 'reporter',
  setup(build) {
    build.onEnd((result) => {
      log(
        `Build ${
          result.errors.length ? chalk.red('failed') : chalk.green('succeeded')
        }`
      );
    });
  }
};

export default reporterPlugin;
