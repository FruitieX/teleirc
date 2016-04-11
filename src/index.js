var config = require('./config')();

var msgCallback = function(message) {
    switch (message.protocol) {
        case 'irc':
            tg.send(message);
            break;
        case 'tg':
            irc.send(message);
            break;
        default:
            console.error('unknown protocol: ' + message.protocol);
    }
};

var irc = require('./irc')(msgCallback);
var tg = require('./tg')(msgCallback);
