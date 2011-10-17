Wiki-toki
=========

This is a _very_ simple wiki system written in Javascript (with
[express](http://expressjs.com/) / [Node.js](http://nodejs.org/)).

I wrote it mainly because I wanted a personal wiki and to learn a bit
of "real" development with Node.js (I had written one experiment with
Node.js before, but wanted to use an actual web development
environment instead of writing everything by hand).

It's _ridiculously_ simple, and it will likely stay that way. I'm not
interested in scaling, performance or anything similar, as this is
strictly a _personal_ wiki. It has a "passphrase" to protect the wiki
(not even username / password), because it's probably never going to
be multiuser.

The looks are pretty... spartan to say the least. Maybe one day I'll
bother to use Bootstrap. Maybe.

To configure it, you'll have to set the following configuration keys:

 wiki-toki:_passphrase = mysecretpassphraseyouwillneverguess
 wiki-toki:store-directory = /path/to/the/store/directory
