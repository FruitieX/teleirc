var logger = require('winston');

logger.setLevels({
    silly:   5,
    debug:   4,
    verbose: 3,
    info:    2,
    warn:    1,
    error:   0,
});

logger.addColors({
    silly:   'magenta',
    debug:   'green',
    verbose: 'blue',
    info:    'cyan',
    warn:    'yellow',
    error:   'red'
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true,
    prettyPrint: true
});

module.exports = logger;
