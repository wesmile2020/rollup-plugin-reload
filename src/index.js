const livereload = require('livereload');
const fs = require('fs');
const http = require('http');
const path = require('path');
const chalk = require('chalk');
const mime = require('mime');
const protfinder = require('portfinder');
const IP = require('./ip');

function green(...rest) {
    return chalk.bold.green(...rest);
}

function red(...rest) {
    return chalk.bold.red(...rest);
}

const defaultOptions = {
    contentBase: '',
    port: 3000,
};

function readFile(contentBase, urlPath, callback) {
    let filePath = path.resolve(contentBase, `.${urlPath}`);
    if (urlPath.endsWith('/')) {
        filePath = path.resolve(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
        callback(null, { content: '', filePath });
        return;
    }
    try {
        const content = fs.readFileSync(filePath);
        callback(null, { content, filePath });
    } catch (error) {
        callback(error, { content: '', filePath });
    }
}

function closeServerOnTermination(server) {
    var terminationSignals = ['SIGINT', 'SIGTERM'];
    terminationSignals.forEach((signal) => {
        process.on(signal, function () {
            server.close();
            process.exit();
        });
    });
}

function getBannerScript(scriptSrc) {
    return (
`(function (){
    if (document.getElementById('reload-script')) return;
    const script = document.createElement('script');
    script.id = 'reload-script';
    script.src = '//' + (window.location.host || 'localhost').split(':')[0] + ${scriptSrc};
    document.head.appendChild(script);
}());`
    );
}

function reload(options = {}) {
    const host = IP.findIp();
    const opts = { ...defaultOptions, ...options };
    if (!path.isAbsolute(opts.contentBase)) {
        opts.contentBase = path.resolve(process.cwd(), opts.contentBase);
    } 

    const promises = [];

    const serverPortPromise = protfinder.getPortPromise({ port: opts.port });
    promises.push(serverPortPromise);
    const reloadPortPromise = protfinder.getPortPromise({ port: opts.port + 1 });
    promises.push(reloadPortPromise);
    Promise.all(promises).then(([serverPort, reloadPort]) => {
        // http server
        http.createServer((req, res) => {
            const urlPath = decodeURI(req.url.split('?')[0]);
            readFile(opts.contentBase, urlPath, (error, { content, filePath }) => {
                if (error) {
                    res.writeHead(500);
                    res.end(`500 Internal Server Error 
                        \n\n${filePath} 
                        \n\n${Object.keys(error).map(k => error[k]).join('\n')} 
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
                res.setHeader('Content-Type', mime.getType(filePath));
                res.writeHead(200);
                res.end(content, 'utf-8');
            });
        }).listen(serverPort).on('error', (err) => {
            console.log(red('rollup-plugin-reload: create server failed', err.message));
            process.exit(0);
        });

        // reload
        const server = livereload.createServer({
            port: reloadPort,
        });

        server.watch(opts.contentBase);

        server.on('error', (err) => {
            console.log(red('rollup-plugin-reload: create watch server failed', err.message));
            process.exit(1);
        });

        closeServerOnTermination(server);
    }).catch((err) => {
        console.log(`rollup-plugin-reload: init error ${err.message}`);
    });


    return {
        name: 'rollup-plugin-reload',

        async banner() {
            const port = await reloadPortPromise;
            const scriptSrc = `':${port}/livereload.js?snipver=1'`;
            return getBannerScript(scriptSrc);
        },

        async generateBundle() {
            const port = await serverPortPromise;
            const url = `http://${host}:${port}`;
            console.log(green(url), '->', path.resolve(opts.contentBase));
        },
    };
}

module.exports = reload;
