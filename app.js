var express = require('express'),
    bodyParser     = require('body-parser'),
    cookieParser = require("cookie-parser"),
    expressSession = require("express-session"),
    expressLess = require("express-less"),
    expressLayout = require("express-layout"),
    errorhandler = require("errorhandler"),
    path = require("path"),
    formidable = require('formidable'),
    Q = require("q"),

    WikiStore = require("./lib/WikiStore"),
    render = require("./lib/render"),
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

var app = module.exports = express(),
    wikiStore = new WikiStore(configuration),
    authMiddleware = middlewares.getAuthenticationMiddleware(configuration);

// Configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: configuration.sessionSecret || 'some secret for the wikiz'
}));
app.use(express.static(__dirname + '/public'));
app.use('/stylesheets/', expressLess(__dirname + '/public/stylesheets'));
app.use(expressLayout());

var env = process.env.NODE_ENV || 'development';
if (env === 'development') {
    app.use(errorhandler({ dumpExceptions: true, showStack: true }));
}
if (env === 'production') {
    app.use(express.errorHandler()); 
}

// Routes
app.all('/', authMiddleware, function(req, res) {
    res.redirect('/view/WikiIndex');
});

app.all('/list', authMiddleware, function(req, res) {
    wikiStore.getPageList().then(function(files) {
        wikiStore.getSharedPages().then(function(sharedPages) {
            res.render('index', {
                pages: files,
                shared: sharedPages
            });
        });
    }).catch(function(/*err*/) {
        res.render('error', {
            message: "Couldn't read list of wiki pages from directory " +
                configuration.storeDirectory
        });
    });
});

app.all('/view/:pageName', authMiddleware, function(req, res) {
    render.renderPage(res, wikiStore, req.params.pageName);
});

app.all('/edit/:pageName', authMiddleware, function(req, res) {
    render.renderPage(res, wikiStore, req.params.pageName, 'edit');
});

app.post('/save/:pageName', authMiddleware, function(req, res) {
    var newPageContents = req.body.rawText;
    if (typeof(newPageContents) === 'undefined' || newPageContents === "") {
        res.redirect('/view/' + req.params.pageName);
    } else {
        wikiStore.writePage(req.params.pageName, newPageContents).then(function() {
            res.redirect('/view/' + req.params.pageName);
        }).catch(function(/*err*/) {
            res.render('error', {
                message: "Couldn't read page " + req.params.pageName
            });
        });
    }
});

app.all('/rename/:pageName', authMiddleware, function(req, res) {
    var oldPageName = req.params.pageName,
        newPageName = req.body.newPageName;

    wikiStore.pageExists(oldPageName).then(function(exists) {
        if (exists) {
            render.doRename(wikiStore, oldPageName, newPageName, res);
        } else {
            res.redirect('/view/' + oldPageName);
        }
    });
});

app.all('/search', authMiddleware, function(req, res) {
    var searchTerms = req.query.searchterms;

    if (searchTerms.length && searchTerms[0] === '/') {
        wikiStore.searchContents(searchTerms.substr(1)).then(function(results) {
            if (results.length === 1) {
                res.redirect('/view/' + results[0]);
            } else {
                res.render('search', {
                    searchTerms: searchTerms,
                    results: results
                });
            }
        }).catch(function(err) {
            res.render('error', {
                message: "Couldn't read list of wiki pages from directory " +
                    configuration.storeDirectory + " because: " + err
            });
        });
    } else {
        wikiStore.searchTitles(searchTerms).then(function(results) {
            if (results.length === 1) {
                res.redirect('/view/' + results[0]);
            } else {
                res.render('search', {
                    searchTerms: searchTerms,
                    results: results
                });
            }
        }).catch(function(/*err*/) {
            res.render('error', {
                message: "Couldn't read list of wiki pages from directory " +
                    configuration.storeDirectory
            });
        });
    }
});

app.all('/share/:pageName', authMiddleware, function(req, res) {
    var pageName = req.params.pageName;

    wikiStore.sharePage(pageName).then(function(shareId) {
        res.redirect('/shared/' + shareId);
    }).catch(function(/*err*/) {
        res.render('error', {
            message: "Couldn't share page '" + pageName + "'"
        });
    });
});

