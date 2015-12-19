/*global wikisyntax, $ */

function updateWikiPage(wikiText, targetElement, parserOptions, imgEl) {
    targetElement.html(wikisyntax(wikiText, parserOptions));
    targetElement.find('.picture-link').hover(function() {
        imgEl.data('shouldShow', true);
        imgEl.data('error', false);
        imgEl.data('top', $(this).position().top);
        imgEl.data('left', $(this).position().left);
        imgEl.attr('src', this.href);
    }, function() {
        imgEl.data('shouldShow', false);
        imgEl.css('display', 'none');
    });
}

function previewImageElement() {
    return $('<img>').css({
        position: 'absolute',
        border: '1px solid black',
        borderRadius: '3%',
        backgroundImage: 'url("/images/checkers.jpg")',
        display: 'none'
    }).load(function() {
        if (!$(this).data('shouldShow')) {
            return;
        }

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

        var imageLinkTop = $(this).data('top'),
            imageLinkLeft = $(this).data('left'),
            win = $(window),
            windowTop = win.scrollTop(),
            windowBottom = windowTop + win.height(),
            distanceTop = imageLinkTop - windowTop,
            distanceBottom = windowBottom - imageLinkTop,
            positionCss = {left: imageLinkLeft + 20};

        if (distanceBottom > 300 || distanceBottom > distanceTop) {
            positionCss.top = imageLinkTop + 20;
        } else {
            positionCss.top = imageLinkTop - imgHeight - 5;
        }

        $(this).css(positionCss).css({width: imgWidth,
                                    height: imgHeight,
                                    display: ''});
    }).error(function() {
        if ($(this).data('error')) {
            $(this).data('shouldShow', false);
        } else {
            $(this).data('error', true);
            $(this).attr('src', '/images/broken-image.png');
        }
    }).appendTo('body');
}

function markdownLiveUpdater(sourceElement, targetElement, parserOptions) {
    var imgEl = previewImageElement();

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
