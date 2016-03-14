function formatDate(d) {
    var year = d.getFullYear(),
        month = d.getMonth(),
        day = d.getDate(),
        paddedMonth = month < 10 ? "0" + month : month,
        paddedDay = day < 10 ? "0" + day : day;

    return year + "-" + paddedMonth + "-" + paddedDay;
}

function renderPage(res, wikiStore, pageName, initialMode) {
    wikiStore.getPageList().then(function(wikiPageTitles) {
        wikiStore.readPage(pageName).then(function(data) {
            wikiStore.isPageShared(pageName).then(function(isShared) {
                wikiStore.getAttachmentList(pageName).then(function(attachmentList) {
                    res.render('view', {
                        pageName:         pageName,
                        rawText:          data.toString(),
                        wikiPageListJSON: JSON.stringify(wikiPageTitles),
                        isShared:         isShared,
                        attachments:      attachmentList,
                        attachmentBaseUrl: '/attachments/' + pageName,
                        formatDate:       formatDate,
                        initialMode:      initialMode
                    });
                });
            });
        }).catch(function(/*err*/) {
            res.render('create', {
                pageName:         pageName,
                wikiPageListJSON: JSON.stringify(wikiPageTitles)
            });
        });
    }).catch(function(err) {
        res.render('error', {message: err});
    });
}

function doRename(wikiStore, oldPageName, newPageName, res) {
    wikiStore.searchContents(oldPageName).then(function(results) {
        if (newPageName) {
            wikiStore.renamePage(oldPageName, newPageName).then(function() {
                if (results.length) {
                    res.render('after-rename', {
                        pageName: newPageName,
                        oldPageName: oldPageName,
                        linkingPages: results
                    });
                } else {
                    res.redirect('/view/' + newPageName);
                }
            }).catch(function(err) {
                res.render('rename', {
                    pageName: oldPageName,
                    linkingPages: results,
                    error: err
                });
            });
        } else {
            res.render('rename', {
                pageName: oldPageName,
                linkingPages: results
            });
        }
    }).catch(function(err) {
        res.render('error', {
            message: "Couldn't read list of wiki pages from directory " +
                wikiStore.config.storeDirectory + " because: " + err
        });
    });
}

module.exports.formatDate = formatDate;
module.exports.renderPage = renderPage;
module.exports.doRename = doRename;
