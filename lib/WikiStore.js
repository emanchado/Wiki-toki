var fs = require("fs"),
    path = require("path"),
    Q = require("q");

function WikiStore(config) {
    this.config = config;
}

(function(proto) {
    proto.getPageList = function(cb) {
        fs.readdir(this.config.storeDirectory, function(err, files) {
            cb(err, files);
        });
    };

    proto.pagePath = function(pageName) {
        return this.config.storeDirectory + '/' +
            pageName.replace(/[^a-z0-9]+/gi, '');
    };

    proto.readPage = function(pageName, cb) {
        fs.readFile(this.pagePath(pageName), cb);
    };

    proto.writePage = function(pageName, contents, cb) {
        fs.writeFile(this.pagePath(pageName), contents, cb);
    };

    proto.searchTitles = function(searchTerms, cb) {
        if (searchTerms === "") {
            cb(null, []);
            return;
        }

        var searchTermArray = searchTerms.split(/\s+/);
        var searchExpressions = searchTermArray.map(function(st) {
            return new RegExp(st, "i");
        });
        this.getPageList(function(err, pageNames) {
            if (err) {
                cb(err);
                return;
            }

            cb(null, pageNames.filter(function(pageName) {
                return searchExpressions.every(function(se) {
                    return pageName.match(se);
                });
            }));
        });
    };

    proto.getPageInfo = function(cb) {
        var self = this;
        this.getPageList(function(err, pageNames) {
            if (err) {
                cb(err);
                return;
            }

            var readPagePromises = pageNames.map(function(pageName) {
                return Q.nfcall(fs.readFile,
                                path.join(self.config.storeDirectory,
                                          pageName),
                                "utf-8");
            });
            Q.all(readPagePromises).then(function(results) {
                cb(null, results.map(function(result, i) {
                    return {title: pageNames[i], contents: result};
                }));
            }).catch(function(err) {
                cb(err);
            }).done();
        });
    };

    proto.searchContents = function(searchTerms, cb) {
        if (searchTerms === "") {
            cb(null, []);
            return;
        }

        var searchTermArray = searchTerms.split(/\s+/);
        var searchExpressions = searchTermArray.map(function(st) {
            // Don't let the user escape the final "\b"
            st = st.replace(/\\$/, '');
            return new RegExp("\\b" + st + "\\b", "i");
        });

        this.getPageInfo(function(err, pageInfoArray) {
            if (err) {
                cb(err);
                return;
            }

            cb(null, pageInfoArray.filter(function(pageInfo) {
                return searchExpressions.every(function(se) {
                    return pageInfo.contents.match(se);
                });
            }).map(function(pageInfo) {
                return pageInfo.title;
            }));
        });
    };
})(WikiStore.prototype);

module.exports = WikiStore;
