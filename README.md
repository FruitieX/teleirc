teleirc
======

Telegram <-> IRC gateway

* Telegram communication via [node-telegram-bot](https://github.com/orzFly/node-telegram-bot) library
* IRC communication via martynsmith's [node-irc](https://github.com/martynsmith/node-irc) module
* All Telegram messages are sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted or if message is prefixed with "! " (configurable)

Setup
-----

    git clone https://github.com/warbaque/teleirc && cd teleirc
    npm install
    mkdir ~/.teleirc && cp teleirc_config.js.example ~/.teleirc/config.js
    $EDITOR ~/.teleirc/config.js
    npm start

Note that before running `teleirc`, you should create your Telegram bot first (https://core.telegram.org/bots#botfather)
