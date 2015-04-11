var fs = require("fs"),
    path = require("path");

function moveToPages(storeDirectory) {
    var pagesDirPath = path.join(storeDirectory, "pages");

    try {
        var pagesDirStat = fs.statSync(pagesDirPath);
        if (!pagesDirStat.isDirectory()) {
            throw new Error(pagesDirPath + " exists, but it isn't a directory!");
        }
    } catch (e) {
        var files = fs.readdirSync(storeDirectory);

        fs.mkdirSync(pagesDirPath, 0755);
        files.forEach(function(filePath) {
            if (!/^\./.test(filePath) && filePath !== "pages") {
                fs.renameSync(path.join(storeDirectory, filePath),
                              path.join(pagesDirPath, filePath));
            }
        });
    }
}

function turnPagesIntoDirectories(storeDirectory) {
    var pagesDirectory = path.join(storeDirectory, "pages"),
        indexStat = fs.statSync(path.join(pagesDirectory, "WikiIndex"));

    if (indexStat.isDirectory()) {
        return;
    }

    var pages = fs.readdirSync(pagesDirectory).filter(function(file) {
        return !/^\./.test(file);
    });
    pages.forEach(function(pageName) {
        fs.renameSync(path.join(pagesDirectory, pageName),
                      path.join(storeDirectory, pageName));
        fs.mkdirSync(path.join(pagesDirectory, pageName));
        fs.renameSync(path.join(storeDirectory, pageName),
                      path.join(pagesDirectory, pageName, "contents"));
    });
}

// This must be synchronous! It's not really a problem because it's
// only executed once, on startup, before the HTTP server is even
// started.
function upgrade(storeDirectory) {
    var upgradeFunctions = [moveToPages, turnPagesIntoDirectories];

    upgradeFunctions.forEach(function(upgradeFunc) {
        upgradeFunc(storeDirectory);
    });
}


module.exports.upgrade = upgrade;
