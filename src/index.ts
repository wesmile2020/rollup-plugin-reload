import path from 'path';
import portfinder from 'portfinder';
import rollup from 'rollup';
import { findIp } from './ip';
import { Server, ProxyConfig } from './Server';
import fs from 'fs';
import chalk from 'chalk';

interface Options {
  contentBase: string;
  port: number;
  proxy: ProxyConfig;
}

const defaultOptions: Options = {
  contentBase: '',
  port: 3000,
  proxy: {},
};

function reload(options?: Partial<Options>): rollup.Plugin {
  const opts = { ...defaultOptions, ...options };
  const host = findIp();
  let root = opts.contentBase;
  if (!path.isAbsolute(opts.contentBase)) {
    root = path.resolve(process.cwd(), opts.contentBase);
  }
  const portPromise = portfinder.getPortPromise({ port: opts.port });
  const server = new Server();

  portPromise.then((port) => {
    server.start({ port, root, proxy: opts.proxy });
  });

  process.on('SIGINT', () => {
    server.stop();
    process.exit();
  });
  process.on('SIGTERM', () => {
    server.stop();
    process.exit();
  });

  return {
    name: 'rollup-plugin-reload',

    banner() {
      return fs.readFileSync(path.resolve(__dirname, 'client.js'), 'utf-8');
    },

    async buildEnd() {
      const port = await portPromise;
      const url = `http://${host}:${port}`;
      console.log('Your application running on: \n');
      console.log('   local:', chalk.bold.blue(`http://localhost:${port}`));
      console.log(' network:', chalk.bold.blue(url));
    },
  };
}

export { reload };
export default reload;
