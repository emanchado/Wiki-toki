if (typeof(exports) !== 'undefined') {
  var markdown = require('markdown');
}

// Regular expressions for wiki-specific syntax on top of Markdown
var reWikiPages = new RegExp("(!)?\\b[A-Z][a-z]+([A-Z][a-z]*)+\\b", "g");
reWikiPages.transformation = function(m) {
  return m[1] ? m[0].substr(1) : ["link", {href: "/view/" + m[0]}, m[0]];
};
var reUrl = new RegExp("https?://[a-z0-9.-]+(/([,.]*[a-z0-9/&%-]+)*)?", "gi");
reUrl.transformation = function(m) { return ["link", {href: m[0]}, m[0]]; };

var extraSyntaxExpressions = [reWikiPages, reUrl];

function _extraMarkup(tree) {
  if (tree[0] === "link") {
    return tree;
  }

  for (var i = 1, len = tree.length; i < len; i++) {
    if (typeof(tree[i]) === 'object') {
      tree[i] = _extraMarkup(tree[i]);
    } else {
      var matchingPairs = [];
      for (var j = 0, len2 = extraSyntaxExpressions.length; j < len2; j++) {
        extraSyntaxExpressions[j].lastIndex = 0;
        matchingPairs.push([extraSyntaxExpressions[j],
                            extraSyntaxExpressions[j].exec(tree[i])]);
      }

      var firstMatchingPair = matchingPairs.sort(function(a, b) {
        var aIndex = (a[1] === null) ? Infinity : a[1].index,
            bIndex = (b[1] === null) ? Infinity : b[1].index;
        if (aIndex === bIndex) return 0;
        return (aIndex > bIndex) ? 1 : -1;
      })[0];

      if (firstMatchingPair[1]) {
        tree.splice(i, 1,
                    tree[i].substr(0, firstMatchingPair[1].index),
                    firstMatchingPair[0].transformation(firstMatchingPair[1]),
                    tree[i].substr(firstMatchingPair[0].lastIndex));
        // We're putting three elements in the place of one, so tweak
        // the counters
        i   = i + 1;
        len = len + 2;
      }
    }
  }

  return tree;
}

function wikisyntax(text) {
  var tree = markdown.parse(text);
  return markdown.toHTML(_extraMarkup(tree));
}

if (typeof(exports) !== 'undefined') {
  exports.wikisyntax = wikisyntax;
}
