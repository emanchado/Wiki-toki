/*global wikisyntax, $ */

var SPINNER_WIDTH = 16,
    SPINNER_HEIGHT = 16,
    SPINNER_URL = '/images/ajax-loader.gif';

function previewPositionCss(cursorTop, cursorLeft, _imgWidth, imgHeight) {
    var win = $(window),
        absoluteCursorTop = win.scrollTop() + cursorTop,
        distanceTop = cursorTop,
        distanceBottom = win.height() - cursorTop,
        positionCss = {left: cursorLeft + 10};

    if (distanceBottom > 300 || distanceBottom > distanceTop) {
        positionCss.top = absoluteCursorTop + 10;
    } else {
        positionCss.top = absoluteCursorTop - imgHeight - 10;
    }
    return positionCss;
}

function resize(imgWidth, imgHeight, maxWidth, maxHeight) {
    if (imgWidth > maxWidth) {
        var widthQuo = imgWidth / 300;
        imgWidth = imgWidth / widthQuo;
        imgHeight = imgHeight / widthQuo;
    }

    if (imgHeight > maxHeight) {
        var heightQuo = imgHeight / 300;
        imgWidth = imgWidth / heightQuo;
        imgHeight = imgHeight / heightQuo;
    }

    return [imgWidth, imgHeight];
}

function previewImageElement() {
    var previewEl = $('<div>').addClass('image-preview').
            css('display', 'none').
            appendTo('body');

    var loadingSpinner = $('<img>').addClass('loading-spinner').
            attr('src', SPINNER_URL).
            appendTo(previewEl);

    $('<img>').addClass('image-preview-image').css({
        display: 'none'
    }).load(function() {
        if (! previewEl.data('shouldShow')) {
            return;
        }

        var dim = resize(this.naturalWidth, this.naturalHeight, 300, 300),
            previewImgWidth = dim[0],
            previewImgHeight = dim[1];

        loadingSpinner.css('display', 'none');
        // Need "display: 'block'" explicitly to avoid some annoying
        // white border below the image
        $(this).css({width: previewImgWidth,
                     height: previewImgHeight,
                     display: 'block'});
        previewEl.css(previewPositionCss(previewEl.data('cursorTop'),
                                         previewEl.data('cursorLeft'),
                                         previewImgWidth,
                                         previewImgHeight));
    }).error(function() {
        $(this).attr('src', '/images/broken-image.png');
    }).appendTo(previewEl);

    return previewEl;
}

function loadImageHandler(previewEl) {
    return function(event) {
        previewEl.data('shouldShow', true);
        previewEl.data('cursorTop', event.clientY);
        previewEl.data('cursorLeft', event.clientX);

        previewEl.find('.loading-spinner').css('display', '');
        previewEl.css('display', '').
            css(previewPositionCss(previewEl.data('cursorTop'),
                                   previewEl.data('cursorLeft'),
                                   SPINNER_WIDTH,
                                   SPINNER_HEIGHT));
        previewEl.find('.image-preview-image').css('display', 'none').
            attr('src', this.href);
    };
}

function hideImageHandler(previewEl) {
    return function() {
        previewEl.data('shouldShow', false);
        previewEl.css('display', 'none');
    };
}

function updateWikiPage(wikiText, targetElement, parserOptions, previewEl) {
    targetElement.html(wikisyntax(wikiText, parserOptions));
    targetElement.find('.picture-link').hover(loadImageHandler(previewEl),
                                              hideImageHandler(previewEl));
}

function markdownLiveUpdater(sourceElement, targetElement, parserOptions) {
    var previewEl = previewImageElement();

    updateWikiPage(sourceElement.val(), targetElement, parserOptions, previewEl);

    sourceElement.bind('input', function() {
        if (targetElement.data('event-state') !== 'buffered') {
            targetElement.data('event-state', 'buffered');
            setTimeout(function() {
                targetElement.data('event-state', '');
                updateWikiPage(sourceElement.val(),
                               targetElement,
                               parserOptions,
                               previewEl);
            }, 500);
        }
    });
}
