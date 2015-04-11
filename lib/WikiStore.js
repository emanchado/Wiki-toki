var fs = require("fs"),
    fsExtra = require("fs-extra"),
    path = require("path"),
    Q = require("q"),
    glob = require("glob"),
    uuid = require("./uuid");

function WikiStore(config) {
    this.config = config;
    this.wikiPageDir = path.join(this.config.storeDirectory, "pages");
}

(function(proto) {
    proto.getPageList = function(cb) {
        var self = this;

        fs.readdir(this.wikiPageDir, function(err, files) {
            cb(
                err && "Couldn't read list of wiki pages from directory " +
                    self.wikiPageDir + ": " + err,
                files
            );
        });
    };

    proto.pageDirectoryPath = function(pageName) {
        return path.join(this.wikiPageDir,
                         pageName.replace(/[^a-z0-9]+/gi, ''));
    };

    proto.pagePath = function(pageName) {
        return path.join(this.pageDirectoryPath(pageName),
                         "contents");
    };

    proto.readPage = function(pageName, cb) {
        fs.readFile(this.pagePath(pageName), function(err, data) {
            cb(err, data ? data.toString() : null);
        });
    };

    proto.writePage = function(pageName, contents, cb) {
        fsExtra.mkdirsSync(path.dirname(this.pagePath(pageName)));
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
                                self.pagePath(pageName),
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

    proto.renamePage = function(oldName, newName, cb) {
        var oldPath = path.join(this.wikiPageDir, oldName),
            newPath = path.join(this.wikiPageDir, newName);

        if (oldName === "WikiIndex") {
            cb("Can't rename WikiIndex!");
        } else {
            fs.stat(newPath, function(err) {
                if (err) {
                    fs.rename(oldPath, newPath, cb);
                } else {
                    cb("Can't rename, " + newName + " already exists");
                }
            });
        }
    };

    proto.pageExists = function(pageName, cb) {
        fs.stat(path.join(this.wikiPageDir, pageName), function(err) {
            cb(!err);
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

    proto.sharePage = function(pageName, cb) {
        var self = this;

        this.pageExists(pageName, function(exists) {
            if (exists) {
                self.isPageShared(pageName, function(isShared) {
                    if (isShared) {
                        self.pageShareId(pageName, cb);
                        return;
                    }

                    var shareId = uuid();
                    fs.writeFile(path.join(self.pageDirectoryPath(pageName),
                                           "share-id"),
                                 shareId,
                                 function(err) {
                                     if (err) {
                                         cb(err);
                                     } else {
                                         cb(null, shareId);
                                     }
                                 });
                });
            } else {
                cb("Page '" + pageName + "' does not exist, cannot share");
            }
        });
    };

    proto.pageShareId = function(pageName, cb) {
        fs.readFile(path.join(this.pageDirectoryPath(pageName), "share-id"),
                    function(err, data) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, data.toString());
                        }
                    });
    };

    proto.isPageShared = function(pageName, cb) {
        try {
            fs.statSync(path.join(this.pageDirectoryPath(pageName),
                                  "share-id"));
            cb(true);
        } catch (e) {
            cb(false);
        }
    };

    proto.unsharePage = function(pageName, cb) {
        fs.unlink(path.join(this.pageDirectoryPath(pageName), "share-id"),
                  cb);
    };

    proto.pageNameForShareId = function(shareId, cb) {
        var self = this;

        this.getPageList(function(err, pageNames) {
            if (err) {
                cb(err);
                return;
            }

            var readPagePromises = pageNames.map(function(pageName) {
                return Q.Promise(function(resolve, reject) {
                    fs.readFile(path.join(self.pageDirectoryPath(pageName),
                                          "share-id"),
                                {encoding: "utf-8"},
                                function(err, data) {
                                    if (err) {
                                        resolve([pageName, null]);
                                    } else {
                                        resolve([pageName, data.trim()]);
                                    }
                                });
                });
            });
            Q.all(readPagePromises).then(function(results) {
                var found = false;
                results.forEach(function(nameAndShareId) {
                    if (nameAndShareId[1] === shareId) {
                        cb(null, nameAndShareId[0]);
                        found = true;
                        return false;
                    }
                });
                if (!found) {
                    cb("Couldn't find shareid '" + shareId + "'");
                }
            }).catch(function(err) {
                cb(err);
            }).done();
        });
    };

    proto.getSharedPages = function(cb) {
        var self = this;

        glob(path.join(this.wikiPageDir, "*", "share-id"), function(err, list) {
            if (err) {
                cb(err);
            } else {
                var fileReadPromises = list.map(function(shareIdPath) {
                    return Q.Promise(function(resolve, reject) {
                        fs.readFile(shareIdPath,
                                    {encoding: "utf-8"},
                                    function(err, data) {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            var pageName = path.basename(path.dirname(shareIdPath));
                                            resolve([pageName, data.trim()]);
                                        }
                                    });
                    });
                });

                Q.all(fileReadPromises).then(function(results) {
                    var resultObject = {};
                    results.forEach(function(pageNameAndShareId) {
                        var pageName = pageNameAndShareId[0],
                            shareId = pageNameAndShareId[1];
                        resultObject[pageName] = shareId;
                    });
                    cb(null, resultObject);
                }).done();
            }
        });
    };
})(WikiStore.prototype);

module.exports = WikiStore;
