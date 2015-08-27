tg_irc
======

Telegram <-> IRC gateway

* Telegram communication via [node-telegram-bot](https://github.com/orzFly/node-telegram-bot) library
* IRC communication via martynsmith's [node-irc](https://github.com/martynsmith/node-irc) module
* All Telegram messages are sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted or if message is prefixed with "! " (configurable)

Setup
-----

    git clone https://github.com/warbaque/tg_irc && cd tg_irc
    npm install
    mkdir ~/.tg_irc && cp tg_irc_config.js.example ~/.tg_irc/config.js
    $EDITOR ~/.tg_irc/config.js
    npm start

Note that before running `tg_irc`, you should create your Telegram bot first (https://core.telegram.org/bots#botfather)
