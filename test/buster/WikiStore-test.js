/*global describe, it, beforeEach, afterEach */

var buster = require("buster"),
    fs = require("fs"),
    path = require("path"),
    fsExtra = require("fs-extra");
var WikiStore = require("../../lib/WikiStore.js"),
    storeUpgrader = require("../../lib/storeUpgrader");

buster.spec.expose();
var expect = buster.expect;

describe("Retrieval", function() {
    beforeEach(function() {
        this.store = new WikiStore({
            storeDirectory: "test/buster/stores/simple"
        });
    });

    it("should return an error for non-existing pages", function(done) {
        var store = this.store;
        store.readPage("WikiIndexx", function(err) {
            expect(err).not.toEqual(null);
            store.readPage("WikiIndex", function(err) {
                expect(err).toEqual(null);
                done();
            });
        });
    });

    it("should retrieve existing pages", function(done) {
        this.store.readPage("WikiIndex", function(err, text) {
            expect(text).toEqual("This is the index\n");
            done();
        });
    });
});

describe("Page save", function() {
    var storeDir = "test/buster/stores/save";

    beforeEach(function() {
        fsExtra.removeSync(storeDir);
        fs.mkdirSync(storeDir);
        fs.writeFileSync(path.join(storeDir, "WikiIndex"),
                         "Index intentionally (almost) blank.");
        storeUpgrader.upgrade(storeDir);
    });

    it("should create pages", function(done) {
        var store = new WikiStore({
            storeDirectory: storeDir
        });
        var pageContents = "New page\n";

        store.writePage("WikiIndex", pageContents, function() {
            store.readPage("WikiIndex", function(err, text) {
                expect(text).toEqual(pageContents);
                done();
            });
        });
    });
    
    it("should modify already-existing pages", function(done) {
        var store = new WikiStore({
            storeDirectory: storeDir
        });
        var contents1 = "New page\n",
            contents2 = "Modified page\n";

        store.writePage("WikiIndex", contents1, function() {
            store.writePage("WikiIndex", contents2, function() {
                store.readPage("WikiIndex", function(err, text) {
                    expect(text).toEqual(contents2);
                    done();
                });
            });
        });
    });
});

describe("Page info", function() {
    it("should return an error on non-existing store", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/non-existent"
        });

        store.getPageInfo(function(err) {
            expect(err).not.toEqual(null);
            done();
        });
    });

    it("should return relevant info on an existing store", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/trivial"
        });

        store.getPageInfo(function(err, pageInfoArray) {
            var sortedPageInfoArray = pageInfoArray.sort(function(a, b) {
                return a.title.localeCompare(b.title);
            });

            expect(sortedPageInfoArray[0].title).toEqual("SomethingElse");
            expect(sortedPageInfoArray[0].contents).toEqual("Some other content\n");
            expect(sortedPageInfoArray[1].title).toEqual("WikiIndex");
            expect(sortedPageInfoArray[1].contents).toEqual("Index page\n");
            done();
        });
    });
});

describe("Title search", function() {
    it("should return no results on empty search term", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/trivial"
        });
        store.searchTitles("", function(err, results) {
            expect(results).toEqual([]);
            done();
        });
    });

    it("should find single result on one-term search", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/trivial"
        });
        store.searchTitles("index", function(err, results) {
            expect(results).toEqual(["WikiIndex"]);
            done();
        });
    });

    it("should find multiple results on one-term search", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/simple"
        });
        store.searchTitles("w", function(err, results) {
            expect(results.sort()).toEqual(["OswaldoPetterson", "WikiIndex"]);
            done();
        });
    });

    it("should find results that have ALL search terms", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/simple"
        });
        store.searchTitles("w i", function(err, results) {
            expect(results).toEqual(["WikiIndex"]);
            done();
        });
    });
});

describe("Content search", function() {
    it("should return no results on empty search term", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });
        store.searchContents("", function(err, results) {
            expect(results).toEqual([]);
            done();
        });
    });

    it("should find single result on a simple, one-term search", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });
        store.searchContents("front", function(err, results) {
            expect(results).toEqual(["WikiIndex"]);
            done();
        });
    });

    it("should find single results regarless of casing", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });
        store.searchContents("FRoNt", function(err, results) {
            expect(results).toEqual(["WikiIndex"]);
            done();
        });
    });

    it("should only find full words", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });
        store.searchContents("fro", function(err, results) {
            expect(results).toEqual([]);
            done();
        });
    });

    it("should not allow the user to sabotage the regular expression", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });
        store.searchContents("front\\", function(err, results) {
            expect(err).toEqual(null);
            expect(results).toEqual(["WikiIndex"]);
            done();
        });
    });

    it("should allow the user to use regular expressions", function(done) {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });
        store.searchContents("front.*", function(err, results) {
            expect(err).toEqual(null);
            expect(results.sort()).toEqual(["ProgrammingLanguages", "WikiIndex"]);
            done();
        });
    });
});

