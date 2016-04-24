Install using Docker
--------------------

In the following commands you will need to replace some values:

- `<YOUR_DOCKER_USERNAME>` with your username on the Docker Hub
- for `<ABSOLUTE_PATH_ON_THE_HOST>` choose a path to a folder on the host where
  the config files of teleirc will be accessible (for example I use
  `/data/teleirc`). _Make sure the folder exists beforehand!_ This folder will
  be mapped to `/home/teleirc/.teleirc` in the container.

**Step 1: Build the docker image**

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    sudo docker build -t <YOUR_DOCKER_USERNAME>/teleirc extras

**Step 2: Create a data-only container for teleirc**

We create a _data-only_ container to persist the config files of teleirc
between runs, even if the teleirc container (created at the next step) is
deleted at some point (for example when making upgrades).

Moreover we link the volume inside the container to a local path on the host to
be able to manage the config file of teleirc directly from the host.

    sudo docker run --name=teleirc-data -v
    <ABSOLUTE_PATH_ON_THE_HOST>:/home/teleirc/.teleirc
    <YOUR_DOCKER_USERNAME>/teleirc echo 'data teleirc'

**Step 3: Initialize the sample config file**

    sudo docker run --rm --volumes-from=teleirc-data
    <YOUR_DOCKER_USERNAME>/teleirc teleirc --genconfig

This only calls the command `teleirc --genconfig` which creates the file
`/home/teleirc/.teleirc/config.js` inside the container. This file is
accessible from the host at  `<ABSOLUTE_PATH_ON_THE_HOST>/config.js`.

**Step 4: Create your bot on Telegram**

- Set up your bot with [BotFather](https://telegram.me/botfather)
- After the creation of the bot you will get a token for the HTTP API to be
  used in the next step.
- Use the `/setprivacy` command with `BotFather` to allow the bot to see all
  Telegram messages

Optional:

- You can change your Telegram Bot's profile picture with the `/setuserpic`
  BotFather command. [Here's](/extras/icon.png) an example icon for you.
- You can tell Telegram which commands the teleirc bot supports by using the
  `/setcommands` BotFather command. You may copy-paste the contents of
  [`commands.txt`](/extras/commands.txt) to show all supported commands to
  Telegram clients.

**Step 5: Edit the config file**

    $EDITOR <ABSOLUTE_PATH_ON_THE_HOST>/config.js

Be sure to set up the HTTP API token for the bot you created at the previous
step, the Telegram groups and the IRC parameters (server and channels)

**Step 6: Start teleirc**

    sudo docker run --name=teleirc -p 9090:9090 -d --volumes-from=teleirc-data
    <YOUR_DOCKER_USERNAME>/teleirc

Note: if you want the container to start automatically, add the option
`--restart=always` to the command above.

  - Invite your bot to any Telegram groups you've configured it for
  - Greet your bot once on each of your Telegram groups :tada:! This is needed
    to fetch (and store!) an internally used group ID, making communication
    from IRC to the correct Telegram group possible.

**Additional commands**

- You can see the output of teleirc with `sudo docker logs -f teleirc`
- Stop teleirc: `sudo docker stop teleirc`
- Start teleirc: `sudo docker start teleirc`

**Uninstall**

- Stop and delete the container `teleirc` with `sudo docker stop teleirc` then
  `sudo docker rm teleirc`.
- Delete the data-only container `teleirc-data` with `sudo docker rm
  teleirc-data`.
- Delete the image `<YOUR_DOCKER_USERNAME>/teleirc` with `sudo docker rmi
  <YOUR_DOCKER_USERNAME>/teleirc`.
