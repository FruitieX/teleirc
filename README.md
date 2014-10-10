teleirc
=======

Telegram <-> IRC gateway.

* Uses the telegram-cli program for Telegram communication
* Implements IRC protocol for IRC communication.
* All Telegram messages sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted

Setup
-----

    cp teleircConfig.js.example ~/.teleircConfig.js
    $EDITOR ~/.teleircConfig.js
    node teleirc.js
