var yargs = require('yargs');

module.exports = {
    argv: yargs
        .usage('Usage: $0 [options]')

        .alias('c', 'config')
        .describe('c', 'Use config from given path. Always use full path e.g. /path/to/config.js')

        .alias('g', 'genconfig')
        .describe('g', 'Generate a new default config')

        .alias('j', 'join-tg')
        .describe('j', 'Show official Telegram support group invite URL')

        .count('verbose')
        .alias('v', 'verbose')
        .describe('v', 'Enable verbose output')

        .describe('version', 'Show teleirc version and quit')

        .describe('upgrade-config', 'Replace deprecated options and add new options to config')

        .alias('h', 'help')
        .help()
        .strict()

        .argv
};
