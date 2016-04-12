var yargs = require('yargs');

module.exports = {
    argv: yargs
        .usage('Usage: $0 [options]')

        .alias('c', 'config')
        .describe('c', 'Use config from given path')

        .alias('g', 'genconfig')
        .describe('g', 'Generate a new default config')

        .alias('j', 'join-tg')
        .describe('j', 'Show official Telegram support group invite URL')

        .count('verbose')
        .alias('v', 'verbose')
        .describe('v', 'Enable verbose output')

        .describe('version', 'Show teleirc version and quit')

        .alias('h', 'help')
        .help()

        .argv
};
