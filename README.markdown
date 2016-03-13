Wiki-toki
=========

This is a wiki system written in Javascript (with
[express](http://expressjs.com/) /
[Node.js](http://nodejs.org/)). It's designed to be used as a
[personal wiki](http://en.wikipedia.org/wiki/Personal_wiki).

I wrote it mainly because I wanted a personal wiki and to learn a bit
of "real" development with Node.js (I had written one experiment with
Node.js before, but wanted to use an actual web development
environment instead of writing everything by hand).

It's simpler than many other wikis, and it will likely stay that way
as this is strictly a _personal_ wiki. It has a "passphrase" to
protect the site (no username/password pair, just a passphrase). The
looks are somewhat spartan.

Using it
--------

To configure it, you'll have to set the following configuration keys:

    wiki-toki:_passphrase = mysecretpassphraseyouwillneverguess
    wiki-toki:store-directory = /path/to/the/store/directory
    wiki-toki:session-secret = some-better-secret

For example, by starting the wiki like so:

    npm start /path/to/Wiki-toki \
        --wiki-toki:store-directory=/var/wiki-toki/store \
        --wiki-toki:_passphrase=ohnoyoudidnt \
        --wiki-toki:session-secret=some-better-secret \
        --wiki-toki:quiet

Or, if you prefer:

    npm_package_config_store_directory=tmp/store \
        npm_package_config__passphrase=ohnoyoudidnt \
        npm_package_config_session_secret=some-better-secret \
        npm_package_config_quiet=1 \
        node app.js

Or simply by setting them in `~/.npmrc`.

Note the `--wiki-toki:quiet` option, which suppresses a startup
message. You might need that to run Wiki-Toki on your web server.

Running the tests
-----------------

You can run the unit tests with `buster-test`, and the functional
tests by running `testem` and going to http://localhost:7357 with a
web browser.

Icons
-----

The picture and PDF link icons are made by Jozef Krajčovič, and taken
from https://www.iconfinder.com/iconsets/document-icons-2.

The search icon is made by Yannick Lung, and was taken from
https://www.iconfinder.com/icons/314478/search_icon#size=16.

The trashcan icon is also made by Yannick Lung, and was taken from
https://www.iconfinder.com/iconsets/freecns-cumulus.

The add attachment icon is made by Linh Pham Thi Dieu, and was taken
from
https://www.iconfinder.com/icons/763486/add_circle_new_outline_plus_sign_stroke_icon#size=128.
