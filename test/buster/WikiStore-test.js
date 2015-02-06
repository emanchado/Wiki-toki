/*global describe, it, before */

var buster = require("buster"),
    fs = require("fs"),
    path = require("path");
var WikiStore = require("../../lib/WikiStore.js");

buster.spec.expose();
var expect = buster.expect;

describe("Retrieval", function() {
    before(function() {
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

    before(function(done) {
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

describe("Search", function() {
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
