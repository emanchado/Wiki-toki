var fs = require("fs"),
    path = require("path");

// This must be synchronous! It doesn't really matter, because it's
// only executed before the HTTP server is even started.
function upgrade(storeDirectory) {
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


module.exports.upgrade = upgrade;
