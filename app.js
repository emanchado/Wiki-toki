var express = require('express'),
    WikiStore = require("./lib/WikiStore");

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

var app = module.exports = express.createServer(),
    wikiStore = new WikiStore(configuration);

function wikiPage(req, res, next) {
    wikiStore.getPageList(function(err, wikiPageTitles) {
        if (err) {
            res.render('error', {
                message: "Couldn't read list of wiki pages from directory " +
                    configuration.storeDirectory
            });
        } else {
            req.wikiPageList = wikiPageTitles;
            wikiStore.readPage(req.params.pagename, function(err, data) {
                if (err) {
                    req.pageText = null;
                    next();
                } else {
                    req.pageText = data.toString();
                    next();
                }
            });
        }
    });
}

function authentication(req, res, next) {
    if (req.session.authenticated === true) {
        next();
    } else {
        if (req.body && req.body.passphrase === configuration.secretPassphrase) {
            req.session.authenticated = true;
            next();
        } else {
            res.render('login', {layout: false});
        }
    }
}

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
app.all('/', authentication, function(req, res) {
    res.redirect('/view/WikiIndex');
});

app.all('/list', authentication, function(req, res) {
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

app.all('/view/:pagename', authentication, wikiPage, function(req, res) {
    if (req.pageText === null) {
        res.redirect('/create/' + req.params.pagename);
    } else {
        res.render('view', {
            pagename:         req.params.pagename,
            rawText:          req.pageText,
            wikiPageListJSON: JSON.stringify(req.wikiPageList)
        });
    }
});

app.all('/create/:pagename', authentication, wikiPage, function(req, res) {
    res.render('create', {
        pagename:         req.params.pagename,
        rawText:          (req.pageText === null) ? "" : req.pageText,
        wikiPageListJSON: JSON.stringify(req.wikiPageList)
    });
});

app.post('/save/:pagename', authentication, function(req, res) {
    var newPageContents = req.body.rawText;
    if (typeof(newPageContents) === 'undefined' || newPageContents === "") {
        res.redirect('/view/' + req.params.pagename);
    } else {
        wikiStore.writePage(req.params.pagename,
                            newPageContents,
                            function(err) {
                                if (err) {
                                    res.render('error', {
                                        message: "Couldn't read page " + req.params.pagename
                                    });
                                } else {
                                    res.redirect('/view/' + req.params.pagename);
                                }
                            });
    }
});

app.all('/search', authentication, function(req, res) {
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
