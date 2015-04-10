var express = require('express'),
    WikiStore = require("./lib/WikiStore"),
    middlewares = require("./lib/middlewares"),
    storeUpgrader = require("./lib/storeUpgrader");

var configuration = {
    secretPassphrase: process.env.npm_package_config__passphrase,
    storeDirectory:   process.env.npm_package_config_store_directory,
    sessionSecret:   process.env.npm_package_config_session_secret
};

if (configuration.secretPassphrase === undefined) {
    throw new Error('Misconfigured app, no secret passphrase');
}
if (configuration.storeDirectory === undefined) {
    throw new Error('Misconfigured app, no store directory');
}

storeUpgrader.upgrade(configuration.storeDirectory);

var app = module.exports = express.createServer(),
    wikiStore = new WikiStore(configuration),
    authMiddleware = middlewares.getAuthenticationMiddleware(configuration);

// Configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: configuration.sessionSecret || 'some secret for the wikiz' }));
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler()); 
});

// Routes
app.all('/', authMiddleware, function(req, res) {
    res.redirect('/view/WikiIndex');
});

app.all('/list', authMiddleware, function(req, res) {
    wikiStore.getPageList(function(err, files) {
        if (err) {
            res.render('error', {
                message: "Couldn't read list of wiki pages from directory " +
                    configuration.storeDirectory
            });
        } else {
            res.render('index', {
                pages: files
            });
        }
    });
});

app.all('/view/:pageName', authMiddleware, function(req, res) {
    wikiStore.getPageList(function(err, wikiPageTitles) {
        if (err) {
            res.render('error', {message: err});
        } else {
            wikiStore.readPage(req.params.pageName, function(err, data) {
                if (err) {
                    res.render('create', {
                        pageName:         req.params.pageName,
                        wikiPageListJSON: JSON.stringify(wikiPageTitles)
                    });
                } else {
                    res.render('view', {
                        pageName:         req.params.pageName,
                        rawText:          data.toString(),
                        wikiPageListJSON: JSON.stringify(wikiPageTitles)
                    });
                }
            });
        }
    });
});

app.all('/create/:pageName', authMiddleware, function(req, res) {
    res.redirect('/view/' + req.params.pageName);
});

app.all('/edit/:pageName', authMiddleware, function(req, res) {
    wikiStore.getPageList(function(err, wikiPageTitles) {
        if (err) {
            res.render('error', {message: err});
        } else {
            wikiStore.readPage(req.params.pageName, function(err, data) {
                if (err) {
                    res.render('create', {
                        pageName:         req.params.pageName,
                        wikiPageListJSON: JSON.stringify(wikiPageTitles)
                    });
                } else {
                    res.render('edit', {
                        pageName:         req.params.pageName,
                        rawText:          data.toString(),
                        wikiPageListJSON: JSON.stringify(wikiPageTitles)
                    });
                }
            });
        }
    });
});

app.post('/save/:pageName', authMiddleware, function(req, res) {
    var newPageContents = req.body.rawText;
    if (typeof(newPageContents) === 'undefined' || newPageContents === "") {
        res.redirect('/view/' + req.params.pageName);
    } else {
        wikiStore.writePage(req.params.pageName,
                            newPageContents,
                            function(err) {
                                if (err) {
                                    res.render('error', {
                                        message: "Couldn't read page " + req.params.pageName
                                    });
                                } else {
                                    res.redirect('/view/' + req.params.pageName);
                                }
                            });
    }
});

function doRename(store, oldPageName, newPageName, res) {
    wikiStore.searchContents(oldPageName, function(err, results) {
        if (err) {
            res.render('error', {
                message: "Couldn't read list of wiki pages from directory " +
                    configuration.storeDirectory + " because: " + err
            });
        } else {
            if (newPageName) {
                wikiStore.renamePage(
                    oldPageName,
                    newPageName,
                    function(err) {
                        if (err) {
                            res.render('rename', {
                                pageName: oldPageName,
                                linkingPages: results,
                                error: err
                            });
                        } else if (results.length) {
                            res.render('after-rename', {
                                pageName: newPageName,
                                oldPageName: oldPageName,
                                linkingPages: results
                            });
                        } else {
                            res.redirect('/view/' + newPageName);
                        }
                    });
            } else {
                res.render('rename', {
                    pageName: oldPageName,
                    linkingPages: results
                });
            }
        }
    });
}

app.all('/rename/:pageName', authMiddleware, function(req, res) {
    var oldPageName = req.params.pageName,
        newPageName = req.body.newPageName;

    wikiStore.pageExists(oldPageName, function(exists) {
        if (exists) {
            doRename(wikiStore, oldPageName, newPageName, res);
        } else {
            res.redirect('/view/' + oldPageName);
        }
    });
});

app.all('/search', authMiddleware, function(req, res) {
    var searchTerms = req.query.searchterms;

    if (searchTerms.length && searchTerms[0] === '/') {
        wikiStore.searchContents(searchTerms.substr(1), function(err, results) {
            if (err) {
                res.render('error', {
                    message: "Couldn't read list of wiki pages from directory " +
                        configuration.storeDirectory + " because: " + err
                });
            } else {
                if (results.length === 1) {
                    res.redirect('/view/' + results[0]);
                } else {
                    res.render('search', {
                        searchTerms: searchTerms,
                        results: results
                    });
                }
            }
        });
    } else {
        wikiStore.searchTitles(searchTerms, function(err, results) {
            if (err) {
                res.render('error', {
                    message: "Couldn't read list of wiki pages from directory " +
                        configuration.storeDirectory
                });
            } else {
                if (results.length === 1) {
                    res.redirect('/view/' + results[0]);
                } else {
                    res.render('search', {
                        searchTerms: searchTerms,
                        results: results
                    });
                }
            }
        });
    }
});

app.all('/logout', function(req, res) {
    req.session.authenticated = false;
    res.redirect('/view/WikiIndex');
});


app.listen(process.env.PORT || 3000);
if (! process.env.npm_package_config_quiet) {
    console.log("Express server listening on port %d in %s mode",
                app.address().port,
                app.settings.env);
}
