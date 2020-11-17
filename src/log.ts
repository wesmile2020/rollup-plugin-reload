import chalk from 'chalk';

export function logError(...rest: any) {
    console.log(chalk.bold.red(...rest));
}

export function logSuccess(...rest: any) {
    console.log(chalk.bold.green(...rest));
}
