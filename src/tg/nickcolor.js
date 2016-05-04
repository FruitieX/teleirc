var c = require('irc-colors');
var config = require('../config');

var palette = [
    'navy', 'green', 'red',
    'brown','purple', 'olive',
    'yellow','lime', 'teal',
    'cyan', 'pink', 'blue'
];

module.exports = function(name) {

    var hash = 0;
    if (config.palette && config.palette.length !== 0) {
        palette = config.palette;
    }

    if (name.length === 0) { return name; }

    for (var i = 0; i < name.length; ++i) {
        chr = name.charCodeAt(i);
        // mult by 32
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // number conversion
    }

    // returns negatives sometimes...
    hash = Math.abs(hash % palette.length);

    if (!c[palette[hash]]) { return name; }
    return c[palette[hash]](name);
};
