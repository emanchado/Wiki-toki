var Wikistore = function(config, fs) { this.init(config, fs); };
(function()
 {
   this.init = function(config, fs) {
     this._config = config;
     this._fs     = fs;
   };
   
   this.getPage = function(pageName, cb, errorCb) {
     this._fs.readFile(this._config.storeDirectory + '/' + pageName,
                       function(err, text) {
                         if (err) {
                           errorCb(err);
                         } else {
                           cb(text);
                         }
                       });
   };
 }).call(Wikistore.prototype);
