var express = require('express');
var fs = require('fs');

var configuration = require('config');

var app = module.exports = express.createServer();

function pagepath(pagename) {
  return configuration.storeDirectory + '/' +
    pagename.replace(/[^a-z0-9]+/gi, '');
}

function wikiPage(req, res, next) {
  fs.readFile(pagepath(req.params.pagename), function(err, data) {
    if (err) {
      res.render('error', {
        message: "Couldn't read page " + req.params.pagename
      });
    } else {
      req.pageText = data.toString();
      next();
    }
  });
}

function authentication(req, res, next) {
  if (req.session.authenticated === true) {
    next();
  } else {
    if (req.body && req.body.passphrase === configuration.secretPassphrase) {
      req.session.authenticated = true;
      next();
    } else {
      res.render('login');
    }
  }
}

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
app.all('/', authentication, function(req, res){
  res.redirect('/view/WikiIndex');
});

app.all('/list', authentication, function(req, res){
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

app.all('/view/:pagename', authentication, wikiPage, function(req, res){
  res.render('view', {
    pagename: req.params.pagename,
    rawText: req.pageText
  });
});

app.all('/edit/:pagename', authentication, wikiPage, function(req, res){
  res.render('edit', {
    pagename: req.params.pagename,
    rawText: req.pageText
  });
});

app.post('/save/:pagename', authentication, function(req, res){
  fs.writeFile(pagepath(req.params.pagename),
               req.body.rawText,
               function(err) {
                 if (err) {
                   res.render('error', {
                     message: "Couldn't read page " + req.params.pagename
                   });
                 } else {
                   res.redirect('/view/' + req.params.pagename);
                 }
               });
});


app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode",
            app.address().port,
            app.settings.env);
