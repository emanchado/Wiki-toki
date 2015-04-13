/*global wikisyntax */

function markdownLiveUpdater(sourceElement, targetElement, parserOptions) {
    targetElement.html(wikisyntax(sourceElement.val(), parserOptions));

    sourceElement.bind('input', function() {
        if (targetElement.data('event-state') !== 'buffered') {
            targetElement.data('event-state', 'buffered');
            setTimeout(function() {
                targetElement.data('event-state', '');
                targetElement.html(wikisyntax(sourceElement.val(),
                                              parserOptions));
            }, 500);
        }
    });
}
