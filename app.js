var express = require('express');
var fs = require("fs");
var md = require("node-markdown").Markdown;

var configuration = {
    storeDirectory: 'store'
};

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'some secret for the wikiz' }));
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
  fs.readdir(configuration.storeDirectory, function(err, files) {
    if (err) {
      res.render('error', {
        message: "Couldn't read from directory " + configuration.storeDirectory
      });
    } else {
      res.render('index', {
        pages: files
      });
    }
  });
});

function wikiPage(req, res, next) {
  // TODO: Make sure there can't be any '..' or similar in the filename
  fs.readFile(configuration.storeDirectory + '/' + req.params.pagename, function(err, text) {
    if (err) {
      res.render('error', {
        message: "Couldn't read page " + req.params.pagename
      });
    } else {
      req.pageText = text.toString();
      next();
    }
  });
}

app.get('/view/:pagename', wikiPage, function(req, res){
  res.render('view', {
               pagename: req.params.pagename,
               text: md(req.pageText)
             });
});

app.get('/edit/:pagename', wikiPage, function(req, res){
  res.render('edit', {
               pagename: req.params.pagename,
               text: req.pageText
             });
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode",
            app.address().port,
            app.settings.env);
