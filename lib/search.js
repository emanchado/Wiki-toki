module.exports = function(pageNames, searchTerms) {
    if (searchTerms === "") {
        return [];
    }

    var searchTermArray = searchTerms.split(/\s+/);
    var searchExpressions = searchTermArray.map(function(st) {
        return new RegExp(st, "i");
    });

    var results = pageNames.filter(function(pageName) {
        return searchExpressions.every(function(se) {
            return pageName.match(se);
        });
    });
    return results;
};
