var c = require('irc-colors');
var config = require('../config');

module.exports = function(name) {

    var hash = 0;

    if (name.length === 0) { return name; }

    for (var i = 0; i < name.length; ++i) {
        chr = name.charCodeAt(i);
        // mult by 32
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // number conversion
    }

    // returns negatives sometimes...
    hash = Math.abs(hash % config.palette.length);

    if (!c[config.palette[hash]]) { return name; }
    return c[config.palette[hash]](name);
};
