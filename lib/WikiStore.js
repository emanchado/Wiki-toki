var fse = require("fs-extra"),
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

        return Q.nfcall(fse.readdir, this.wikiPageDir).catch(function(err) {
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
            fse.readFile,
            this.pagePath(pageName)
        ).then(function(data) {
            return data.toString();
        });
    };

    proto.writePage = function(pageName, contents) {
        fse.mkdirsSync(path.dirname(this.pagePath(pageName)));
        return Q.nfcall(
            fse.writeFile,
            this.pagePath(pageName),
            contents
        );
    };

    proto.searchTitles = function(searchTerms) {
        if (searchTerms === "") {
            return Q([]);
        }

        var searchTermArray = searchTerms.split(/\s+/);
        var searchExpressions = searchTermArray.map(function(st) {
            return new RegExp(st, "i");
        });

        return this.getPageList().then(function(pageNames) {
            return pageNames.filter(function(pageName) {
                return searchExpressions.every(function(se) {
                    return pageName.match(se);
                });
            });
        });
    };

    proto.getPageInfo = function() {
        var self = this;

        return this.getPageList().then(function(pageNames) {
            var readPagePromises = pageNames.map(function(pageName) {
                return Q.nfcall(fse.readFile,
                                self.pagePath(pageName),
                                "utf-8");
            });

            return Q.all(readPagePromises).then(function(results) {
                return results.map(function(result, i) {
                    return {title: pageNames[i], contents: result};
                });
            });
        });
    };

    proto.renamePage = function(oldName, newName) {
        var oldPath = path.join(this.wikiPageDir, oldName),
            newPath = path.join(this.wikiPageDir, newName),
            deferred = Q.defer();

        if (oldName === "WikiIndex") {
            deferred.reject(new Error("Can't rename WikiIndex!"));
        } else {
            fse.stat(newPath, function(err) {
                if (err) {
                    Q.when(Q.nfcall(fse.rename, oldPath, newPath),
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
            fse.stat,
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

        var searchTermArray = searchTerms.split(/\s+/);
        var searchExpressions = searchTermArray.map(function(st) {
            // Don't let the user escape the final "\b"
            st = st.replace(/\\$/, '');
            return new RegExp("\\b" + st + "\\b", "i");
        });

        return this.getPageInfo().then(function(pageInfoArray) {
            return pageInfoArray.filter(function(pageInfo) {
                return searchExpressions.every(function(se) {
                    return pageInfo.contents.match(se);
                });
            }).map(function(pageInfo) {
                return pageInfo.title;
            });
        });
    };

    proto.sharePage = function(pageName) {
        var self = this;

        return this.pageExists(pageName).then(function(exists) {
            if (exists) {
                return self.isPageShared(pageName).then(function(isShared) {
                    if (isShared) {
                        return self.pageShareId(pageName);
                    }

                    var shareId = uuid();
                    return Q.nfcall(
                        fse.writeFile,
                        path.join(self.pageDirectoryPath(pageName),
                                  "share-id"),
                        shareId
                    ).then(function() {
                        return shareId;
                    });
                });
            } else {
                throw new Error("Page '" + pageName + "' does not exist, cannot share");
            }
        });
    };

    proto.pageShareId = function(pageName) {
        return Q.nfcall(
            fse.readFile,
            path.join(this.pageDirectoryPath(pageName), "share-id")
        ).then(function(data) {
            return data.toString();
        });
    };

    proto.isPageShared = function(pageName) {
        return Q.nfcall(
            fse.stat,
            path.join(this.pageDirectoryPath(pageName), "share-id")
        ).then(function() {
            return true;
        }).catch(function(/*err*/) {
            return false;
        });
    };

    proto.unsharePage = function(pageName) {
        return Q.nfcall(
            fse.unlink,
            path.join(this.pageDirectoryPath(pageName), "share-id")
        );
    };

    proto.pageNameForShareId = function(shareId) {
        var self = this,
            deferred = Q.defer();

        this.getPageList().then(function(pageNames) {
            var readPagePromises = pageNames.map(function(pageName) {
                return Q.Promise(function(resolve/*, reject*/) {
                    fse.readFile(path.join(self.pageDirectoryPath(pageName),
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
                        fse.readFile(shareIdPath,
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

        return this.pageExists(pageName).then(function(pageExists) {
            if (!pageExists) {
                throw new Error(
                    "Page '" + pageName + "' does not exist, cannot " +
                        "retrieve attachments"
                );
            }

            return Q.nfcall(fse.readdir, filesPath).then(function(files) {
                var attachmentFiles = files.filter(function(file) {
                        return file !== "." && file !== "..";
                    }),
                    promises = attachmentFiles.map(function(filename) {
                        return Q.nfcall(
                            fse.stat,
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
        });
    };

    /*
     * Because of how file uploads are usually handled, it's better to
     * use a temporary path in the API than, say, the contents of the
     * file. The file in the given temporary path will be MOVED!
     */
    proto.addAttachment = function(pageName, name, tmpPath) {
        var attachmentsPath = path.join(this.pageDirectoryPath(pageName),
                                        "attachments"),
            attachmentPath = path.join(attachmentsPath, path.basename(name));

        fse.mkdirsSync(attachmentsPath);

        return Q.nfcall(fse.rename, tmpPath, attachmentPath);
    };

    /*
     * Return a promise to make the API more homogeneous, even if we
     * don't need it in this case.
     */
    proto.getAttachmentPath = function(pageName, name) {
        var attachmentsPath = path.join(this.pageDirectoryPath(pageName),
                                        "attachments"),
            attachmentPath = path.join(attachmentsPath, path.basename(name));

        return Q(attachmentPath);
    };

    proto.deleteAttachment = function(pageName, name) {
        var attachmentsPath = path.join(this.pageDirectoryPath(pageName),
                                        "attachments"),
            attachmentPath = path.join(attachmentsPath, path.basename(name));

        return Q.nfcall(fse.unlink, attachmentPath);
    };
})(WikiStore.prototype);

module.exports = WikiStore;
