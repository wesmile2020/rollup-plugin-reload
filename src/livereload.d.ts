import { Server } from 'http';

declare module 'livereload' {
    interface Options {
        prot?: number;
    }

    export function createServer(options: Options): Server;
}
