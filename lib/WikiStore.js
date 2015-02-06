var fs = require("fs");

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
            } else {
                cb(null, pageNames.filter(function(pageName) {
                    return searchExpressions.every(function(se) {
                        return pageName.match(se);
                    });
                }));
            }
        });
    }
})(WikiStore.prototype);

module.exports = WikiStore;
