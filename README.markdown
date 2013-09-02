Wiki-toki
=========

This is a _very_ simple wiki system written in Javascript (with
[express](http://expressjs.com/) /
[Node.js](http://nodejs.org/)). It's designed to be used as a
[personal wiki](http://en.wikipedia.org/wiki/Personal_wiki).

I wrote it mainly because I wanted a personal wiki and to learn a bit
of "real" development with Node.js (I had written one experiment with
Node.js before, but wanted to use an actual web development
environment instead of writing everything by hand).

It's very, very simple, and it will likely stay that way as this is
strictly a _personal_ wiki. It has a "passphrase" to protect the site
(no username/password pair, just a passphrase).

The looks are pretty spartan. Maybe one day I'll bother to use
Bootstrap or something similar. Patches welcome.

To configure it, you'll have to set the following configuration keys:

    wiki-toki:_passphrase = mysecretpassphraseyouwillneverguess
    wiki-toki:store-directory = /path/to/the/store/directory

For example, by starting the wiki like so:

    npm start /path/to/Wiki-toki --wiki-toki:store-directory=/var/wiki-toki/store --wiki-toki:_passphrase=ohnoyoudidn't --wiki-toki:quiet

Note the `--wiki-toki:quiet` option, which suppresses a startup
message. You might need that to run Wiki-Toki on your web server.
