/*global wikisyntax, $ */

function updateWikiPage(wikiText, targetElement, parserOptions, imgEl) {
    targetElement.html(wikisyntax(wikiText, parserOptions));
    targetElement.find('.picture-link').hover(function() {
        $.data(imgEl, 'shouldShow', true);
        $.data(imgEl, 'error', false);
        $.data(imgEl, 'top', $(this).position().top);
        $.data(imgEl, 'left', $(this).position().left);
        imgEl.attr('src', this.href);
    }, function() {
        $.data(imgEl, 'shouldShow', false);
        imgEl.css('display', 'none');
    });
}

function markdownLiveUpdater(sourceElement, targetElement, parserOptions) {
    var imgEl = $('<img>').css({
        position: 'absolute',
        border: '1px solid black',
        borderRadius: '3%',
        backgroundImage: 'url("/images/checkers.jpg")',
        display: 'none'
    }).load(function() {
        if (!$.data(imgEl, 'shouldShow')) {
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

        var imageLinkTop = $.data(imgEl, 'top'),
            imageLinkLeft = $.data(imgEl, 'left'),
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

        imgEl.css(positionCss).css({width: imgWidth,
                                    height: imgHeight,
                                    display: ''});
    }).error(function() {
        if ($.data(imgEl, 'error')) {
            $.data(imgEl, 'shouldShow', false);
        } else {
            $.data(imgEl, 'error', true);
            imgEl.attr('src', '/images/broken-image.png');
        }
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
