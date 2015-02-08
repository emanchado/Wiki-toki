"use strict";

function getWikiPageMiddleware(wikiStore) {
    return function(req, res, next) {
        wikiStore.getPageList(function(err, wikiPageTitles) {
            if (err) {
                res.render('error', {message: err});
            } else {
                req.wikiPageList = wikiPageTitles;
                wikiStore.readPage(req.params.pageName, function(err, data) {
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
    };
}

function getAuthenticationMiddleware(configuration) {
    return function(req, res, next) {
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
    };
}

module.exports.getWikiPageMiddleware = getWikiPageMiddleware;
module.exports.getAuthenticationMiddleware = getAuthenticationMiddleware;