app.all('/unshare/:pageName', authMiddleware, function(req, res) {
    var pageName = req.params.pageName;

    wikiStore.unsharePage(pageName).then(function() {
        res.redirect('/view/' + pageName);
    }).catch(function(/*err*/) {
        res.render('error', {
            message: "Couldn't unshare page '" + pageName + "'"
        });
    });
});

app.get('/attachments/:pageName/:name', authMiddleware, function(req, res) {
    var pageName = req.params.pageName,
        name = req.params.name;

    wikiStore.getAttachmentPath(pageName, name).then(function(attachmentPath) {
        res.sendFile(attachmentPath);
    }).catch(function(err) {
        res.render('error', {
            message: "Couldn't download attachment: " + err
        });
    });
});

app.post('/attachments/:pageName', authMiddleware, function(req, res) {
    var pageName = req.params.pageName;

    var form = new formidable.IncomingForm();
    form.uploadDir = wikiStore.config.storeDirectory;

    Q.ninvoke(form, "parse", req).spread(function(fields, files) {
        var uploadedFileInfo = files.attachment,
            filename = path.basename(uploadedFileInfo.name),
            tmpPath = uploadedFileInfo.path;

        wikiStore.addAttachment(pageName, filename, tmpPath).then(function() {
            res.redirect('/view/' + pageName);
        }).catch(function(err) {
            res.render('error', {
                message: "Couldn't save attachment: " + err
            });
        });
    }).catch(function(err) {
        res.render('error', {
            message: "Could not upload attachment: " + err
        });
    });
});

app.post('/attachments/:pageName/:name', authMiddleware, function(req, res) {
    var pageName = req.params.pageName,
        name = req.params.name,
        action = req.body.action;

    if (action === 'delete') {
        wikiStore.deleteAttachment(pageName, name).then(function() {
            res.redirect('/view/' + pageName);
        }).catch(function(err) {
            res.render('error', {
                message: "Could not delete attachment: " + err
            });
        });
    } else {
        res.redirect('/view/' + pageName);
    }
});

// NOTE: This is not authenticated, that's the whole point of it!
app.all('/shared/:shareId', function(req, res) {
    var shareId = req.params.shareId;

    wikiStore.pageNameForShareId(shareId).then(function(pageName) {
        Q.all([
            wikiStore.getPageList(),
            wikiStore.readPage(pageName),
            wikiStore.getAttachmentList(pageName)
        ]).spread(function(wikiPageTitles, data, attachmentList) {
            res.render('shared', {
                layout:            false,
                shareId:           shareId,
                pageName:          pageName,
                rawText:           data.toString(),
                wikiPageListJSON:  JSON.stringify(wikiPageTitles),
                attachments:       attachmentList,
                attachmentBaseUrl: '/shared/' + shareId + '/attachments',
                formatDate:        render.formatDate
            });
        }).catch(function(err) {
            res.render('error', {message: err});
        });
    }).catch(function(/*err*/) {
        res.render('error', {
            message: "Couldn't find share id '" + shareId + "'"
        });
    });
});

// NOTE: This is not authenticated, that's the whole point of it!
app.get('/shared/:shareId/attachments/:name', function(req, res) {
    var shareId = req.params.shareId,
        name = req.params.name;

    wikiStore.pageNameForShareId(shareId).then(function(pageName) {
        wikiStore.getAttachmentPath(pageName, name).then(function(attachmentPath) {
            res.sendFile(attachmentPath);
        }).catch(function(err) {
            res.render('error', {
                message: "Couldn't download attachment: " + err
            });
        });
    }).catch(function(/*err*/) {
        res.render('error', {
            message: "Couldn't find share id '" + shareId + "'"
        });
    });
});

app.all('/logout', function(req, res) {
    req.session.authenticated = false;
    res.redirect('/view/WikiIndex');
});


var port = parseInt(process.env.PORT || "3000", 10);
app.listen(port);
if (! process.env.npm_package_config_quiet) {
    console.log("Express server listening on port %d in %s mode",
                port,
                app.settings.env);
}
