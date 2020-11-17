import { Plugin } from 'rollup';

interface Options {
    contentBase?: string;
    port?: number;
}

function reload(opts: Options): Plugin;

export default reload;
export { reload };