describe("Rename page", function() {
    var origDir = "test/buster/stores/simple",
        targetDir = "test/buster/stores/rename",
        self = this;

    beforeEach(function(done) {
        fsExtra.copy(origDir, targetDir, function(err) {
            if (err) {
                throw new Error("Could not prepare store: " + err);
            }

            self.store = new WikiStore({
                storeDirectory: targetDir
            });

            done();
        });
    });

    afterEach(function(done) {
        fsExtra.remove(targetDir, function(err) {
            if (err) {
                throw new Error("Could not delete store: " + err);
            }
            done();
        });
    });

    it("should fail if the target page already exists", function(done) {
        var self = this,
            origName = "IdontHaveDoubleU",
            targetName = "OswaldoPetterson";

        self.store.renamePage(origName, targetName, function(err) {
            expect(err).not.toEqual(null);
            self.store.pageExists(origName, function(res) {
                expect(res).toEqual(true);
                done();
            });
        });
    });

    it("should fail to rename WikiIndex", function(done) {
        this.store.renamePage("WikiIndex", "WhateverElse", function(err) {
            expect(err).not.toEqual(null);
            done();
        });
    });

    it("should fail if the original page doesn't exist", function(done) {
        var self = this;
        self.store.renamePage("BlahBlah", "BlehBleh", function(err) {
            expect(err).not.toEqual(null);

            self.store.pageExists("BlehBleh", function(res) {
                expect(res).toEqual(false);
                done();
            });
        });
    });

    it("should rename pages if the new name doesn't exist", function(done) {
        var self = this,
            origName = "IdontHaveDoubleU",
            targetName = "IdontHaveW";

        self.store.renamePage(origName, targetName, function(err) {
            expect(err).toEqual(null);
            self.store.pageExists(origName, function(res) {
                expect(res).toEqual(false);
                self.store.pageExists(targetName, function(res) {
                    expect(res).toEqual(true);
                    self.store.readPage(targetName, function(err, text) {
                        expect(err).toEqual(null);
                        expect(text).toEqual("I don't have that letter!\n");
                        done();
                    });
                });
            });
        });
    });
});

describe("Share page", function() {
    var origDir = "test/buster/stores/simple",
        targetDir = "test/buster/stores/sharing",
        self = this;

    beforeEach(function(done) {
        fsExtra.copy(origDir, targetDir, function(err) {
            if (err) {
                throw new Error("Could not prepare store: " + err);
            }

            self.store = new WikiStore({
                storeDirectory: targetDir
            });

            done();
        });
    });

    afterEach(function(done) {
        fsExtra.remove(targetDir, function(err) {
            if (err) {
                throw new Error("Could not delete store: " + err);
            }
            done();
        });
    });

    it("should be able to mark a page as shared", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU";

        self.store.sharePage(pageName, function(err, uuid) {
            expect(err).toEqual(null);
            expect(uuid.length).toEqual(36);
            self.store.pageShareId(pageName, function(err, actualUuid) {
                expect(err).toEqual(null);
                expect(actualUuid).toEqual(uuid);
                done();
            });
        });
    });

    it("should reuse the same share id when sharing an already shared page", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU",
            initialShareId;

        self.store.sharePage(pageName, function(err, shareId) {
            expect(err).toEqual(null);
            initialShareId = shareId;
            self.store.sharePage(pageName, function(err, shareId) {
                expect(err).toEqual(null);
                expect(shareId).toEqual(initialShareId);
                done();
            });
        });
    });

    it("should be able to check if a page is shared", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU";

        self.store.isPageShared(pageName, function(isSharedInitially) {
            expect(isSharedInitially).toEqual(false);

            self.store.sharePage(pageName, function(err/*, uuid*/) {
                expect(err).toEqual(null);
                self.store.isPageShared(pageName, function(isSharedNow) {
                    expect(isSharedNow).toEqual(true);
                    done();
                });
            });
        });
    });

    it("should be able to remove a page share", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU";

        self.store.isPageShared(pageName, function(isSharedInitially) {
            expect(isSharedInitially).toEqual(false);

            self.store.sharePage(pageName, function(err/*, uuid*/) {
                expect(err).toEqual(null);
                self.store.unsharePage(pageName, function(err) {
                    expect(err).toEqual(null);
                    self.store.isPageShared(pageName, function(isSharedNow) {
                        expect(isSharedNow).toEqual(false);
                        done();
                    });
                });
            });
        });
    });

    it("should return error when unsharing if the page is not shared", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU";

        self.store.isPageShared(pageName, function(isSharedInitially) {
            expect(isSharedInitially).toEqual(false);

            self.store.unsharePage(pageName, function(err) {
                expect(err).not.toEqual(null);
                done();
            });
        });
    });

    it("should assign a different share id every time a page is shared", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU",
            firstShareId,
            newShareId;

        self.store.sharePage(pageName, function(err, shareId) {
            expect(err).toEqual(null);
            firstShareId = shareId;
            self.store.unsharePage(pageName, function(err) {
                expect(err).toEqual(null);
                self.store.sharePage(pageName, function(err, shareId) {
                    expect(err).toEqual(null);
                    expect(shareId).not.toEqual(firstShareId);
                    newShareId = shareId;
                    self.store.pageShareId(pageName, function(err, lastShareId) {
                        expect(lastShareId).toEqual(newShareId);
                        done();
                    });
                });
            });
        });
    });

    it("should give a list of shared pages", function(done) {
        var self = this,
            pageName = "IdontHaveDoubleU",
            shareId;

        self.store.getSharedPages(function(err, sharedPageList) {
            expect(err).toEqual(null);
            expect(Object.keys(sharedPageList).length).toEqual(0);

            self.store.sharePage(pageName, function(err, id) {
                shareId = id;
                self.store.getSharedPages(function(err, sharedPageList) {
                    expect(err).toEqual(null);
                    expect(sharedPageList[pageName]).toEqual(shareId);

                    self.store.unsharePage(pageName, function(/*err*/) {
                        self.store.getSharedPages(function(err, sharedPageList) {
                            expect(Object.keys(sharedPageList).length).toEqual(0);
                            done();
                        });
                    });
                });
            });
        });
    });
});

