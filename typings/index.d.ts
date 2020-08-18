import { Plugin } from 'rollup';

interface Options {
    contentBase?: string;
    port?: number;
}

export default function reload(opts: Options): Plugin;
