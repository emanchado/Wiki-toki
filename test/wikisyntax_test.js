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
  }
}));
