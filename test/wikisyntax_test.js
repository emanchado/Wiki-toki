function assertContains(msg, containee, container) {
  if (typeof(container) === 'undefined') {
    container = containee;
    containee = msg;
    msg       = '"' + container + '" should contain "' + containee + '"';
  }
  assertNotEquals(msg, -1, container.indexOf(containee));
}

TestCase("Wikisyntax", sinon.testCase({
  setUp: function() {
    this.dom = document.createElement('div');
  },

  "test should render an empty string": function() {
    assertEquals(wikisyntax(""), "");
  },

  "test should render a simple string": function() {
    var string = "simple, unformatted string";
    var result = wikisyntax(string);
    assertContains(string, result);
  },

  "test should have basic formatting": function() {
    var result = wikisyntax("simple, _formatted_ string");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('em');
    assertEquals(1, links.length);
    assertEquals('formatted', links[0].innerHTML);
  },

  "test should have wiki links": function() {
    var result = wikisyntax("simple WikiPage link");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertContains('/view/WikiPage', links[0].href);
    assertEquals('WikiPage',         links[0].text);
  },

  "test should have several wiki links": function() {
    var result = wikisyntax("simple WikiPage link, AnotherWikiPage");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(2, links.length);
    assertContains('/view/WikiPage',        links[0].href);
    assertEquals('WikiPage',                links[0].text);
    assertContains('/view/AnotherWikiPage', links[1].href);
    assertEquals('AnotherWikiPage',         links[1].text);
  },

  "test should have wiki links inside formatting": function() {
    var result = wikisyntax("simple **WikiPage** link");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertContains('/view/WikiPage', links[0].href);
    assertEquals('WikiPage',         links[0].text);
  },

  "test should have several wiki links inside formatting": function() {
    var result = wikisyntax("simple **WikiPage link, AnotherWikiPage**");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(2, links.length);
    assertContains('/view/WikiPage',        links[0].href);
    assertEquals('WikiPage',                links[0].text);
    assertContains('/view/AnotherWikiPage', links[1].href);
    assertEquals('AnotherWikiPage',         links[1].text);
  },

  "test should have wiki links inside and outside formatting": function() {
    var result = wikisyntax("simple **WikiPage** link, AnotherWikiPage");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(2, links.length);
    assertContains('/view/WikiPage',        links[0].href);
    assertEquals('WikiPage',                links[0].text);
    assertContains('/view/AnotherWikiPage', links[1].href);
    assertEquals('AnotherWikiPage',         links[1].text);
  },

  "test should not consider mixedCaseIdentifiers as wiki links": function() {
    var result = wikisyntax("example of mixedCaseIndentifier");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(0, links.length);
  },

  "test should not linkify link URLs": function() {
    var result = wikisyntax("link to [the original wiki](http://c2.com/cgi/wiki?WikiWikiWeb)");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertEquals("http://c2.com/cgi/wiki?WikiWikiWeb", links[0].href);
    assertEquals("the original wiki",                  links[0].text);
  },

  "test should not linkify link texts": function() {
    var result =
          wikisyntax("link to [the original WikiWikiWeb](http://example.com/)");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertEquals("http://example.com/",      links[0].href);
    assertEquals("the original WikiWikiWeb", links[0].text);
  },

  "test should not linkify wiki links with a leading '!'": function() {
    var result =
          wikisyntax("ToWikiLink! **or !WikiLink, that** is !TheQuestion");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertContains("/view/ToWikiLink", links[0].href);
    assertEquals("ToWikiLink",         links[0].text);
    var boldChunk = this.dom.getElementsByTagName('strong');
    assertEquals("or WikiLink, that", boldChunk[0].innerHTML);
  },

  "test should linkify URLs": function() {
    var url = "http://example.com/";
    var result = wikisyntax("This is an autolink to " + url);
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertEquals(url, links[0].href);
    assertEquals(url, links[0].text);
  },

  "test should not break URLs in links (text or URL)": function() {
    var url = "http://example.com/";
    var result =
          wikisyntax("This is a regular link to [" + url + "](" + url + ")");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertEquals(url, links[0].href);
    assertEquals(url, links[0].text);
  },

  "test should not use dots, commas or closing parens at the end of URLs when autolinking": function() {
    var url      = "http://example.com/";
    var result = wikisyntax("I'm linking to " + url + ", (" + url + ") and " +
                            url + ".");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(3, links.length);
    assertEquals(url, links[0].href);
    assertEquals(url, links[0].text);
    assertEquals(url, links[1].href);
    assertEquals(url, links[1].text);
    assertEquals(url, links[2].href);
    assertEquals(url, links[2].text);
  },

  "test should support autolinks and wikilinks in any order": function() {
    var url      = "http://example.com/";
    var wikiPage = "WikiExample";
    var result =
          wikisyntax("Linking spree: " + url + ", " + wikiPage + " and " +
                     url + " again");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(3, links.length);
    assertEquals(url, links[0].href);
    assertEquals(url, links[0].text);
    assertContains(wikiPage, links[1].href);
    assertEquals(wikiPage,   links[1].text);
    assertEquals(url, links[2].href);
    assertEquals(url, links[2].text);
  }
}));