describe("Attachments", function() {
    var origDir = "test/buster/stores/simple",
        targetDir = "test/buster/stores/attachments",
        self = this;

    beforeEach(function(done) {
        fsExtra.copy(origDir, targetDir, function(err) {
            if (err) {
                throw new Error("Could not prepare store: " + err);
            }

            self.store = new WikiStore({
                storeDirectory: targetDir
            });

            done();
        });
    });

    afterEach(function(done) {
        fsExtra.remove(targetDir, function(err) {
            if (err) {
                throw new Error("Could not delete store: " + err);
            }
            done();
        });
    });

    it("should have no attachments by default", function() {
        return self.store.getAttachmentList("WikiIndex").then(function(attachments) {
            expect(attachments).toEqual([]);
        });
    });

    it("should be created and retrieved", function() {
        var attachmentName = "foobar.txt",
            attachmentContents = "foobar is a very nice file";

        return self.store.writeAttachment("WikiIndex", attachmentName, attachmentContents).then(function() {
            return self.store.getAttachmentList("WikiIndex");
        }).then(function(attachments) {
            var attachmentNames = attachments.map(function(attachment) {
                return attachment.filename;
            });
            expect(attachmentNames).toEqual([attachmentName]);

            return self.store.readAttachment("WikiIndex", attachmentName);
        }).catch(function(contents) {
            expect(contents).toEqual(attachmentContents);
        });
    });

    it("should not be tricked by paths when writing attachments", function() {
        var attachmentBaseName = "lol.txt",
            attachmentName = "../" + attachmentBaseName;

        return self.store.writeAttachment("WikiIndex", attachmentName, "lol").then(function() {
            return self.store.getAttachmentList("WikiIndex");
        }).then(function(attachments) {
            var attachmentNames = attachments.map(function(attachment) {
                return attachment.filename;
            });
            expect(attachmentNames).toEqual([attachmentBaseName]);
        });
    });

    it("should not be tricked by paths when reading attachments", function() {
        var attachmentBaseName = "contents",
            attachmentName = "../" + attachmentBaseName,
            attachmentContents = "Some test contents";

        return self.store.writeAttachment("WikiIndex", attachmentName, attachmentContents).then(function() {
            return self.store.readAttachment("WikiIndex", attachmentName);
        }).then(function(contents) {
            expect(contents.toString()).toEqual(attachmentContents);
        });
    });

    it("should return file size and modification time", function() {
        var attachmentName = "foo.txt",
            attachmentContents = "This is a fake, testing file",
            contentsSize = attachmentContents.length,
            nowInSeconds = Math.floor(new Date().getTime() / 1000);

        return self.store.writeAttachment("WikiIndex", attachmentName, attachmentContents).then(function() {
            return self.store.getAttachmentList("WikiIndex");
        }).then(function(attachments) {
            var mtimeEpoch = attachments[0].mtime.getTime() / 1000;
            expect(attachments[0].size).toEqual(contentsSize);
            expect(mtimeEpoch).not.toBeLessThan(nowInSeconds);
            expect(mtimeEpoch).toBeLessThan(nowInSeconds + 3);
        });
    });

    it("should overwrite previous attachments with the same name", function() {
        var attachmentName = "foo.txt",
            originalContents = "Original contents",
            updatedContents = "Updated contents";

        return self.store.writeAttachment(
            "WikiIndex",
            attachmentName,
            originalContents
        ).then(function() {
            return self.store.writeAttachment("WikiIndex",
                                              attachmentName,
                                              updatedContents);
        }).then(function() {
            return self.store.getAttachmentList("WikiIndex");
        }).then(function(attachments) {
            var attachmentNames = attachments.map(function(attachment) {
                return attachment.filename;
            });
            expect(attachmentNames).toEqual([attachmentName]);

            return self.store.readAttachment("WikiIndex", attachmentName);
        }).then(function(contents) {
            expect(contents.toString()).toEqual(updatedContents);
        });
    });
});
