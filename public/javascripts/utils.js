/*global alert */
/*exported addToTextarea, clipboardCopy */

function addToTextarea(textareaEl, text) {
    if (textareaEl.selectionStart || textareaEl.selectionStart === 0) {
        textareaEl.value =
            textareaEl.value.substring(0, textareaEl.selectionStart) +
            text +
            textareaEl.value.substring(textareaEl.selectionEnd);
    } else {
        textareaEl.value += text;
    }
}

function clipboardCopy(text) {
    var tmpEl = document.createElement('input');
    tmpEl.setAttribute('type', 'text');
    tmpEl.setAttribute('style', 'height: 1px; border: 0');
    tmpEl.setAttribute('value', text);
    document.body.appendChild(tmpEl);
    tmpEl.select();
    if (!document.execCommand('copy')) {
        alert("Could not copy '" + text + "' to the clipboard");
    }
    document.body.removeChild(tmpEl);
}
