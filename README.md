tg_irc
======

Telegram <-> IRC gateway

* Uses [`node-telegram-bot`](https://github.com/orzFly/node-telegram-bot) Telegram bot API wrapper for Telegram communication
* IRC communication via martynsmith's [`node-irc`](https://github.com/martynsmith/node-irc) module
* All Telegram messages sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted (configurable)

Setup
-----

    git clone https://github.com/warbaque/tg_irc && cd tg_irc
    npm install
    cp tg_irc_config.js.example ~/.tg_irc_config.js
    $EDITOR ~/.tg_irc_config.js
    node tg_irc.js

Note that before running `tg_irc`, you should create your Telegram bot first (https://core.telegram.org/bots#botfather)
