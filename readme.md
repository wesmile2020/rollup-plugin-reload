# rollup-plugin-reload

a rollup plugin for server and reload

## options
- contentBase: default is process.cwd(), statically managed folders are required
- port: default is 3000 port number

```javascript
const reload = require('rollup-plugin-reload');
const path = require('path');

module.exports = {
    plugins: [reload({
        contentBase: path.resolve('debug'),
        port: 3000,
    })]
};
```