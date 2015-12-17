/*global wikisyntax, $ */

function updateWikiPage(wikiText, targetElement, parserOptions, imgEl) {
    targetElement.html(wikisyntax(wikiText, parserOptions));
    targetElement.find('.picture-link').hover(function() {
        var position = $(this).position();

        imgEl.css({top: position.top + 20,
                   left: position.left + 20}).
            attr('src', this.href);
    }, function() {
        imgEl.css('display', 'none');
    });
}

function markdownLiveUpdater(sourceElement, targetElement, parserOptions) {
    var imgEl = $('<img>').css({
        position: 'absolute',
        border: '1px solid black',
        display: 'none'
    }).load(function() {
        var imgWidth = this.width,
            imgHeight = this.height;

        if (imgWidth > 300) {
            var widthQuo = imgWidth / 300;
            imgWidth = imgWidth / widthQuo;
            imgHeight = imgHeight / widthQuo;
        }

        if (imgHeight > 300) {
            var heightQuo = imgHeight / 300;
            imgWidth = imgWidth / heightQuo;
            imgHeight = imgHeight / heightQuo;
        }

        imgEl.css({width: imgWidth,
                   height: imgHeight,
                   display: ''});
    }).appendTo('body');

    updateWikiPage(sourceElement.val(), targetElement, parserOptions, imgEl);

    sourceElement.bind('input', function() {
        if (targetElement.data('event-state') !== 'buffered') {
            targetElement.data('event-state', 'buffered');
            setTimeout(function() {
                targetElement.data('event-state', '');
                updateWikiPage(sourceElement.val(),
                               targetElement,
                               parserOptions,
                               imgEl);
            }, 500);
        }
    });
}
