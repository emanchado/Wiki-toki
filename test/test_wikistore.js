TestCase("WikistoreTest", sinon.testCase({
  "test should create a simple store": function() {
    var store = new Wikistore({}, {});
    assertObject(store);
  },

  "test should read a simple wiki page": function() {
    var fakeFs = {
      readFile: function(name, cb) {
        cb(null, "Contents of FooBar");
      }
    };
    var store = new Wikistore({}, fakeFs);
    store.getPage("FooBar", function(text) {
      assertEquals(text, "Contents of FooBar");
    });
  },

  "test should fail to read a non-existing wiki page": function() {
    var fakeFs = {
      readFile: function(name, cb) {
        cb("Non-existent file");
      }
    };
    var store = new Wikistore({}, fakeFs);
    store.getPage("FooBar",
                  function(text) {
                    assert(false,
                           "Shouldn't have received text, received " + text);
                  },
                  function(errorMsg) {
                    assertNotUndefined(errorMsg);
                  });
  }
}));
