if (typeof(exports) !== 'undefined') {
  var markdown = require('markdown');
}

function wikisyntax(text) {
  var html = markdown.toHTML(text);
  return html.replace(/\b[A-Z][a-z]+([A-Z][a-z]*)+\b/g, function(pageName) {
    return '<a href="/view/' + pageName + '">' + pageName + '</a>';
  });
}

if (typeof(exports) !== 'undefined') {
  exports.wikisyntax = wikisyntax;
}
