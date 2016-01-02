/*global setTimeout */

var robohydra               = require("robohydra"),
    heads                   = robohydra.heads,
    RoboHydraHeadFilesystem = heads.RoboHydraHeadFilesystem,
    RoboHydraHeadProxy      = heads.RoboHydraHeadProxy,
    RoboHydraHead           = heads.RoboHydraHead,
    Response                = robohydra.Response;

function writeChunkedResponse(res, sourceRes, chunkSize, i) {
    var totalLength = sourceRes.body.length;
    i = i || 0;

    if (i * chunkSize < totalLength) {
        console.log("Writing chunk", i);
        res.write(sourceRes.body.slice(i * chunkSize,
                                       i * chunkSize + chunkSize));
        setTimeout(function() {
            writeChunkedResponse(res, sourceRes, chunkSize, i + 1);
        }, 1000);
    } else {
        res.end();
    }
}

module.exports.getBodyParts = function() {
    return {
        heads: [
            new RoboHydraHead({
                name: 'image-latency',
                path: '/static-test/latency/.*',
                handler: function(req, res, next) {
                    req.url = req.url.replace('/latency/', '/');

                    setTimeout(function() {
                        next(req, res);
                    }, 3000);
                }
            }),

            new RoboHydraHead({
                name: 'image-slowness',
                path: '/static-test/slow/.*',
                handler: function(req, res, next) {
                    req.url = req.url.replace('/slow/', '/');

                    var fakeRes = new Response().on('end', function(evt) {
                        res.writeHead(evt.response.statusCode,
                                      evt.response.headers);
                        writeChunkedResponse(res, evt.response,
                                             evt.response.body.length / 5);
                    });

                    next(req, fakeRes);
                }
            }),

            new RoboHydraHeadFilesystem({
                name: 'static-test-images',
                mountPath: '/static-test',
                documentRoot: 'public'
            }),

            new RoboHydraHeadProxy({
                name: 'proxy',
                mountPath: '/',
                proxyTo: 'http://localhost:3000'
            })
        ]
    };
};
