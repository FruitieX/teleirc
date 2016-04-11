var c = require('irc-colors');

var getNameHash = function(name) {
    var hash = 0;
    if (name.length === 0) { return hash; }

    for (var i = 0; i < name.length; ++i) {
        chr = name.charCodeAt(i);
        // mult by 32
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // number conversion
    }

    // returns negatives sometimes...
    return Math.abs(hash % 14);
};

module.exports = function(name) {
    switch (getNameHash(name)) {
        case 0:
            return c.white(name);
        case 1:
            return c.silver(name);
        case 2:
            return c.navy(name);
        case 3:
            return c.green(name);
        case 4:
            return c.red(name);
        case 5:
            return c.brown(name);
        case 6:
            return c.purple(name);
        case 7:
            return c.olive(name);
        case 8:
            return c.yellow(name);
        case 9:
            return c.lime(name);
        case 10:
            return c.teal(name);
        case 11:
            return c.cyan(name);
        case 12:
            return c.blue(name);
        case 13:
            return c.pink(name);
    }
};

