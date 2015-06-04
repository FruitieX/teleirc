teleirc
=======

Telegram <-> IRC gateway.

* Uses the `telegram-cli` program for Telegram communication
* IRC communication via martynsmith's `node-irc` module
* All Telegram messages sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted (configurable)

Setup
-----

    cp teleircConfig.js.example ~/.teleircConfig.js
    $EDITOR ~/.teleircConfig.js
    node teleirc.js

Note that before running `teleirc`, you should have ran
`telegram-cli` at least once and set up your account. Make
sure you can actually send messages to group chats from within
`telegram-cli` yourself, it has to work or else `teleirc` won't
be able to send IRC -> TG messages either!
