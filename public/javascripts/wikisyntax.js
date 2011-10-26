if (typeof(exports) !== 'undefined') {
  var markdown = require('markdown');
}

function _linkifyWikiNames(tree) {
  if (tree[0] === "link") {
    return tree;
  }

  for (var i = 1, len = tree.length; i < len; i++) {
    if (typeof(tree[i]) === 'object') {
      tree[i] = _linkifyWikiNames(tree[i]);
    } else {
      var re = new RegExp("\\b[A-Z][a-z]+([A-Z][a-z]*)+\\b", "g");
      var m = re.exec(tree[i]);
      if (m) {
        tree.splice(i, 1, tree[i].substr(0, m.index),
                    ["link", {href: "/view/" + m[0]}, m[0]],
                    tree[i].substr(re.lastIndex));
      }
    }
  }

  return tree;
}

function wikisyntax(text) {
  var tree = markdown.parse(text);
  return markdown.toHTML(_linkifyWikiNames(tree));
}

if (typeof(exports) !== 'undefined') {
  exports.wikisyntax = wikisyntax;
}
