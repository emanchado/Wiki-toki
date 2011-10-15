if (typeof(exports) !== 'undefined') {
  var markdown = require('markdown');
}

function wikisyntax(text) {
  var html = markdown.toHTML(text);
  return html.replace(/[A-Z][a-z]+([A-Z][a-z]*)+/g, function(wikiPageName) {
    return '<a href="/view/' + wikiPageName + '">' + wikiPageName + '</a>';
  });
}

if (typeof(exports) !== 'undefined') {
  exports.wikisyntax = wikisyntax;
}
