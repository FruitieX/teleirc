![Logo](/logo.png)

A simple [Telegram](https://telegram.org/) ↔ IRC gateway.

[Changelog](https://fruitiex.org/blog/tag/teleirc/)

[![Build Status](https://travis-ci.org/FruitieX/teleirc.svg?branch=develop)](https://travis-ci.org/FruitieX/teleirc)
[![npm module](https://img.shields.io/npm/v/teleirc.svg?style=flat)](https://www.npmjs.com/package/teleirc)
[![dependencies](https://david-dm.org/fruitiex/teleirc.svg)](https://david-dm.org/fruitiex/teleirc#info=Dependencies)
[![devDependencies](https://david-dm.org/fruitiex/teleirc/dev-status.svg)](https://david-dm.org/fruitiex/teleirc#info=devDependencies)

#### Features:

* Supports multiple IRC channel ↔ Telegram group pairs
* Telegram messages are always relayed to their respective IRC channel
* IRC messages can be configured either to be relayed always, or only
  when the bot is hilighted via a configurable regexp
* Supports Telegram media files, URL to file sent to IRC

Quick start
-----------

Make sure you've installed Node.js.

1. Install the teleirc npm module with `npm install -g teleirc` (might need sudo)
2. Generate a default config using `teleirc --genconfig`
3. Set up your bot with [BotFather](https://telegram.me/botfather)
4. Use the `/setprivacy` command with `BotFather` to allow your bot to
   see all messages in your group (NOTE on usage: bot name is preceded by @ sign
   and 'Disable' is case-sensitive)
5. Edit the default config `$EDITOR ~/.teleirc/config.js`
6. Run `teleirc`
7. Invite your bot to any Telegram groups you've configured it for
8. Greet your bot once on each of your Telegram groups :tada:! This is needed
   to fetch (and store!) an internally used group ID, making communication
   from IRC to the correct Telegram group possible.

Optional:

- For your convenience, there is an included systemd unit file in
  `teleirc.service`.
- You can change your Telegram Bot's profile picture with the `/setuserpic`
  BotFather command. [Here's](/icon.png) an example icon for you.
- You can tell Telegram which commands the teleirc bot supports by using the
  `/setcommands` BotFather command. You may copy-paste the contents of
  [`commands.txt`](/commands.txt) to show all supported commands to Telegram
  clients.

Developer install (from git)
----------------------------

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    npm install

Then follow the instructions under `Setup`, with the exception of step 1.
Also, instead of using the `teleirc` command, use `node teleirc.js` inside the repo.

Use the [`develop`](https://github.com/FruitieX/teleirc/tree/develop) branch for developing, and please also send any pull requests to this branch. The [`master`](https://github.com/FruitieX/teleirc/tree/master) branch contains the latest stable version which is also released on [npm](https://www.npmjs.com/package/teleirc).

Make sure that the unit tests pass before submitting your pull request, using `npm test`.

Docker install
--------------

See the [README for Docker](Docker_README.md)
