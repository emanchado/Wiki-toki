/*global describe, it*/

var buster = require("buster");
var search = require("../../lib/search.js");

buster.spec.expose();
var expect = buster.expect;

describe("Search", function() {
    it("should return no results on empty search term", function() {
        expect(search(["WikiIndex", "SomethingElse"], "")).toEqual([]);
    });

    it("should find single result on one-term search", function() {
        var results = search(["WikiIndex", "SomethingElse"], "index");
        expect(results).toEqual(["WikiIndex"]);
    });

    it("should find multiple results on one-term search", function() {
        var results = search(["WikiIndex",
                              "OswaldoPetterson",
                              "IdontHaveDoubleU"], "w");
        expect(results).toEqual(["WikiIndex", "OswaldoPetterson"]);
    });

    it("should find results that have ALL search terms", function() {
        var results = search(["WikiIndex", "OswaldoPetterson"], "w i");
        expect(results).toEqual(["WikiIndex"]);
    });
});
