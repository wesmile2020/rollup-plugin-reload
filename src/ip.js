const os = require('os');

function findIp() {
    const faces = os.networkInterfaces();
    for (const key in faces) {
        const arr = faces[key];
        for (let i = 0; i < arr.length; i += 1) {
            if (arr[i].family === 'IPv4' && arr[i].address !== '127.0.0.1') {
                return arr[i].address;
            }
        }
    }

    return '127.0.0.1';
}

module.exports = {
    findIp,
};
