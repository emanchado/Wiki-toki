var config = module.exports;

config["Browser tests"] = {
    env: "browser",
    rootPath: "..",
    sources: [
        "public/javascripts/es5-shim.min.js",
        "public/javascripts/markdown.js",
        "public/javascripts/wikisyntax.js"
    ],
    tests: [
        "test/*-test.js"
    ]
};
