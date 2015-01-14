var config = module.exports;

config.Main = {
    rootPath: "../",
    environment: "node",
    sources: [
        "lib/**/*.js"
    ],
    tests: [
        "test/buster/*-test.js"
    ]
};
