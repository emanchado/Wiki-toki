/*global describe, it, beforeEach, afterEach */

var buster = require("buster"),
    fs = require("fs"),
    path = require("path"),
    fsExtra = require("fs-extra");
var WikiStore = require("../../lib/WikiStore.js");

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
        this.store.readPage("WikiIndex", function(err, data) {
            expect(data.toString()).toEqual("This is the index\n");
            done();
        });
    });
});

describe("Page save", function() {
    var storeDir = "test/buster/stores/save";

    beforeEach(function(done) {
        try {
            fs.mkdirSync(storeDir);
        } catch (e) {
            // If the directory was already there, remove any files
            fs.readdir(storeDir, function(err, files) {
                files.forEach(function(filePath) {
                    if (filePath[0] !== ".") {
                        fs.unlinkSync(path.join(storeDir, filePath));
                    }
                });
                done();
            });
        }
    });

    it("should create pages", function(done) {
        var store = new WikiStore({
            storeDirectory: storeDir
        });
        var pageContents = "New page\n";

        store.writePage("WikiIndex", pageContents, function() {
            store.readPage("WikiIndex", function(err, data) {
                expect(data.toString()).toEqual(pageContents);
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
                store.readPage("WikiIndex", function(err, data) {
                    expect(data.toString()).toEqual(contents2);
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
                storeDirectory: "test/buster/stores/rename"
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
                    self.store.readPage(targetName, function(err, contents) {
                        expect(err).toEqual(null);
                        expect(contents.toString()).toEqual("I don't have that letter!\n");
                        done();
                    });
                });
            });
        });
    });
});
