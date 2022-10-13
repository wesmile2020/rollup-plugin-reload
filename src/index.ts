import http from 'http';
import path from 'path';
import mime from 'mime';
import portfinder from 'portfinder';
import { findIp } from './ip';
import { logError, logSuccess } from './log';
import rollup from 'rollup';
import { closeServerOnTermination, getBannerScript, readFile } from './utils';

// @ts-ignore
import livereload from 'livereload';

interface Options {
    contentBase?: string;
    port?: number;
}

const defaultOptions = {
    contentBase: '',
    port: 3000,
};

function reload(options?: Options): rollup.Plugin {
    const opts = { ...defaultOptions, ...options };
    const host = findIp();
    if (!path.isAbsolute(opts.contentBase)) {
        opts.contentBase = path.resolve(process.cwd(), opts.contentBase);
    }

    const promises: Promise<number>[] = [];
    const serverPortPromise = portfinder.getPortPromise({ port: opts.port });
    promises.push(serverPortPromise);
    const reloadPortPromise = portfinder.getPortPromise({ port: opts.port + 1 });
    promises.push(reloadPortPromise);

    Promise.all(promises).then(([serverPort, reloadPort]) => {
        http.createServer((req, res) => {
            const urlPath = decodeURI(req.url?.split('?')[0] || '');
            readFile(opts.contentBase, urlPath, (error, { content, filePath }) => {
                if (error) {
                    res.writeHead(500);
                    res.end(`500 Internal Server Error 
                        \n\n${filePath}
                        \n\n${error.stack} 
                        \n\n(rollup-plugin-reload)`, 'utf-8');
                    return;
                }
                if (!content) {
                    res.writeHead(404);
                    res.end(`404 Not Found
                        \n\n${filePath}
                        \n\n(rollup-plugin-reload)`, 'utf-8');
                    return;
                }
                const contentType = mime.getType(filePath);
                if (contentType) {
                    res.setHeader('Content-Type', contentType);
                }
                res.writeHead(200);
                res.end(content, 'utf-8');
            });
        }).listen(serverPort).on('error', (err) => {
            logError('rollup-plugin-reload: create server failed', err.message);
            process.exit();
        });

        const server = livereload.createServer({ port: reloadPort });
        server.watch(opts.contentBase);

        server.on('error', (err: Error) => {
            logError('rollup-plugin-reload: create server failed', err.message);
            process.exit();
        });
        
        closeServerOnTermination(server);
    }).catch((err) => {
        logError(`rollup-plugin-reload: init error ${err.message}`);
        process.exit();
    });

    return {
        name: 'rollup-plugin-reload',

        async banner() {
            const port = await reloadPortPromise;
            const scriptSrc = `':${port}/livereload.js?snipver=1'`;
            return getBannerScript(scriptSrc);
        },
    
        async buildEnd() {
            const port = await serverPortPromise;
            const url = `http://${host}:${port}`;
            logSuccess(url), '->', path.resolve(opts.contentBase);
        },
    };
}

export { reload };
export default reload;
