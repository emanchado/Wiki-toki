# Wiki-toki

This is a
_[personal wiki](http://en.wikipedia.org/wiki/Personal_wiki)_ system
written in Javascript.


## Features

Wiki-toki is meant for private use and as such you need to logging to
_see_ or edit its pages. To login you only type a passphrase (there
are no separate users, as it's meant for a single person).

* Pages are written in [Markdown](https://en.wikipedia.org/wiki/Markdown)
* Live page preview while editing
* Preview of linked images
* Search, both for titles and content
* Page sharing: you can share certain pages so they are visible
  through a special URL
* Upload files to pages
* Renaming pages

The big missing feature is versioning: once you edit, there's no way
to go back to previous versions.


## Using it

To start it, you have to pass the configuration as environment variables:

    npm_package_config_store_directory=tmp/store \
        npm_package_config__passphrase=secret-password \
        npm_package_config_session_secret=some-better-secret \
        npm_package_config_quiet=1 \
        node app.js

Note the `npm_package_config_quiet` variable, which suppresses a
startup message. You might need that to run Wiki-Toki on your web
server.


## Running the tests

You can run the unit tests with `buster-test`, and the functional
tests by running `testem` and going to http://localhost:7357 with a
web browser.


## Icons

The picture and PDF link icons are made by Jozef Krajčovič, and taken
from https://www.iconfinder.com/iconsets/document-icons-2.

The search icon is made by Yannick Lung, and was taken from
https://www.iconfinder.com/icons/314478/search_icon#size=16.

The trashcan icon is also made by Yannick Lung, and was taken from
https://www.iconfinder.com/iconsets/freecns-cumulus.

The add attachment icon is made by Linh Pham Thi Dieu, and was taken
from
https://www.iconfinder.com/icons/763486/add_circle_new_outline_plus_sign_stroke_icon#size=128.
