tg_irc
======

Telegram <-> IRC gateway

* Uses the [`telegram-cli`](https://github.com/vysheng/tg) program for Telegram communication
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

Note that before running `tg_irc`, you should have ran
`telegram-cli` at least once and set up your account. Make
sure you can actually send messages to group chats from within
`telegram-cli` yourself, it has to work or else `tg_irc` won't
be able to send IRC -> TG messages either!
