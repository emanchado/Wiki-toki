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
    it("should return no results on empty search term", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/trivial"
        });

        return store.searchTitles("").then(function(results) {
            expect(results).toEqual([]);
        });
    });

    it("should find single result on one-term search", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/trivial"
        });

        return store.searchTitles("index").then(function(results) {
            expect(results).toEqual(["WikiIndex"]);
        });
    });

    it("should find multiple results on one-term search", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/simple"
        });

        return store.searchTitles("w").then(function(results) {
            expect(results.sort()).toEqual(["OswaldoPetterson", "WikiIndex"]);
        });
    });

    it("should find results that have ALL search terms", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/simple"
        });

        return store.searchTitles("w i").then(function(results) {
            expect(results).toEqual(["WikiIndex"]);
        });
    });
});

describe("Content search", function() {
    it("should return no results on empty search term", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });

        return store.searchContents("").then(function(results) {
            expect(results).toEqual([]);
        });
    });

    it("should find single result on a simple, one-term search", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });

        return store.searchContents("front").then(function(results) {
            expect(results).toEqual(["WikiIndex"]);
        });
    });

    it("should find single results regarless of casing", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });

        return store.searchContents("FRoNt").then(function(results) {
            expect(results).toEqual(["WikiIndex"]);
        });
    });

    it("should only find full words", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });

        return store.searchContents("fro").then(function(results) {
            expect(results).toEqual([]);
        });
    });

    it("should not allow the user to sabotage the regular expression", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });

        return store.searchContents("front\\").then(function(results) {
            expect(results).toEqual(["WikiIndex"]);
        });
    });

    it("should allow the user to use regular expressions", function() {
        var store = new WikiStore({
            storeDirectory: "test/buster/stores/content-search"
        });

        return store.searchContents("front.*").then(function(results) {
            expect(results.sort()).toEqual(["ProgrammingLanguages", "WikiIndex"]);
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

    it("should be able to mark a page as shared", function() {
        var self = this,
            pageName = "IdontHaveDoubleU",
            expectedUuid;

        return self.store.sharePage(pageName).then(function(uuid) {
            expect(uuid.length).toEqual(36);
            expectedUuid = uuid;
            return self.store.pageShareId(pageName);
        }).then(function(actualUuid) {
            expect(actualUuid).toEqual(expectedUuid);
        });
    });

    it("should reuse the same share id when sharing an already shared page", function() {
        var self = this,
            pageName = "IdontHaveDoubleU",
            initialShareId;

        return self.store.sharePage(pageName).then(function(shareId) {
            initialShareId = shareId;
            return self.store.sharePage(pageName);
        }).then(function(shareId) {
            expect(shareId).toEqual(initialShareId);
        });
    });

    it("should be able to check if a page is shared", function() {
        var self = this,
            pageName = "IdontHaveDoubleU";

        return self.store.isPageShared(pageName).then(function(isSharedInitially) {
            expect(isSharedInitially).toEqual(false);

            return self.store.sharePage(pageName);
        }).then(function(/*uuid*/) {
            return self.store.isPageShared(pageName);
        }).then(function(isSharedNow) {
            expect(isSharedNow).toEqual(true);
        });
    });

    it("should be able to remove a page share", function() {
        var self = this,
            pageName = "IdontHaveDoubleU";

        return self.store.isPageShared(pageName).then(function(isSharedInitially) {
            expect(isSharedInitially).toEqual(false);

            return self.store.sharePage(pageName);
        }).then(function(/*uuid*/) {
            return self.store.unsharePage(pageName);
        }).then(function() {
            return self.store.isPageShared(pageName);
        }).then(function(isSharedNow) {
            expect(isSharedNow).toEqual(false);
        });
    });

    it("should return error when unsharing if the page is not shared", function() {
        var self = this,
            pageName = "IdontHaveDoubleU";

        return self.store.isPageShared(pageName).then(function(isSharedInitially) {
            expect(isSharedInitially).toEqual(false);

            return self.store.unsharePage(pageName);
        }).then(function() {
            expect("no error").toEqual("this should have been an error");
        }).catch(function(err) {
            expect(err).not.toEqual(null);
        });
    });

    it("should assign a different share id every time a page is shared", function() {
        var self = this,
            pageName = "IdontHaveDoubleU",
            firstShareId,
            newShareId;

        return self.store.sharePage(pageName, function(err, shareId) {
            expect(err).toEqual(null);
            firstShareId = shareId;
            return self.store.unsharePage(pageName);
        }).then(function() {
            return self.store.sharePage(pageName);
        }).then(function(shareId) {
            expect(shareId).not.toEqual(firstShareId);
            newShareId = shareId;
            return self.store.pageShareId(pageName);
        }).then(function(lastShareId) {
            expect(lastShareId).toEqual(newShareId);
        });
    });

    it("should give a list of shared pages", function() {
        var self = this,
            pageName = "IdontHaveDoubleU",
            shareId;

        return self.store.getSharedPages().then(function(sharedPageList) {
            expect(Object.keys(sharedPageList).length).toEqual(0);

            return self.store.sharePage(pageName);
        }).then(function(id) {
            shareId = id;
            return self.store.getSharedPages();
        }).then(function(sharedPageList) {
            expect(sharedPageList[pageName]).toEqual(shareId);

            return self.store.unsharePage(pageName);
        }).then(function() {
            return self.store.getSharedPages();
        }).then(function(sharedPageList) {
            expect(Object.keys(sharedPageList).length).toEqual(0);
        });
    });

    it("should be able to retrieve the page name for a share id", function() {
        var self = this,
            pageName = "OswaldoPetterson";

        return self.store.sharePage(pageName).then(function(shareId) {
            return self.store.pageNameForShareId(shareId);
        }).then(function(actualPageName) {
            expect(actualPageName).toEqual(pageName);
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
