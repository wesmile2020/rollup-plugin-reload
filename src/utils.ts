import path from 'path';
import fs from 'fs';
import { Server } from 'http';

interface FileResult {
    filePath: string;
    content: Buffer |null;
}
type FileCallback = (error: Error | null, result: FileResult) => void;

export function readFile(contentBase: string, urlPath: string, cb: FileCallback) {
    let filePath = urlPath;
    if (/^\//.test(urlPath)) {
        filePath = '.' + filePath;
    }
    filePath = path.resolve(contentBase, filePath);
    if (/\/$/.test(filePath)) {
        filePath += 'index.html';
    }
    if (!fs.existsSync(filePath)) {
        cb(null, { content: null, filePath });
        return;
    }
    try {
        const content = fs.readFileSync(filePath);
        cb(null, { content, filePath });
    } catch (error) {
        cb(error, { content: null, filePath });
    }
    
}

export function getBannerScript(scriptSrc: string) {
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

export function closeServerOnTermination(server: Server) {
    const terminationSignals = ['SIGINT', 'SIGTERM'];
    for (let i = 0; i < terminationSignals.length; i += 1) {
        process.on(terminationSignals[i], () => {
            server.close();
            process.exit();
        });
    }
}
