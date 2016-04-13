Contributing
============

Developer install (from git)
----------------------------

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    npm install

Then follow the instructions under `Setup`, with the exception of step 1.
Also, instead of using the `teleirc` command, use `bin/teleirc` inside the
repo.

Use the [`develop`](https://github.com/FruitieX/teleirc/tree/develop) branch
for developing, and please also send any pull requests to this branch. The
[`master`](https://github.com/FruitieX/teleirc/tree/master) branch contains
the latest stable version which is also released on
[npm](https://www.npmjs.com/package/teleirc).

Pull requests
-------------

Make sure that the unit tests pass before submitting your pull request, using
`npm test`.

In order to keep our git log clean, please remember to squash your commits into
logical units where each commit should represent a functioning state of the
program. Remove small one-liner fixup commits etc before submitting your pull
request. [More info](http://stackoverflow.com/a/5721879)

Thank you!
