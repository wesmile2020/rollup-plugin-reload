const reload = require('../src/index');

const plugin = reload();

console.log(plugin.banner());
plugin.generateBundle();