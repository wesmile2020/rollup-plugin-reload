# rollup-plugin-reload

a rollup plugin for server and reload

## options
- contentBase: statically managed folders are required
- port: port number

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