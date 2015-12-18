/*global setTimeout */

var heads                   = require("robohydra").heads,
    RoboHydraHeadFilesystem = heads.RoboHydraHeadFilesystem,
    RoboHydraHeadProxy      = heads.RoboHydraHeadProxy;

module.exports.getBodyParts = function() {
    return {
        heads: [
            new RoboHydraHeadFilesystem({
                mountPath: '/static-test',
                documentRoot: 'public'
            }),

            new RoboHydraHeadProxy({
                mountPath: '/',
                proxyTo: 'http://localhost:3000'
            })
        ]
    };
};
