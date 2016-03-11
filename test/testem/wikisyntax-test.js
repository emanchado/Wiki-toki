/*global describe,beforeEach,it,expect,wikisyntax*/

describe("WikiSyntax", function() {
    beforeEach(function() {
        this.addMatchers({
            toBeSubStringOf: function(container) {
                return container.indexOf(this.actual) !== -1;
            }
        });
        this.dom = window.document.createElement('div');
    });

    describe("Basic syntax", function() {
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
    });

    describe("WikiLinks", function() {
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

        it("should allow numbers in wiki links", function() {
            var exampleWikiLinks = ["OldDiary2013", "Old2013Diary"];
            var result = wikisyntax("example of " + exampleWikiLinks.join(" and "));
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            [0,1].forEach(function(i) {
                var wikiLink = exampleWikiLinks[i];
                expect('/view/' + wikiLink).toBeSubStringOf(links[i].href);
                expect(wikiLink).toEqual(links[i].text);
            });
        });

        it("should not consider WordNNN as a wiki link", function() {
            var result = wikisyntax("example of Diary2014");
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(0);
        });

        it("should not linkify link URLs", function() {
            var result = wikisyntax(
                "link to [the original wiki](http://c2.com/cgi/wiki?WikiWikiWeb)"
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(1);
            expect("http://c2.com/cgi/wiki?WikiWikiWeb").
                toBeSubStringOf(links[0].href);
            expect("the original wiki").toBeSubStringOf(links[0].text);
        });

        it("should not linkify link texts", function() {
            var result = wikisyntax(
                "link to [the original WikiWikiWeb](http://example.com/)"
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(1);
            expect("http://example.com/").toBeSubStringOf(links[0].href);
            expect("the original WikiWikiWeb").toBeSubStringOf(links[0].text);
        });

        it("should not linkify wiki links with a leading '!'", function() {
            var result = wikisyntax(
                "ToWikiLink! **or !WikiLink, that** is !TheQuestion"
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(1);
            expect("/view/ToWikiLink").toBeSubStringOf(links[0].href);
            expect(links[0].text).toEqual("ToWikiLink");
            var boldChunk = this.dom.getElementsByTagName('strong');
            expect("or WikiLink, that").toBeSubStringOf(boldChunk[0].innerHTML);
        });

        it("should mark non-existing wiki pages", function() {
            var wikiPageList = ["WikiIndex", "WikiSomething"];
            var result = wikisyntax(
                "Linking to WikiSomething, WikiSomethingSomething...",
                {wikiPageList: wikiPageList}
            );
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

        it("should not link WikiNames in shared pages", function() {
            var result = wikisyntax(
                "In a shared page, you won't be able to see SomeWikiPage anyway",
                {sharedPage: true}
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(0);
        });
    });

    describe("URL auto-linking", function() {
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
            var result = wikisyntax(
                "This is a regular link to [" + url + "](" + url + ")"
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(1);
            expect(links[0].href).toEqual(url);
            expect(links[0].text).toEqual(url);
        });

        it("should not use dots, commas or closing parens/question marks at the end of URLs when autolinking", function() {
            var url      = "http://example.com/";
            var result = wikisyntax(
                "I'm linking to " + url + ", (" + url + "), " + url + "? and " + url + "."
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(4);
            for (var i = 0, len = links.length; i < len; i++) {
                expect(links[i].href).toEqual(url);
                expect(links[i].text).toEqual(url);
            }
        });

        it("should support autolinks and wikilinks in any order", function() {
            var url      = "http://example.com/";
            var wikiPage = "WikiExample";
            var result = wikisyntax(
                "Linking spree: " + url + ", " + wikiPage + " and " +
                    url + " again"
            );
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

        it("should count ':' and '+' in URLs", function() {
            var url = "https://launchpad.net:10443/ubuntu/+ppas";
            var result = wikisyntax("This is a trickier autolink, to " + url);
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(1);
            expect(links[0].href).toEqual(url);
            expect(links[0].text).toEqual(url);
        });

        it("should include GET parameters in auto-linked URLs", function() {
            var url1 = "http://forum.xda-developers.com/showthread.php?t=1945441&foo=bar%20qux",
                url2 = "https://www.youtube.com/watch?v=xJdf9Y86_2s",
                url3 = "https://www.youtube.com/watch?v=OMJ6Q-8jnzk";
            var result = wikisyntax("These are links with GET params: " + url1 +
                                    " " + url2 + " " + url3);
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(3);
            expect(links[0].href).toEqual(url1);
            expect(links[0].text).toEqual(url1);
            expect(links[1].href).toEqual(url2);
            expect(links[1].text).toEqual(url2);
            expect(links[2].href).toEqual(url3);
            expect(links[2].text).toEqual(url3);
        });

        it("should include anchors in auto-linked URLs", function() {
            var urls = ["http://www.pac-rom.com/#Home",
                        "http://www.pac-rom.com/#"];
            var result = wikisyntax("Two links with anchor: " + urls[0] + " " +
                                    urls[1]);
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links.length).toEqual(2);
            [0,1].forEach(function(i) {
                expect(links[i].href).toEqual(urls[i]);
                expect(links[i].text).toEqual(urls[i]);
            });
        });

        it("should mark wikipedia links", function() {
            var result = wikisyntax("[Foo](http://wikipedia.org/wiki/Foo)");
            this.dom.innerHTML = result;
            var link = this.dom.getElementsByTagName('a');
            expect(link[0].className).toEqual('wikipedia-link');
        });

        it("should mark PDF links", function() {
            var result = wikisyntax(
                "[PDF](http://example.com/foo.pdf) " +
                    "[PDF with params](http://example.com/foo.pdf?full=yes) " +
                    "[PDF mention](http://example.com/download.php?file=foo.pdf)"
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links[0].className).toEqual('pdf-link');
            expect(links[1].className).toEqual('pdf-link');
            expect(links[2].className).not.toEqual('pdf-link');
        });

        it("should mark picture links", function() {
            var result = wikisyntax(
                "[jpg](http://example.com/foo.jpg) " +
                    "[JPG](http://example.com/foo.JPG) " +
                    "[Jpeg](http://example.com/foo.Jpeg) " +
                    "[Gif](http://example.com/foo.Gif) " +
                    "[png](http://example.com/foo.png) " +
                    "[JPG mention](http://example.com/download.php?file=foo.jpg)"
            );
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links[0].className).toEqual('picture-link');
            expect(links[1].className).toEqual('picture-link');
            expect(links[2].className).toEqual('picture-link');
            expect(links[3].className).toEqual('picture-link');
            expect(links[4].className).toEqual('picture-link');
            expect(links[5].className).not.toEqual('picture-link');
        });
    });

    describe("Attachment syntax", function() {
        it("should link to attachments", function() {
            var result = wikisyntax("[foo](attachment://tpsreport.pdf)",
                                    {attachmentBaseUrl: "/attachments/Test"});
            this.dom.innerHTML = result;
            var links = this.dom.getElementsByTagName('a');
            expect(links[0].href).toMatch('/attachments/Test/tpsreport.pdf$');
        });
    });

    describe("Strike-out syntax", function() {
        it("should recognise strike-out marks", function() {
            var result = wikisyntax("You're an ~~idiot~~ troubled individual.");
            this.dom.innerHTML = result;
            var strikeoutBits = this.dom.getElementsByTagName('s');
            expect(strikeoutBits.length).toEqual(1);
            expect(strikeoutBits[0].innerHTML).toEqual('idiot');
        });

        it("should recognise strike-out marks with WikiLinks inside", function() {
            var result = wikisyntax("Don't like to ~~WikiIndex~~, it's silly.");
            this.dom.innerHTML = result;
            var strikeoutBits = this.dom.getElementsByTagName('s');
            expect(strikeoutBits.length).toEqual(1);
            expect('WikiIndex').toBeSubStringOf(strikeoutBits[0].innerHTML);
        });

        it("should recognise strike-out marks with WikiLinks inside", function() {
            var result =
                    wikisyntax("I thought the film would be ~~bleh, _bleh_~~.");
            this.dom.innerHTML = result;
            var strikeoutBits = this.dom.getElementsByTagName('s');
            expect(strikeoutBits.length).toEqual(1);
            expect(strikeoutBits[0].innerHTML).toEqual('bleh, <em>bleh</em>');
        });

        it("should leave unrecognised '~~' alone", function() {
            var string = "I drool... :-)~~";
            expect(string).toBeSubStringOf(wikisyntax(string));
        });
    });
});
