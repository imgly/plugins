import chalk from 'chalk';

export default (message) => {
  console.log(
    `[${chalk.yellow(
      new Date().toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    )}] ${message}`
  );
};
