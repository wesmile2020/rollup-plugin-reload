# rollup-plugin-reload

a rollup plugin for server and reload

## options
- contentBase: default is `process.cwd()`; statically managed folders are required
- port: default is `3000` port number
- proxy: default is `{}`; such as `{ '/proxy': options }`, the options reference https://github.com/chimurai/http-proxy-middleware#options
- https: is enable https protocol, default is `undefined`, you can config as `{ key: 'xxx.key', cert: 'xxx.cert' }`.

```javascript
const { reload } = require('rollup-plugin-reload');
const path = require('path');

module.exports = {
  plugins: [reload({
    contentBase: path.resolve('debug'),
    port: 3000,
    proxy: {
      '/proxy': {
        target: 'http://api.com'
      }
    },
    https: {
      key: path.resolve(__dirname, 'xxx.key'),
      cert: path.resolve(__dirname, 'xxx.cert'),
    },
  })],
};
```
