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
    assertContains('WikiPage',       links[0].text);
  },

  "test should have several wiki links": function() {
    var result = wikisyntax("simple WikiPage link, AnotherWikiPage");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(2, links.length);
    assertContains('/view/WikiPage',        links[0].href);
    assertContains('WikiPage',              links[0].text);
    assertContains('/view/AnotherWikiPage', links[1].href);
    assertContains('AnotherWikiPage',       links[1].text);
  },

  "test should have wiki links inside formatting": function() {
    var result = wikisyntax("simple **WikiPage** link");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertContains('/view/WikiPage', links[0].href);
    assertContains('WikiPage',       links[0].text);
  },

  "test should have several wiki links inside formatting": function() {
    var result = wikisyntax("simple **WikiPage link, AnotherWikiPage**");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(2, links.length);
    assertContains('/view/WikiPage',        links[0].href);
    assertContains('WikiPage',              links[0].text);
    assertContains('/view/AnotherWikiPage', links[1].href);
    assertContains('AnotherWikiPage',       links[1].text);
  },

  "test should have wiki links inside and outside formatting": function() {
    var result = wikisyntax("simple **WikiPage** link, AnotherWikiPage");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(2, links.length);
    assertContains('/view/WikiPage',        links[0].href);
    assertContains('WikiPage',              links[0].text);
    assertContains('/view/AnotherWikiPage', links[1].href);
    assertContains('AnotherWikiPage',       links[1].text);
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
    var result = wikisyntax("link to [the original WikiWikiWeb](http://example.com/)");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    assertEquals(1, links.length);
    assertEquals("http://example.com/",      links[0].href);
    assertEquals("the original WikiWikiWeb", links[0].text);
  }
}));
