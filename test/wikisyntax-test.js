/*global buster,describe,before,it,expect,wikisyntax*/

buster.spec.expose();

buster.assertions.add("isSubStringOf", {
    assert: function(containee, container) {
        return container.indexOf(containee) !== -1;
    },
    assertMessage: "${1} should contain ${0}",
    refuteMessage: "${1} should NOT contain ${0}",
    expectation: "toBeSubStringOf"
});

describe("Wikisyntax", function() {
  before(function() {
    this.dom = window.document.createElement('div');
  });

  it("should render an empty string", function() {
    expect(wikisyntax("")).toEqual("");
  });

  it("should render a simple string", function() {
    var string = "simple, unformatted string";
    expect(string).toBeSubStringOf(wikisyntax(string));
  });

  it("should have basic formatting", function() {
    var result = wikisyntax("simple, _formatted_ string");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('em');
    expect(links.length).toEqual(1);
    expect(links[0].innerHTML).toEqual('formatted');
  });

  it("should have wiki links", function() {
    var result = wikisyntax("simple WikiPage link");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect('/view/WikiPage').toBeSubStringOf(links[0].href);
    expect('WikiPage').toBeSubStringOf(links[0].text);
  });

  it("should have several wiki links", function() {
    var result = wikisyntax("simple WikiPage link, AnotherWikiPage");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(2);
    expect('/view/WikiPage').toBeSubStringOf(links[0].href);
    expect('WikiPage').toBeSubStringOf(links[0].text);
    expect('/view/AnotherWikiPage').toBeSubStringOf(links[1].href);
    expect('AnotherWikiPage').toBeSubStringOf(links[1].text);
  });

  it("should have wiki links inside formatting", function() {
    var result = wikisyntax("simple **WikiPage** link");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect('/view/WikiPage').toBeSubStringOf(links[0].href);
    expect('WikiPage').toBeSubStringOf(links[0].text);
  });

  it("should have several wiki links inside formatting", function() {
    var result = wikisyntax("simple **WikiPage link, AnotherWikiPage**");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(2);
    expect('/view/WikiPage').toBeSubStringOf(links[0].href);
    expect('WikiPage').toBeSubStringOf(links[0].text);
    expect('/view/AnotherWikiPage').toBeSubStringOf(links[1].href);
    expect('AnotherWikiPage').toBeSubStringOf(links[1].text);
  });

  it("should have wiki links inside and outside formatting", function() {
    var result = wikisyntax("simple **WikiPage** link, AnotherWikiPage");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(2);
    expect('/view/WikiPage').toBeSubStringOf(links[0].href);
    expect('WikiPage').toBeSubStringOf(links[0].text);
    expect('/view/AnotherWikiPage').toBeSubStringOf(links[1].href);
    expect('AnotherWikiPage').toBeSubStringOf(links[1].text);
  });

  it("should not consider mixedCaseIdentifiers as wiki links", function() {
    var result = wikisyntax("example of mixedCaseIndentifier");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(0);
  });

  it("should not linkify link URLs", function() {
    var result = wikisyntax("link to [the original wiki](http://c2.com/cgi/wiki?WikiWikiWeb)");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect("http://c2.com/cgi/wiki?WikiWikiWeb").toBeSubStringOf(links[0].href);
    expect("the original wiki").toBeSubStringOf(links[0].text);
  });

  it("should not linkify link texts", function() {
    var result =
          wikisyntax("link to [the original WikiWikiWeb](http://example.com/)");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect("http://example.com/").toBeSubStringOf(links[0].href);
    expect("the original WikiWikiWeb").toBeSubStringOf(links[0].text);
  });

  it("should not linkify wiki links with a leading '!'", function() {
    var result =
          wikisyntax("ToWikiLink! **or !WikiLink, that** is !TheQuestion");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect("/view/ToWikiLink").toBeSubStringOf(links[0].href);
    expect(links[0].text).toEqual("ToWikiLink");
    var boldChunk = this.dom.getElementsByTagName('strong');
    expect("or WikiLink).toBeSubStringOf(that", boldChunk[0].innerHTML);
  });

  it("should linkify URLs", function() {
    var url = "http://example.com/";
    var result = wikisyntax("This is an autolink to " + url);
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect(links[0].href).toEqual(url);
    expect(links[0].text).toEqual(url);
  });

  it("should not break URLs in links (text or URL)", function() {
    var url = "http://example.com/";
    var result =
          wikisyntax("This is a regular link to [" + url + "](" + url + ")");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(1);
    expect(links[0].href).toEqual(url);
    expect(links[0].text).toEqual(url);
  });

  it("should not use dots, commas or closing parens at the end of URLs when autolinking", function() {
    var url      = "http://example.com/";
    var result = wikisyntax("I'm linking to " + url + ", (" + url + ") and " +
                            url + ".");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(3);
    expect(links[0].href).toEqual(url);
    expect(links[0].text).toEqual(url);
    expect(links[1].href).toEqual(url);
    expect(links[1].text).toEqual(url);
    expect(links[2].href).toEqual(url);
    expect(links[2].text).toEqual(url);
  });

  it("should support autolinks and wikilinks in any order", function() {
    var url      = "http://example.com/";
    var wikiPage = "WikiExample";
    var result =
          wikisyntax("Linking spree: " + url + ", " + wikiPage + " and " +
                     url + " again");
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(3);
    expect(links[0].href).toEqual(url);
    expect(links[0].text).toEqual(url);
    expect(wikiPage).toBeSubStringOf(links[1].href);
    expect(links[1].text).toEqual(wikiPage);
    expect(links[2].href).toEqual(url);
    expect(links[2].text).toEqual(url);
  });

  it("should mark non-existing wiki pages", function() {
    var wikiPageList = ["WikiIndex", "WikiSomething"];
    var result =
          wikisyntax("Linking to WikiSomething, WikiSomethingSomething...",
                     {wikiPageList: wikiPageList});
    this.dom.innerHTML = result;
    var links = this.dom.getElementsByTagName('a');
    expect(links.length).toEqual(2);
    expect("WikiSomething").toBeSubStringOf(links[0].href);
    expect(links[0].text).toEqual("WikiSomething");
    expect("non-existent").not.toBeSubStringOf(links[0].className);
    expect("WikiSomethingSomething").toBeSubStringOf(links[1].href);
    expect(links[1].text).toEqual("WikiSomethingSomething");
    expect("non-existent").toBeSubStringOf(links[1].className);
  });
});
