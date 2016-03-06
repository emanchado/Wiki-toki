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
    proto.getPageList = function() {
        var self = this;

        return Q.nfcall(fs.readdir, this.wikiPageDir).catch(function(err) {
            throw new Error(
                "Couldn't read list of wiki pages from directory " +
                    self.wikiPageDir + ": " + err
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

    proto.readPage = function(pageName) {
        return Q.nfcall(
            fs.readFile,
            this.pagePath(pageName)
        ).then(function(data) {
            return data.toString();
        });
    };

    proto.writePage = function(pageName, contents, cb) {
        fsExtra.mkdirsSync(path.dirname(this.pagePath(pageName)));
        fs.writeFile(this.pagePath(pageName), contents, cb);
    };

    proto.searchTitles = function(searchTerms) {
        if (searchTerms === "") {
            return Q([]);
        }

        var deferred = Q.defer();

        var searchTermArray = searchTerms.split(/\s+/);
        var searchExpressions = searchTermArray.map(function(st) {
            return new RegExp(st, "i");
        });
        this.getPageList().then(function(pageNames) {
            deferred.resolve(pageNames.filter(function(pageName) {
                return searchExpressions.every(function(se) {
                    return pageName.match(se);
                });
            }));
        }).catch(function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    proto.getPageInfo = function() {
        var self = this,
            deferred = Q.defer();

        this.getPageList().then(function(pageNames) {
            var readPagePromises = pageNames.map(function(pageName) {
                return Q.nfcall(fs.readFile,
                                self.pagePath(pageName),
                                "utf-8");
            });
            Q.all(readPagePromises).then(function(results) {
                deferred.resolve(results.map(function(result, i) {
                    return {title: pageNames[i], contents: result};
                }));
            }).catch(function(err) {
                deferred.reject(err);
            }).done();
        }).catch(function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    proto.renamePage = function(oldName, newName) {
        var oldPath = path.join(this.wikiPageDir, oldName),
            newPath = path.join(this.wikiPageDir, newName),
            deferred = Q.defer();

        if (oldName === "WikiIndex") {
            deferred.reject(new Error("Can't rename WikiIndex!"));
        } else {
            fs.stat(newPath, function(err) {
                if (err) {
                    Q.when(Q.nfcall(fs.rename, oldPath, newPath),
                           deferred.resolve,
                           deferred.reject);
                } else {
                    deferred.reject(new Error("Can't rename, " + newName + " already exists"));
                }
            });
        }

        return deferred.promise;
    };

    proto.pageExists = function(pageName) {
        return Q.nfcall(
            fs.stat,
            path.join(this.wikiPageDir, pageName)
        ).then(function() {
            return true;
        }).catch(function() {
            return false;
        });
    };

    proto.searchContents = function(searchTerms) {
        if (searchTerms === "") {
            return Q([]);
        }

        var deferred = Q.defer();

        var searchTermArray = searchTerms.split(/\s+/);
        var searchExpressions = searchTermArray.map(function(st) {
            // Don't let the user escape the final "\b"
            st = st.replace(/\\$/, '');
            return new RegExp("\\b" + st + "\\b", "i");
        });

        this.getPageInfo().then(function(pageInfoArray) {
            deferred.resolve(pageInfoArray.filter(function(pageInfo) {
                return searchExpressions.every(function(se) {
                    return pageInfo.contents.match(se);
                });
            }).map(function(pageInfo) {
                return pageInfo.title;
            }));
        }).catch(function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    proto.sharePage = function(pageName) {
        var self = this,
            deferred = Q.defer();

        this.pageExists(pageName).then(function(exists) {
            if (exists) {
                self.isPageShared(pageName).then(function(isShared) {
                    if (isShared) {
                        self.pageShareId(pageName).then(function(shareId) {
                            deferred.resolve(shareId);
                        });
                        return;
                    }

                    var shareId = uuid();
                    fs.writeFile(path.join(self.pageDirectoryPath(pageName),
                                           "share-id"),
                                 shareId,
                                 function(err) {
                                     if (err) {
                                         deferred.reject(err);
                                     } else {
                                         deferred.resolve(shareId);
                                     }
                                 });
                });
            } else {
                deferred.reject(
                    new Error("Page '" + pageName + "' does not exist, cannot share")
                );
            }
        });

        return deferred.promise;
    };

    proto.pageShareId = function(pageName) {
        return Q.nfcall(
            fs.readFile,
            path.join(this.pageDirectoryPath(pageName), "share-id")
        ).then(function(data) {
            return data.toString();
        });
    };

    proto.isPageShared = function(pageName) {
        return Q.nfcall(
            fs.stat,
            path.join(this.pageDirectoryPath(pageName), "share-id")
        ).then(function() {
            return true;
        }).catch(function(/*err*/) {
            return false;
        });
    };

    proto.unsharePage = function(pageName) {
        return Q.nfcall(
            fs.unlink,
            path.join(this.pageDirectoryPath(pageName), "share-id")
        );
    };

    proto.pageNameForShareId = function(shareId) {
        var self = this,
            deferred = Q.defer();

        this.getPageList().then(function(pageNames) {
            var readPagePromises = pageNames.map(function(pageName) {
                return Q.Promise(function(resolve/*, reject*/) {
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
                        deferred.resolve(nameAndShareId[0]);
                        found = true;
                        return false;
                    }
                });
                if (!found) {
                    deferred.reject(new Error("Couldn't find shareid '" + shareId + "'"));
                }
            }).catch(function(err) {
                deferred.reject(err);
            }).done();
        }).catch(function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    proto.getSharedPages = function() {
        var deferred = Q.defer();

        glob(path.join(this.wikiPageDir, "*", "share-id"), function(err, list) {
            if (err) {
                deferred.reject(err);
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
                    deferred.resolve(resultObject);
                }).catch(function(err) {
                    deferred.reject(err);
                });
            }
        });

        return deferred.promise;
    };

    proto.getAttachmentList = function(pageName) {
        var filesPath = path.join(this.pageDirectoryPath(pageName),
                                  "attachments");

        return Q.nfcall(fs.readdir, filesPath).then(function(files) {
            var attachmentFiles = files.filter(function(file) {
                    return file !== "." && file !== "..";
                }),
                promises = attachmentFiles.map(function(filename) {
                    return Q.nfcall(
                        fs.stat,
                        path.join(filesPath, filename)
                    ).then(function(statInfo) {
                        return {
                            filename: filename,
                            size: statInfo.size,
                            mtime: statInfo.mtime
                        };
                    });
                });

            return Q.all(promises);
        }).catch(function(/*err*/) {
            // For now, assume that the attachments/ directory is
            // not there, and thus there are no attachments
            return [];
        });
    };

    proto.writeAttachment = function(pageName, name, contents) {
        var attachmentsPath = path.join(this.pageDirectoryPath(pageName),
                                        "attachments"),
            attachmentPath = path.join(attachmentsPath, path.basename(name));

        fsExtra.mkdirsSync(attachmentsPath);

        return Q.nfcall(fs.writeFile, attachmentPath, contents);
    };

    proto.readAttachment = function(pageName, name) {
        var attachmentsPath = path.join(this.pageDirectoryPath(pageName),
                                        "attachments"),
            attachmentPath = path.join(attachmentsPath, path.basename(name));

        return Q.nfcall(fs.readFile, attachmentPath);
    };
})(WikiStore.prototype);

module.exports = WikiStore;
