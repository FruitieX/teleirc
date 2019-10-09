**NOTE**: no longer maintained, look for alternatives such as: https://github.com/42wim/matterbridge

![Logo](/extras/logo.png)

A simple [Telegram](https://telegram.org/) ↔ IRC gateway.

* Official IRC channel: [#teleirc @ irc.freenode.net](https://kiwiirc.com/client/irc.freenode.net:+6697/#teleirc)
* Official Telegram group: Run `teleirc --join-tg` for URL (to prevent spambots)

[![Build Status](https://travis-ci.org/FruitieX/teleirc.svg?branch=develop)](https://travis-ci.org/FruitieX/teleirc)
[![npm module](https://img.shields.io/npm/v/teleirc.svg?style=flat)](https://www.npmjs.com/package/teleirc)
[![dependencies](https://david-dm.org/fruitiex/teleirc.svg)](https://david-dm.org/fruitiex/teleirc#info=Dependencies)
[![devDependencies](https://david-dm.org/fruitiex/teleirc/dev-status.svg)](https://david-dm.org/fruitiex/teleirc#info=devDependencies)

#### Features:

* Supports multiple IRC channel ↔ Telegram group pairs
* Telegram messages are always relayed to their respective IRC channel
* IRC messages can be configured either to be relayed always, or only when the
  bot is hilighted via a configurable regexp
* Supports Telegram media files, URL to file sent to IRC

Requirements
------------

On Ubuntu:
```
sudo apt-get install libicu-dev
```


Quick start
-----------

Make sure you've installed the [latest LTS version of Node.js](https://nodejs.org/en/).

1. Install the teleirc npm module with `npm install -g teleirc` (might need
   sudo)
2. Generate a default config using `teleirc --genconfig`
   NOTE: if this step fails, try `mkdir ~/.teleirc` and run the command again (FIXME).
3. Set up your bot with [BotFather](https://telegram.me/botfather)
4. Use the `/setprivacy` command with `BotFather` to allow your bot to see all
   messages in your group (NOTE on usage: bot name is preceded by @ sign and
   'Disable' is case-sensitive)
5. Edit the default config `$EDITOR ~/.teleirc/config.js`
6. Run `teleirc`
7. Invite your bot to any Telegram groups you've configured it for
8. Greet your bot once on each of your Telegram groups :tada:! This is needed
   to fetch (and store!) an internally used group ID, making communication from
   IRC to the correct Telegram group possible.

Optional:

- For your convenience, there is an included systemd unit file:
  [teleirc.service](extras/teleirc.service)
- You can change your Telegram Bot's profile picture with the `/setuserpic`
  BotFather command. [Here's](/extras/icon.png) an example icon for you.
- You can tell Telegram which commands the teleirc bot supports by using the
  `/setcommands` BotFather command. You may copy-paste the contents of
  [`commands.txt`](/extras/commands.txt) to show all supported commands to
  Telegram clients.
- Instead of enabling the HTTP server for serving sent media files, photo files
  sent to the groups can be uploaded to [Imgur](http://imgur.com/). See the
  [README for Imgur](extras/Imgur_README.md) for more information.

Troubleshooting
---------------

1. Check your system clock. By default if a Telegram message's timestamp is
   older than one minute compared to your system clock, the message is skipped.
   You can configure this behaviour via `config.maxMsgAge`.
2. Make sure your Telegram group's name and IRC channel has been entered
   correctly in your config (case sensitive!)
3. Run with verbose flags to see more output: `teleirc -vvv`

Contributing
------------

See [CONTRIBUTING.md](CONTRIBUTING.md) for developer info

Docker install
--------------

See the [README for Docker](extras/Docker_README.md)
