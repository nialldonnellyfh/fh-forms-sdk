(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//Should be moved to a test fixture..

var getFormsData = require("../test/fixtures/getForms.json");
var allForms = require("../test/fixtures/getForm.json");
var theme = require("../test/fixtures/getTheme.json");
var sampleConfig = require("../test/fixtures/getConfig.json");
var submissionFile = require("../test/fixtures/submissionFile.json");
var submissionData = require("../test/fixtures/submissionData.json");
var sampleConfig = require("../test/fixtures/getConfig.json");
var responseDelay = 100;
var web = {
    GET: function(url, params, cb) {
        console.log("FAKE GET: ", url, params);

        function _ping(params, cb) {
            console.log("In _ping, ", url);
            cb(null, "OK");
        }

        function _getTheme(params, cb) {
            console.log("In _getTheme, ", url);
            cb(null, theme);
        }

        function _getConfig(params, cb) {
            console.log("In _getConfig, ");

            cb(null, JSON.stringify(sampleConfig));
        }

        function _getSubmissionData(params, cb) {
            var submissionId = params.submissionId;
            console.log("In _getSubmissionData", url);
            var retVal = {};

            if (submissionId === "submissionData") {
                retVal = submissionData;
            } else if (submissionId === "submissionFile") {
                retVal = submissionFile;
            } else { //If it is not either of these, send back an error
                retVal = {
                    error: "No submission matches id: " + submissionId
                };
            }
            cb(null, retVal);
        }

        function _getSubmissionFile(params, cb) {
            console.log("In _getSubmissionData", url);

            cb(null, "some/path/to/file");
        }

        function _getForms(params, cb) {
            console.log("In _getForms, ", url);
            cb(null, getFormsData);
        }

        function _getForm(params, cb) {
            console.log("In _getForm, ", url);
            var formId = params.formId;

            if (url.indexOf("somerandomformid") > -1) {
                cb("Cannot find specified form");
            } else {
                console.log("Form Found");
                cb(null, allForms);
            }
        }

        function _getSubmissionStatus(params, cb) {
            var submissionId = params.submissionId;
            console.log("In _getSubmissionStatus, ", submissionId);

            var responseJSON = {
                "status": "complete"
            };

            if (submissionId === "submissionStatus") {
                if (submissionStatusCounter === 0) {
                    responseJSON = {
                        "status": "pending",
                        "pendingFiles": [submissionStatusFileHash]
                    };
                    submissionStatusCounter++;
                } else {
                    responseJSON = {
                        "status": "complete"
                    };
                }
            } else if (submissionId === "failedFileUpload") {
                responseJSON = {
                    "status": "pending",
                    "pendingFiles": [failedFileUploadFileHash]
                };
            } else if (submissionId === "submissionError") {
                responseJSON = {
                    "status": "pending",
                    "pendingFiles": ["filePlaceHolder123456"]
                };
            }

            setTimeout(function() {
                cb(null, responseJSON);
            }, responseDelay);
        }

        var urlMap = {
            hostmbaasforms: _getForms,
            "hostmbaasform/54d4cd220a9b02c67e9c3f0c": _getForm,
            "hostmbaasform/somerandomformid": _getForm,
            hostmbaastheme: _getTheme,
            hostmbaassubmissionStatus: _getSubmissionStatus,
            hostmbaasconfig: _getConfig,
            hostmbaasformSubmissionDownload: _getSubmissionData,
            hostmbaasfileSubmissionDownload: _getSubmissionFile,
            hostping: _ping
        };

        setTimeout(function() {
            urlMap[url](params, cb);
        }, responseDelay);
    },
    POST: function(url, body, cb) {

        function _completeSubmission(body, cb) {
            var submissionId = body.submissionId;
            console.log("In _completeSubmission, ", submissionId);
            var resJSON = {
                "status": "complete"
            };
            if (submissionId === "submissionNotComplete") {
                resJSON = {
                    "status": "pending",
                    "pendingFiles": ["filePlaceHolder123456"]
                };
            } else if (submissionId === "submissionError") {
                resJSON = {
                    "status": "error"
                };
            } else if (submissionId === "submissionStatus") {
                submissionStatusFileHash = "";
                submissionStatusCounter = 0;
            }
            console.log("_completeSubmission", resJSON);
            setTimeout(function() {
                cb(null, resJSON);
            }, responseDelay);
        }

        function _postFormSubmission(body, cb) {
            console.log("In _postFormSubmission, ", body);

            var submissionId = "123456";

            if (body.testText === "failedFileUpload") {
                submissionId = "failedFileUpload";
            } else if (body.testText === "submissionNotComplete") {
                submissionId = "submissionNotComplete";
            } else if (body.testText === "submissionError") {
                submissionId = "submissionError";
            } else if (body.testText === "submissionStatus") {
                submissionId = "submissionStatus";
            } else {
                submissionId = Math.floor((Math.random() * 1000) + 1).toString();
            }

            var rtn = {
                "submissionId": submissionId,
                "ori": body
            };
            if (body.outOfDate) {
                rtn.updatedFormDefinition = allForms;
            }
            setTimeout(function() {
                console.log("Returning: ", body.testText);
                console.log("submissionId: ", submissionId);
                cb(null, rtn);
            }, responseDelay);
        }

        function _postFormFile(){
            cb(null, {status: 200});
        }

        var urlMap = {
            hostmbaasformSubmission: _postFormSubmission,
            hostmbaascompleteSubmission: _completeSubmission,
            hostmbaassubmitFormData: _postFormSubmission,
            hostmbaassubmitFormFile: _postFormFile,
            hostmbaassubmitFormFileBase64: _postFormFile
        };

        setTimeout(function() {
            urlMap[url](body, cb);
        }, responseDelay);
    }
};

module.exports = function(params) {

    web[params.type](params.url, params, function(err, res) {
        console.log("FAKE AJAX ", err, res);
        if (err) {
            return params.error(null, null, err);
        }
        return params.success(res);
    });
}
},{"../test/fixtures/getConfig.json":80,"../test/fixtures/getForm.json":81,"../test/fixtures/getForms.json":82,"../test/fixtures/getTheme.json":83,"../test/fixtures/submissionData.json":84,"../test/fixtures/submissionFile.json":85}],2:[function(require,module,exports){

module.exports = {
	getAppProps: function(){
		return {
			appid: "FakeAppId",
			mode: "dev"
		};
	}
}
},{}],3:[function(require,module,exports){
module.exports = {
    "appId": "appId1234",
    "mode": "dev",
    "env": "dev",
    "deviceId": "dev1234",
    "cloudHost": "host",
    "mbaasBaseUrl": "mbaas",
    "sent_save_min": 10,
    "sent_save_max": 1000,
    "targetWidth": 640,
    "targetHeight": 480,
    "quality": 50,
    "debug_mode": false,
    "logger": false,
    "max_retries": 3,
    "timeout": 30000,
    "log_line_limit": 5000,
    "log_email": "test@example.com",
    "log_level": 3,
    "log_levels": ["error", "warning", "log", "debug"],
    "config_admin_user": true,
    "picture_source": "both",
    "saveToPhotoAlbum": true,
    "encodingType": "jpeg",
    "sent_items_to_keep_list": [5, 10, 20, 30, 40, 50, 100],
    "storageStrategy": "html5-filesystem",
    "statusUrl": "ping",
    "userConfigValues": {

    },
    "formUrls": {
        "forms": "forms",
        "form": "form/:formId",
        "theme": "theme",
        "formSubmission": "submitFormData",
        "fileSubmission": "submitFormFile",
        "base64fileSubmission": "submitFormFileBase64",
        "submissionStatus": "submissionStatus",
        "formSubmissionDownload": "formSubmissionDownload",
        "fileSubmissionDownload": "fileSubmissionDownload",
        "completeSubmission": "completeSubmission",
        "config": "config"
    }

};
},{}],4:[function(require,module,exports){
module.exports = {
	getDeviceId: function(){
		return "someDeviceId"
	}
}
},{}],5:[function(require,module,exports){
/**
 * Lawnchair!
 * ---
 * clientside json store
 *
 */
var Lawnchair = function (options, callback) {
  // ensure Lawnchair was called as a constructor
  if (!(this instanceof Lawnchair)) return new Lawnchair(options, callback);

  // lawnchair requires json
  if (!JSON) throw 'JSON unavailable! Include http://www.json.org/json2.js to fix.'
  // options are optional; callback is not
  if (arguments.length <= 2 && arguments.length > 0) {
    callback = (typeof arguments[0] === 'function') ? arguments[0] : arguments[1];
    options  = (typeof arguments[0] === 'function') ? {} : arguments[0];
  } else {
    throw 'Incorrect # of ctor args!'
  }
  // TODO perhaps allow for pub/sub instead?
  if (typeof callback !== 'function') throw 'No callback was provided';

  // default configuration
  this.record = options.record || 'record'  // default for records
  this.name   = options.name   || 'records' // default name for underlying store

  // mixin first valid  adapter
  var adapter
  // if the adapter is passed in we try to load that only
  if (options.adapter) {

    // the argument passed should be an array of prefered adapters
    // if it is not, we convert it
    if(typeof(options.adapter) === 'string'){
      options.adapter = [options.adapter];
    }

    // iterates over the array of passed adapters
    for(var j = 0, k = options.adapter.length; j < k; j++){

      // itirates over the array of available adapters
      for (var i = Lawnchair.adapters.length-1; i >= 0; i--) {
        if (Lawnchair.adapters[i].adapter === options.adapter[j]) {
          adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined;
          if (adapter) break
        }
      }
      if (adapter) break
    }

    // otherwise find the first valid adapter for this env
  }
  else {
    for (var i = 0, l = Lawnchair.adapters.length; i < l; i++) {
      adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined
      if (adapter) break
    }
  }

  // we have failed
  if (!adapter) throw 'No valid adapter.'

  // yay! mixin the adapter
  for (var j in adapter)
    this[j] = adapter[j]

  // call init for each mixed in plugin
  for (var i = 0, l = Lawnchair.plugins.length; i < l; i++)
    Lawnchair.plugins[i].call(this)

  // init the adapter
  this.init(options, callback)
}

Lawnchair.adapters = []

/**
 * queues an adapter for mixin
 * ===
 * - ensures an adapter conforms to a specific interface
 *
 */
Lawnchair.adapter = function (id, obj) {
  // add the adapter id to the adapter obj
  // ugly here for a  cleaner dsl for implementing adapters
  obj['adapter'] = id
  // methods required to implement a lawnchair adapter
  var implementing = 'adapter valid init keys save batch get exists all remove nuke'.split(' ')
    ,   indexOf = this.prototype.indexOf
  // mix in the adapter
  for (var i in obj) {
    if (indexOf(implementing, i) === -1) throw 'Invalid adapter! Nonstandard method: ' + i
  }
  // if we made it this far the adapter interface is valid
  // insert the new adapter as the preferred adapter
  Lawnchair.adapters.splice(0,0,obj)
}

Lawnchair.plugins = []

/**
 * generic shallow extension for plugins
 * ===
 * - if an init method is found it registers it to be called when the lawnchair is inited
 * - yes we could use hasOwnProp but nobody here is an asshole
 */
Lawnchair.plugin = function (obj) {
  for (var i in obj)
    i === 'init' ? Lawnchair.plugins.push(obj[i]) : this.prototype[i] = obj[i]
}

/**
 * helpers
 *
 */
Lawnchair.prototype = {

  isArray: Array.isArray || function(o) { return Object.prototype.toString.call(o) === '[object Array]' },

  /**
   * this code exists for ie8... for more background see:
   * http://www.flickr.com/photos/westcoastlogic/5955365742/in/photostream
   */
  indexOf: function(ary, item, i, l) {
    if (ary.indexOf) return ary.indexOf(item)
    for (i = 0, l = ary.length; i < l; i++) if (ary[i] === item) return i
    return -1
  },

  // awesome shorthand callbacks as strings. this is shameless theft from dojo.
  lambda: function (callback) {
    return this.fn(this.record, callback)
  },

  // first stab at named parameters for terse callbacks; dojo: first != best // ;D
  fn: function (name, callback) {
    return typeof callback == 'string' ? new Function(name, callback) : callback
  },

  // returns a unique identifier (by way of Backbone.localStorage.js)
  // TODO investigate smaller UUIDs to cut on storage cost
  uuid: function () {
    var S4 = function () {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  },

  // a classic iterator
  each: function (callback) {
    var cb = this.lambda(callback)
    // iterate from chain
    if (this.__results) {
      for (var i = 0, l = this.__results.length; i < l; i++) cb.call(this, this.__results[i], i)
    }
    // otherwise iterate the entire collection
    else {
      this.all(function(r) {
        for (var i = 0, l = r.length; i < l; i++) cb.call(this, r[i], i)
      })
    }
    return this
  }
// --
};
// window.name code courtesy Remy Sharp: http://24ways.org/2009/breaking-out-the-edges-of-the-browser
Lawnchair.adapter('window-name', (function() {
  if (typeof window==='undefined') {
    window = { top: { } }; // node/optimizer compatibility
  }

  // edited from the original here by elsigh
  // Some sites store JSON data in window.top.name, but some folks (twitter on iPad)
  // put simple strings in there - we should make sure not to cause a SyntaxError.
  var data = {}
  try {
    data = JSON.parse(window.top.name)
  } catch (e) {}


  return {

    valid: function () {
      return typeof window.top.name != 'undefined'
    },

    init: function (options, callback) {
      data[this.name] = data[this.name] || {index:[],store:{}}
      this.index = data[this.name].index
      this.store = data[this.name].store
      this.fn(this.name, callback).call(this, this)
      return this
    },

    keys: function (callback) {
      this.fn('keys', callback).call(this, this.index)
      return this
    },

    save: function (obj, cb) {
      // data[key] = value + ''; // force to string
      // window.top.name = JSON.stringify(data);
      var key = obj.key || this.uuid()
      this.exists(key, function(exists) {
        if (!exists) {
          if (obj.key) delete obj.key
          this.index.push(key)
        }
        this.store[key] = obj

        try {
          window.top.name = JSON.stringify(data) // TODO wow, this is the only diff from the memory adapter
        } catch(e) {
          // restore index/store to previous value before JSON exception
          if (!exists) {
            this.index.pop();
            delete this.store[key];
          }
          throw e;
        }

        if (cb) {
          obj.key = key
          this.lambda(cb).call(this, obj)
        }
      })
      return this
    },

    batch: function (objs, cb) {
      var r = []
      for (var i = 0, l = objs.length; i < l; i++) {
        this.save(objs[i], function(record) {
          r.push(record)
        })
      }
      if (cb) this.lambda(cb).call(this, r)
      return this
    },

    get: function (keyOrArray, cb) {
      var r;
      if (this.isArray(keyOrArray)) {
        r = []
        for (var i = 0, l = keyOrArray.length; i < l; i++) {
          r.push(this.store[keyOrArray[i]])
        }
      } else {
        r = this.store[keyOrArray]
        if (r) r.key = keyOrArray
      }
      if (cb) this.lambda(cb).call(this, r)
      return this
    },

    exists: function (key, cb) {
      this.lambda(cb).call(this, !!(this.store[key]))
      return this
    },

    all: function (cb) {
      var r = []
      for (var i = 0, l = this.index.length; i < l; i++) {
        var obj = this.store[this.index[i]]
        obj.key = this.index[i]
        r.push(obj)
      }
      this.fn(this.name, cb).call(this, r)
      return this
    },

    remove: function (keyOrArray, cb) {
      var del = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray]
      for (var i = 0, l = del.length; i < l; i++) {
        var key = del[i].key ? del[i].key : del[i]
        var where = this.indexOf(this.index, key)
        if (where < 0) continue /* key not present */
        delete this.store[key]
        this.index.splice(where, 1)
      }
      window.top.name = JSON.stringify(data)
      if (cb) this.lambda(cb).call(this)
      return this
    },

    nuke: function (cb) {
      this.store = data[this.name].store = {}
      this.index = data[this.name].index = []
      window.top.name = JSON.stringify(data)
      if (cb) this.lambda(cb).call(this)
      return this
    }
  }
/////
})())
/**
 * dom storage adapter
 * ===
 * - originally authored by Joseph Pecoraro
 *
 */
//
// TODO does it make sense to be chainable all over the place?
// chainable: nuke, remove, all, get, save, all    
// not chainable: valid, keys
//
Lawnchair.adapter('dom', (function() {
  var storage = null;
  try{
    storage = window.localStorage;
  }catch(e){

  }
  // the indexer is an encapsulation of the helpers needed to keep an ordered index of the keys
  var indexer = function(name) {
    return {
      // the key
      key: name + '._index_',
      // returns the index
      all: function() {
        var a  = storage.getItem(this.key)
        if (a) {
          a = JSON.parse(a)
        }
        if (a === null) storage.setItem(this.key, JSON.stringify([])) // lazy init
        return JSON.parse(storage.getItem(this.key))
      },
      // adds a key to the index
      add: function (key) {
        var a = this.all()
        a.push(key)
        storage.setItem(this.key, JSON.stringify(a))
      },
      // deletes a key from the index
      del: function (key) {
        var a = this.all(), r = []
        // FIXME this is crazy inefficient but I'm in a strata meeting and half concentrating
        for (var i = 0, l = a.length; i < l; i++) {
          if (a[i] != key) r.push(a[i])
        }
        storage.setItem(this.key, JSON.stringify(r))
      },
      // returns index for a key
      find: function (key) {
        var a = this.all()
        for (var i = 0, l = a.length; i < l; i++) {
          if (key === a[i]) return i
        }
        return false
      }
    }
  }

  // adapter api
  return {

    // ensure we are in an env with localStorage
    valid: function () {
      return !!storage && function() {
        // in mobile safari if safe browsing is enabled, window.storage
        // is defined but setItem calls throw exceptions.
        var success = true
        var value = Math.random()
        try {
          storage.setItem(value, value)
        } catch (e) {
          success = false
        }
        storage.removeItem(value)
        return success
      }()
    },

    init: function (options, callback) {
      this.indexer = indexer(this.name)
      if (callback) this.fn(this.name, callback).call(this, this)
    },

    save: function (obj, callback) {
      var key = obj.key ? this.name + '.' + obj.key : this.name + '.' + this.uuid()
      // now we kil the key and use it in the store colleciton
      delete obj.key;
      storage.setItem(key, JSON.stringify(obj))
      // if the key is not in the index push it on
      if (this.indexer.find(key) === false) this.indexer.add(key)
      obj.key = key.slice(this.name.length + 1)
      if (callback) {
        this.lambda(callback).call(this, obj)
      }
      return this
    },

    batch: function (ary, callback) {
      var saved = []
      // not particularily efficient but this is more for sqlite situations
      for (var i = 0, l = ary.length; i < l; i++) {
        this.save(ary[i], function(r){
          saved.push(r)
        })
      }
      if (callback) this.lambda(callback).call(this, saved)
      return this
    },

    // accepts [options], callback
    keys: function(callback) {
      if (callback) {
        var name = this.name
        var indices = this.indexer.all();
        var keys = [];
        //Checking for the support of map.
        if(Array.prototype.map) {
          keys = indices.map(function(r){ return r.replace(name + '.', '') })
        } else {
          for (var key in indices) {
            keys.push(key.replace(name + '.', ''));
          }
        }
        this.fn('keys', callback).call(this, keys)
      }
      return this // TODO options for limit/offset, return promise
    },

    get: function (key, callback) {
      if (this.isArray(key)) {
        var r = []
        for (var i = 0, l = key.length; i < l; i++) {
          var k = this.name + '.' + key[i]
          var obj = storage.getItem(k)
          if (obj) {
            obj = JSON.parse(obj)
            obj.key = key[i]
          }
          r.push(obj)
        }
        if (callback) this.lambda(callback).call(this, r)
      } else {
        var k = this.name + '.' + key
        var  obj = storage.getItem(k)
        if (obj) {
          obj = JSON.parse(obj)
          obj.key = key
        }
        if (callback) this.lambda(callback).call(this, obj)
      }
      return this
    },

    exists: function (key, cb) {
      var exists = this.indexer.find(this.name+'.'+key) === false ? false : true ;
      this.lambda(cb).call(this, exists);
      return this;
    },
    // NOTE adapters cannot set this.__results but plugins do
    // this probably should be reviewed
    all: function (callback) {
      var idx = this.indexer.all()
        ,   r   = []
        ,   o
        ,   k
      for (var i = 0, l = idx.length; i < l; i++) {
        k     = idx[i] //v
        o     = JSON.parse(storage.getItem(k))
        o.key = k.replace(this.name + '.', '')
        r.push(o)
      }
      if (callback) this.fn(this.name, callback).call(this, r)
      return this
    },

    remove: function (keyOrArray, callback) {
      var self = this;
      if (this.isArray(keyOrArray)) {
        // batch remove
        var i, done = keyOrArray.length;
        var removeOne = function(i) {
          self.remove(keyOrArray[i], function() {
            if ((--done) > 0) { return; }
            if (callback) {
              self.lambda(callback).call(self);
            }
          });
        };
        for (i=0; i < keyOrArray.length; i++)
          removeOne(i);
        return this;
      }
      var key = this.name + '.' +
        ((keyOrArray.key) ? keyOrArray.key : keyOrArray)
      this.indexer.del(key)
      storage.removeItem(key)
      if (callback) this.lambda(callback).call(this)
      return this
    },

    nuke: function (callback) {
      this.all(function(r) {
        for (var i = 0, l = r.length; i < l; i++) {
          this.remove(r[i]);
        }
        if (callback) this.lambda(callback).call(this)
      })
      return this
    }
  }})());
Lawnchair.adapter('webkit-sqlite', (function() {
  // private methods
  var fail = function(e, i) {
    if (console) {
      console.log('error in sqlite adaptor!', e, i)
    }
  }, now = function() {
      return new Date()
    } // FIXME need to use better date fn
    // not entirely sure if this is needed...

  // public methods
  return {

    valid: function() {
      return !!(window.openDatabase)
    },

    init: function(options, callback) {
      var that = this,
        cb = that.fn(that.name, callback),
        create = "CREATE TABLE IF NOT EXISTS " + this.record + " (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)",
        win = function() {
          return cb.call(that, that);
        }
        // open a connection and create the db if it doesn't exist
        //FEEDHENRY CHANGE TO ALLOW ERROR CALLBACK
      if (options && 'function' === typeof options.fail) fail = options.fail
        //END CHANGE
      this.db = openDatabase(this.name, '1.0.0', this.name, 65536)
      this.db.transaction(function(t) {
        t.executeSql(create, [], win, fail)
      })
    },

    keys: function(callback) {
      var cb = this.lambda(callback),
        that = this,
        keys = "SELECT id FROM " + this.record + " ORDER BY timestamp DESC"

      this.db.readTransaction(function(t) {
        var win = function(xxx, results) {
          if (results.rows.length == 0) {
            cb.call(that, [])
          } else {
            var r = [];
            for (var i = 0, l = results.rows.length; i < l; i++) {
              r.push(results.rows.item(i).id);
            }
            cb.call(that, r)
          }
        }
        t.executeSql(keys, [], win, fail)
      })
      return this
    },
    // you think thats air you're breathing now?
    save: function(obj, callback, error) {
      var that = this
      objs = (this.isArray(obj) ? obj : [obj]).map(function(o) {
        if (!o.key) {
          o.key = that.uuid()
        }
        return o
      }),
        ins = "INSERT OR REPLACE INTO " + this.record + " (value, timestamp, id) VALUES (?,?,?)",
        win = function() {
          if (callback) {
            that.lambda(callback).call(that, that.isArray(obj) ? objs : objs[0])
          }
        }, error = error || function() {}, insvals = [],
        ts = now()

        try {
          for (var i = 0, l = objs.length; i < l; i++) {
            insvals[i] = [JSON.stringify(objs[i]), ts, objs[i].key];
          }
        } catch (e) {
          fail(e)
          throw e;
        }

      that.db.transaction(function(t) {
        for (var i = 0, l = objs.length; i < l; i++)
          t.executeSql(ins, insvals[i])
      }, function(e, i) {
        fail(e, i)
      }, win)

      return this
    },


    batch: function(objs, callback) {
      return this.save(objs, callback)
    },

    get: function(keyOrArray, cb) {
      var that = this,
        sql = '',
        args = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray];
      // batch selects support
      sql = 'SELECT id, value FROM ' + this.record + " WHERE id IN (" +
        args.map(function() {
        return '?'
      }).join(",") + ")"
      // FIXME
      // will always loop the results but cleans it up if not a batch return at the end..
      // in other words, this could be faster
      var win = function(xxx, results) {
        var o, r, lookup = {}
          // map from results to keys
        for (var i = 0, l = results.rows.length; i < l; i++) {
          o = JSON.parse(results.rows.item(i).value)
          o.key = results.rows.item(i).id
          lookup[o.key] = o;
        }
        r = args.map(function(key) {
          return lookup[key];
        });
        if (!that.isArray(keyOrArray)) r = r.length ? r[0] : null
        if (cb) that.lambda(cb).call(that, r)
      }
      this.db.readTransaction(function(t) {
        t.executeSql(sql, args, win, fail)
      })
      return this
    },

    exists: function(key, cb) {
      var is = "SELECT * FROM " + this.record + " WHERE id = ?",
        that = this,
        win = function(xxx, results) {
          if (cb) that.fn('exists', cb).call(that, (results.rows.length > 0))
        }
      this.db.readTransaction(function(t) {
        t.executeSql(is, [key], win, fail)
      })
      return this
    },

    all: function(callback) {
      var that = this,
        all = "SELECT * FROM " + this.record,
        r = [],
        cb = this.fn(this.name, callback) || undefined,
        win = function(xxx, results) {
          if (results.rows.length != 0) {
            for (var i = 0, l = results.rows.length; i < l; i++) {
              var obj = JSON.parse(results.rows.item(i).value)
              obj.key = results.rows.item(i).id
              r.push(obj)
            }
          }
          if (cb) cb.call(that, r)
        }

      this.db.readTransaction(function(t) {
        t.executeSql(all, [], win, fail)
      })
      return this
    },

    remove: function(keyOrArray, cb) {
      var that = this,
        args, sql = "DELETE FROM " + this.record + " WHERE id ",
        win = function() {
          if (cb) that.lambda(cb).call(that)
        }
      if (!this.isArray(keyOrArray)) {
        sql += '= ?';
        args = [keyOrArray];
      } else {
        args = keyOrArray;
        sql += "IN (" +
          args.map(function() {
          return '?'
        }).join(',') +
          ")";
      }
      args = args.map(function(obj) {
        return obj.key ? obj.key : obj;
      });

      this.db.transaction(function(t) {
        t.executeSql(sql, args, win, fail);
      });

      return this;
    },

    nuke: function(cb) {
      var nuke = "DELETE FROM " + this.record,
        that = this,
        win = cb ? function() {
        that.lambda(cb).call(that)
      } : function() {}
      this.db.transaction(function(t) {
        t.executeSql(nuke, [], win, fail)
      })
      return this
    }
  }
})());
Lawnchair.adapter('html5-filesystem', (function(global){

  var FileError = global.FileError;

  var fail = function( e ) {
    var msg;
    var show = true;
    switch (e.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        show = false;
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error';
        break;
    };
    if ( console && show ) console.error( e, msg );
  };

  var ls = function( reader, callback, entries ) {
    var result = entries || [];
    reader.readEntries(function( results ) {
      if ( !results.length ) {
        if ( callback ) callback( result.map(function(entry) { return entry.name; }) );
      } else {
        ls( reader, callback, result.concat( Array.prototype.slice.call( results ) ) );
      }
    }, fail );
  };

  var filesystems = {};

  var root = function( store, callback ) {
    var directory = filesystems[store.name];
    if ( directory ) {
      callback( directory );
    } else {
      setTimeout(function() {
        root( store, callback );
      }, 10 );
    }
  };

  var isPhoneGap = function() {
    //http://stackoverflow.com/questions/10347539/detect-between-a-mobile-browser-or-a-phonegap-application
    //may break.
    var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    if (app) {
      return true;
    } else {
      return false;
    }
  }

  var createBlobOrString = function(contentstr) {
    var retVal;
    if (isPhoneGap()) {  // phonegap filewriter works with strings, later versions also work with binary arrays, and if passed a blob will just convert to binary array anyway
      retVal = contentstr;
    } else {
      var targetContentType = 'application/json';
      try {
        retVal = new Blob( [contentstr], { type: targetContentType });  // Blob doesn't exist on all androids
      }
      catch (e){
        // TypeError old chrome and FF
        var blobBuilder = window.BlobBuilder ||
          window.WebKitBlobBuilder ||
          window.MozBlobBuilder ||
          window.MSBlobBuilder;
        if (e.name == 'TypeError' && blobBuilder) {
          var bb = new blobBuilder();
          bb.append([contentstr.buffer]);
          retVal = bb.getBlob(targetContentType);
        } else {
          // We can't make a Blob, so just return the stringified content
          retVal = contentstr;
        }
      }
    }
    return retVal;
  }

  return {
    // boolean; true if the adapter is valid for the current environment
    valid: function() {
      var fs = global.requestFileSystem || global.webkitRequestFileSystem || global.moz_requestFileSystem;
      return !!fs;
    },

    // constructor call and callback. 'name' is the most common option
    init: function( options, callback ) {
      var me = this;
      var error = function(e) { fail(e); if ( callback ) me.fn( me.name, callback ).call( me, me ); };
      var size = options.size || 100*1024*1024;
      var name = this.name;
      //disable file backup to icloud
      me.backup = false;
      if(typeof options.backup !== 'undefined'){
        me.backup = options.backup;
      }

      function requestFileSystem(amount) {
//        console.log('in requestFileSystem');
        var fs = global.requestFileSystem || global.webkitRequestFileSystem || global.moz_requestFileSystem;
        var mode = window.PERSISTENT;
        if(typeof LocalFileSystem !== "undefined" && typeof LocalFileSystem.PERSISTENT !== "undefined"){
          mode = LocalFileSystem.PERSISTENT;
        }      
        fs(mode, amount, function(fs) {
//          console.log('got FS ', fs);
          fs.root.getDirectory( name, {create:true}, function( directory ) {
//            console.log('got DIR ', directory);
            filesystems[name] = directory;
            if ( callback ) me.fn( me.name, callback ).call( me, me );
          }, function( e ) {
//            console.log('error getting dir :: ', e);
            error(e);
          });
        }, function( e ) {
//          console.log('error getting FS :: ', e);
          error(e);
        });
      };

      // When in the browser we need to use the html5 file system rather than
      // the one cordova supplies, but it needs to request a quota first.
      if (typeof navigator.webkitPersistentStorage !== 'undefined') {
        navigator.webkitPersistentStorage.requestQuota(size, requestFileSystem, function() {
          logger.warn('User declined file storage');
          error('User declined file storage');
        });
      } else {
        // Amount is 0 because we pretty much have free reign over the
        // amount of storage we use on an android device.
        requestFileSystem(0);
      }
    },

    // returns all the keys in the store
    keys: function( callback ) {
      var me = this;
      root( this, function( store ) {
        ls( store.createReader(), function( entries ) {
          if ( callback ) me.fn( 'keys', callback ).call( me, entries );
        });
      });
      return this;
    },

    // save an object
    save: function( obj, callback ) {
      var me = this;
      var key = obj.key || this.uuid();
      obj.key = key;
      var error = function(e) { fail(e); if ( callback ) me.lambda( callback ).call( me ); };
      root( this, function( store ) {
        var writeContent = function(file, error){
          file.createWriter(function( writer ) {
            writer.onerror = error;
            writer.onwriteend = function() {
              // Clear the onWriteEnd handler so the truncate does not call it and cause an infinite loop
              this.onwriteend = null;
              // Truncate the file at the end of the written contents. This ensures that if we are updating 
              // a file which was previously longer, we will not be left with old contents beyond the end of 
              // the current buffer.
              this.truncate(this.position);
              if ( callback ) me.lambda( callback ).call( me, obj );
            };
            var contentStr = JSON.stringify(obj);

            var writerContent = createBlobOrString(contentStr);
            writer.write(writerContent);
          }, error );
        }
        store.getFile( key, {create:true}, function( file ) {
          if(typeof file.setMetadata === 'function' && (me.backup === false || me.backup === 'false')){
            //set meta data on the file to make sure it won't be backed up by icloud
            file.setMetadata(function(){
              writeContent(file, error);
            }, function(){
              writeContent(file, error);
            }, {'com.apple.MobileBackup': 1});
          } else {
            writeContent(file, error);
          }
        }, error );
      });
      return this;
    },

    // batch save array of objs
    batch: function( objs, callback ) {
      var me = this;
      var saved = [];
      for ( var i = 0, il = objs.length; i < il; i++ ) {
        me.save( objs[i], function( obj ) {
          saved.push( obj );
          if ( saved.length === il && callback ) {
            me.lambda( callback ).call( me, saved );
          }
        });
      }
      return this;
    },

    // retrieve obj (or array of objs) and apply callback to each
    get: function( key /* or array */, callback ) {
      var me = this;
      if ( this.isArray( key ) ) {
        var values = [];
        for ( var i = 0, il = key.length; i < il; i++ ) {
          me.get( key[i], function( result ) {
            if ( result ) values.push( result );
            if ( values.length === il && callback ) {
              me.lambda( callback ).call( me, values );
            }
          });
        }
      } else {
        var error = function(e) {
          fail( e );
          if ( callback ) {
            me.lambda( callback ).call( me );
          }
        };
        root( this, function( store ) {
          store.getFile( key, {create:false}, function( entry ) {
            entry.file(function( file ) {
              var reader = new FileReader();

              reader.onerror = error;

              reader.onload = function(e) {
                var res = {};
                try {
                  res = JSON.parse( e.target.result);
                  res.key = key;
                } catch (e) {
                  res = {key:key};
                }
                if ( callback ) me.lambda( callback ).call( me, res );
              };

              reader.readAsText( file );
            }, error );
          }, error );
        });
      }
      return this;
    },

    // check if an obj exists in the collection
    exists: function( key, callback ) {
      var me = this;
      root( this, function( store ) {
        store.getFile( key, {create:false}, function() {
          if ( callback ) me.lambda( callback ).call( me, true );
        }, function() {
          if ( callback ) me.lambda( callback ).call( me, false );
        });
      });
      return this;
    },

    // returns all the objs to the callback as an array
    all: function( callback ) {
      var me = this;
      if ( callback ) {
        this.keys(function( keys ) {
          if ( !keys.length ) {
            me.fn( me.name, callback ).call( me, [] );
          } else {
            me.get( keys, function( values ) {
              me.fn( me.name, callback ).call( me, values );
            });
          }
        });
      }
      return this;
    },

    // remove a doc or collection of em
    remove: function( key /* or object */, callback ) {
      var me = this;
      var error = function(e) { fail( e ); if ( callback ) me.lambda( callback ).call( me ); };
      root( this, function( store ) {
        store.getFile( (typeof key === 'string' ? key : key.key ), {create:false}, function( file ) {
          file.remove(function() {
            if ( callback ) me.lambda( callback ).call( me );
          }, error );
        }, error );
      });
      return this;
    },

    // destroy everything
    nuke: function( callback ) {
      var me = this;
      var count = 0;
      this.keys(function( keys ) {
        if ( !keys.length ) {
          if ( callback ) me.lambda( callback ).call( me );
        } else {
          for ( var i = 0, il = keys.length; i < il; i++ ) {
            me.remove( keys[i], function() {
              count++;
              if ( count === il && callback ) {
                me.lambda( callback ).call( me );
              }
            });
          }
        }
      });
      return this;
    }
  };
}(this)));
Lawnchair.adapter('memory', (function(){

    var data = {}

    return {
        valid: function() { return true },

        init: function (options, callback) {
            data[this.name] = data[this.name] || {index:[],store:{}}
            this.index = data[this.name].index
            this.store = data[this.name].store
            var cb = this.fn(this.name, callback)
            if (cb) cb.call(this, this)
            return this
        },

        keys: function (callback) {
            this.fn('keys', callback).call(this, this.index)
            return this
        },

        save: function(obj, cb) {
            var key = obj.key || this.uuid()
            
            this.exists(key, function(exists) {
                if (!exists) {
                    if (obj.key) delete obj.key
                    this.index.push(key)
                }

                this.store[key] = obj
                
                if (cb) {
                    obj.key = key
                    this.lambda(cb).call(this, obj)
                }
            })

            return this
        },

        batch: function (objs, cb) {
            var r = []
            for (var i = 0, l = objs.length; i < l; i++) {
                this.save(objs[i], function(record) {
                    r.push(record)
                })
            }
            if (cb) this.lambda(cb).call(this, r)
            return this
        },

        get: function (keyOrArray, cb) {
            var r;
            if (this.isArray(keyOrArray)) {
                r = []
                for (var i = 0, l = keyOrArray.length; i < l; i++) {
                    r.push(this.store[keyOrArray[i]])
                }
            } else {
                r = this.store[keyOrArray]
                if (r) r.key = keyOrArray
            }
            if (cb) this.lambda(cb).call(this, r)
            return this 
        },

        exists: function (key, cb) {
            this.lambda(cb).call(this, !!(this.store[key]))
            return this
        },

        all: function (cb) {
            var r = []
            for (var i = 0, l = this.index.length; i < l; i++) {
                var obj = this.store[this.index[i]]
                obj.key = this.index[i]
                r.push(obj)
            }
            this.fn(this.name, cb).call(this, r)
            return this
        },

        remove: function (keyOrArray, cb) {
            var del = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray]
            for (var i = 0, l = del.length; i < l; i++) {
                var key = del[i].key ? del[i].key : del[i]
                var where = this.indexOf(this.index, key)
                if (where < 0) continue /* key not present */
                delete this.store[key]
                this.index.splice(where, 1)
            }
            if (cb) this.lambda(cb).call(this)
            return this
        },

        nuke: function (cb) {
            this.store = data[this.name].store = {}
            this.index = data[this.name].index = []
            if (cb) this.lambda(cb).call(this)
            return this
        }
    }
/////
})());
},{}],6:[function(require,module,exports){

module.exports = {
	getCloudHostUrl: function(){
		return "somehost.com";
	}
}
},{}],7:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":46}],8:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  if (length > 0 && length <= Buffer.poolSize)
    buf.parent = rootParent

  return buf
}

function SlowBuffer(subject, encoding, noZero) {
  if (!(this instanceof SlowBuffer))
    return new SlowBuffer(subject, encoding, noZero)

  var buf = new Buffer(subject, encoding, noZero)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length, 2)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0

  if (length < 0 || offset < 0 || offset > this.length)
    throw new RangeError('attempt to write outside buffer bounds');

  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length)
    newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100))
    val += this[offset + i] * mul

  return val
}

Buffer.prototype.readUIntBE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100))
    val += this[offset + --byteLength] * mul;

  return val
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readIntLE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100))
    val += this[offset + i] * mul
  mul *= 0x80

  if (val >= mul)
    val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100))
    val += this[offset + --i] * mul
  mul *= 0x80

  if (val >= mul)
    val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100))
    this[offset + i] = (value / mul) >>> 0 & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100))
    this[offset + i] = (value / mul) >>> 0 & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeIntLE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(this,
             value,
             offset,
             byteLength,
             Math.pow(2, 8 * byteLength - 1) - 1,
             -Math.pow(2, 8 * byteLength - 1))
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100))
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(this,
             value,
             offset,
             byteLength,
             Math.pow(2, 8 * byteLength - 1) - 1,
             -Math.pow(2, 8 * byteLength - 1))
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100))
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (target_start >= target.length) target_start = target.length
  if (!target_start) target_start = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || source.length === 0) return 0

  // Fatal error conditions
  if (target_start < 0)
    throw new RangeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes(string, units) {
  var codePoint, length = string.length
  var leadSurrogate = null
  units = units || Infinity
  var bytes = []
  var i = 0

  for (; i<length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {

      // last char was a lead
      if (leadSurrogate) {

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        }

        // valid surrogate pair
        else {
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      }

      // no lead yet
      else {

        // unexpected trail
        if (codePoint > 0xDBFF) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // unpaired lead
        else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        else {
          leadSurrogate = codePoint
          continue
        }
      }
    }

    // valid bmp char, but last char was a lead
    else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    }
    else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    }
    else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    }
    else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    }
    else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {

    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize;
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":9,"ieee754":10,"is-array":11}],9:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],10:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],11:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],12:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":13}],13:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = []
  , exports = module.exports = {};

/*!
 * Chai version
 */

exports.version = '1.10.0';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(this, util);
    used.push(fn);
  }

  return this;
};

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":14,"./chai/config":15,"./chai/core/assertions":16,"./chai/interface/assert":17,"./chai/interface/expect":18,"./chai/interface/should":19,"./chai/utils":30,"assertion-error":39}],14:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');
var NOOP = function() { };

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * @api private
   */

  function Assertion (obj, msg, stack) {
    flag(this, 'ssfi', stack || arguments.callee);
    flag(this, 'object', obj);
    flag(this, 'message', msg);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.addChainableNoop = function(name, fn) {
    util.addChainableMethod(this.prototype, name, NOOP, fn);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /*!
   * ### .assert(expression, message, negateMessage, expected, actual)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String or Function} message or function that returns message to display if fails
   * @param {String or Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (true !== showDiff) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      var msg = util.getMessage(this, arguments)
        , actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":15}],15:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

   includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded,
   * the value is truncated.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40

};

},{}],16:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , toString = Object.prototype.toString
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to
   * improve the readability of your assertions. They
   * do not provide testing capabilities unless they
   * have been overwritten by a plugin.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   *
   * @name language chains
   * @api public
   */

  [ 'to', 'be', 'been'
  , 'is', 'and', 'has', 'have'
  , 'with', 'that', 'at'
  , 'of', 'same' ].forEach(function (chain) {
    Assertion.addProperty(chain, function () {
      return this;
    });
  });

  /**
   * ### .not
   *
   * Negates any of assertions following in the chain.
   *
   *     expect(foo).to.not.equal('bar');
   *     expect(goodFn).to.not.throw(Error);
   *     expect({ foo: 'baz' }).to.have.property('foo')
   *       .and.not.equal('bar');
   *
   * @name not
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Sets the `deep` flag, later used by the `equal` and
   * `property` assertions.
   *
   *     expect(foo).to.deep.equal({ bar: 'baz' });
   *     expect({ foo: { bar: { baz: 'quux' } } })
   *       .to.have.deep.property('foo.bar.baz', 'quux');
   *
   * @name deep
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .a(type)
   *
   * The `a` and `an` assertions are aliases that can be
   * used either as language chains or to assert a value's
   * type.
   *
   *     // typeof
   *     expect('test').to.be.a('string');
   *     expect({ foo: 'bar' }).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *
   *     // language chain
   *     expect(foo).to.be.an.instanceof(Foo);
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} message _optional_
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj)
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(value)
   *
   * The `include` and `contain` assertions can be used as either property
   * based language chains or as methods to assert the inclusion of an object
   * in an array or a substring in a string. When used as language chains,
   * they toggle the `contain` flag for the `keys` assertion.
   *
   *     expect([1,2,3]).to.include(2);
   *     expect('foobar').to.contain('foo');
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');
   *
   * @name include
   * @alias contain
   * @param {Object|String|Number} obj
   * @param {String} message _optional_
   * @api public
   */

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var expected = false;
    if (_.type(obj) === 'array' && _.type(val) === 'object') {
      for (var i in obj) {
        if (_.eql(obj[i], val)) {
          expected = true;
          break;
        }
      }
    } else if (_.type(val) === 'object') {
      if (!flag(this, 'negate')) {
        for (var k in val) new Assertion(obj).property(k, val[k]);
        return;
      }
      var subset = {}
      for (var k in val) subset[k] = obj[k]
      expected = _.eql(subset, val);
    } else {
      expected = obj && ~obj.indexOf(val)
    }
    this.assert(
        expected
      , 'expected #{this} to include ' + _.inspect(val)
      , 'expected #{this} to not include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is truthy.
   *
   *     expect('everthing').to.be.ok;
   *     expect(1).to.be.ok;
   *     expect(false).to.not.be.ok;
   *     expect(undefined).to.not.be.ok;
   *     expect(null).to.not.be.ok;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect('everthing').to.be.ok();
   *     
   * @name ok
   * @api public
   */

  Assertion.addChainableNoop('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is `true`.
   *
   *     expect(true).to.be.true;
   *     expect(1).to.not.be.true;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(true).to.be.true();
   *
   * @name true
   * @api public
   */

  Assertion.addChainableNoop('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , this.negate ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is `false`.
   *
   *     expect(false).to.be.false;
   *     expect(0).to.not.be.false;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(false).to.be.false();
   *
   * @name false
   * @api public
   */

  Assertion.addChainableNoop('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , this.negate ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is `null`.
   *
   *     expect(null).to.be.null;
   *     expect(undefined).not.to.be.null;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(null).to.be.null();
   *
   * @name null
   * @api public
   */

  Assertion.addChainableNoop('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *     expect(null).to.not.be.undefined;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(undefined).to.be.undefined();
   *
   * @name undefined
   * @api public
   */

  Assertion.addChainableNoop('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi'
   *       , bar = null
   *       , baz;
   *
   *     expect(foo).to.exist;
   *     expect(bar).to.not.exist;
   *     expect(baz).to.not.exist;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(foo).to.exist();
   *
   * @name exist
   * @api public
   */

  Assertion.addChainableNoop('exist', function () {
    this.assert(
        null != flag(this, 'object')
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });


  /**
   * ### .empty
   *
   * Asserts that the target's length is `0`. For arrays, it checks
   * the `length` property. For objects, it gets the count of
   * enumerable keys.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *     expect({}).to.be.empty;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect([]).to.be.empty();
   *
   * @name empty
   * @api public
   */

  Assertion.addChainableNoop('empty', function () {
    var obj = flag(this, 'object')
      , expected = obj;

    if (Array.isArray(obj) || 'string' === typeof object) {
      expected = obj.length;
    } else if (typeof obj === 'object') {
      expected = Object.keys(obj).length;
    }

    this.assert(
        !expected
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an arguments object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments();
   *     }
   *
   * @name arguments
   * @alias Arguments
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = Object.prototype.toString.call(obj);
    this.assert(
        '[object Arguments]' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addChainableNoop('arguments', checkArguments);
  Assertion.addChainableNoop('Arguments', checkArguments);

  /**
   * ### .equal(value)
   *
   * Asserts that the target is strictly equal (`===`) to `value`.
   * Alternately, if the `deep` flag is set, asserts that
   * the target is deeply equal to `value`.
   *
   *     expect('hello').to.equal('hello');
   *     expect(42).to.equal(42);
   *     expect(1).to.not.equal(true);
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @alias deep.equal
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(value)
   *
   * Asserts that the target is deeply equal to `value`.
   *
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(value)
   *
   * Asserts that the target is greater than `value`.
   *
   *     expect(10).to.be.above(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above ' + n
        , 'expected #{this} to be at most ' + n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(value)
   *
   * Asserts that the target is greater than or equal to `value`.
   *
   *     expect(10).to.be.at.least(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.least(2);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.least(3);
   *
   * @name least
   * @alias gte
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= n
        , 'expected #{this} to have a length at least #{exp} but got #{act}'
        , 'expected #{this} to have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least ' + n
        , 'expected #{this} to be below ' + n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(value)
   *
   * Asserts that the target is less than `value`.
   *
   *     expect(5).to.be.below(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below ' + n
        , 'expected #{this} to be at least ' + n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(value)
   *
   * Asserts that the target is less than or equal to `value`.
   *
   *     expect(5).to.be.at.most(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.most(4);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.most(3);
   *
   * @name most
   * @alias lte
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len <= n
        , 'expected #{this} to have a length at most #{exp} but got #{act}'
        , 'expected #{this} to have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most ' + n
        , 'expected #{this} to be above ' + n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish)
   *
   * Asserts that the target is within a range.
   *
   *     expect(7).to.be.within(5,10);
   *
   * Can also be used in conjunction with `length` to
   * assert a length range. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name within
   * @param {Number} start lowerbound inclusive
   * @param {Number} finish upperbound inclusive
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , range = start + '..' + finish;
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor)
   *
   * Asserts that the target is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , Chai = new Tea('chai');
   *
   *     expect(Chai).to.be.an.instanceof(Tea);
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} message _optional_
   * @alias instanceOf
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);
    var name = _.getName(constructor);
    this.assert(
        flag(this, 'object') instanceof constructor
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name, [value])
   *
   * Asserts that the target has a property `name`, optionally asserting that
   * the value of that property is strictly equal to  `value`.
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep
   * references into objects and arrays.
   *
   *     // simple referencing
   *     var obj = { foo: 'bar' };
   *     expect(obj).to.have.property('foo');
   *     expect(obj).to.have.property('foo', 'bar');
   *
   *     // deep referencing
   *     var deepObj = {
   *         green: { tea: 'matcha' }
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
   *     };

   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');
   *
   * You can also use an array as the starting point of a `deep.property`
   * assertion, or traverse nested arrays.
   *
   *     var arr = [
   *         [ 'chai', 'matcha', 'konacha' ]
   *       , [ { tea: 'chai' }
   *         , { tea: 'matcha' }
   *         , { tea: 'konacha' } ]
   *     ];
   *
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
   *
   * Furthermore, `property` changes the subject of the assertion
   * to be the value of that property from the original object. This
   * permits for further chainable assertions on that property.
   *
   *     expect(obj).to.have.property('foo')
   *       .that.is.a('string');
   *     expect(deepObj).to.have.property('green')
   *       .that.is.an('object')
   *       .that.deep.equals({ tea: 'matcha' });
   *     expect(deepObj).to.have.property('teas')
   *       .that.is.an('array')
   *       .with.deep.property('[2]')
   *         .that.deep.equals({ tea: 'konacha' });
   *
   * @name property
   * @alias deep.property
   * @param {String} name
   * @param {Mixed} value (optional)
   * @param {String} message _optional_
   * @returns value of property for chaining
   * @api public
   */

  Assertion.addMethod('property', function (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var descriptor = flag(this, 'deep') ? 'deep property ' : 'property '
      , negate = flag(this, 'negate')
      , obj = flag(this, 'object')
      , value = flag(this, 'deep')
        ? _.getPathValue(name, obj)
        : obj[name];

    if (negate && undefined !== val) {
      if (undefined === value) {
        msg = (msg != null) ? msg + ': ' : '';
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));
      }
    } else {
      this.assert(
          undefined !== value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (undefined !== val) {
      this.assert(
          val === value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  });


  /**
   * ### .ownProperty(name)
   *
   * Asserts that the target has an own property `name`.
   *
   *     expect('test').to.have.ownProperty('length');
   *
   * @name ownProperty
   * @alias haveOwnProperty
   * @param {String} name
   * @param {String} message _optional_
   * @api public
   */

  function assertOwnProperty (name, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        obj.hasOwnProperty(name)
      , 'expected #{this} to have own property ' + _.inspect(name)
      , 'expected #{this} to not have own property ' + _.inspect(name)
    );
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .length(value)
   *
   * Asserts that the target's `length` property has
   * the expected value.
   *
   *     expect([ 1, 2, 3]).to.have.length(3);
   *     expect('foobar').to.have.length(6);
   *
   * Can also be used as a chain precursor to a value
   * comparison for the length property.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name length
   * @alias lengthOf
   * @param {Number} length
   * @param {String} message _optional_
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).to.have.property('length');
    var len = obj.length;

    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addMethod('lengthOf', assertLength);

  /**
   * ### .match(regexp)
   *
   * Asserts that the target matches a regular expression.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * @name match
   * @param {RegExp} RegularExpression
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('match', function (re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  });

  /**
   * ### .string(string)
   *
   * Asserts that the string target contains another string.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * @name string
   * @param {String} string
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });


  /**
   * ### .keys(key1, [key2], [...])
   *
   * Asserts that the target has exactly the given keys, or
   * asserts the inclusion of some keys when using the
   * `include` or `contain` modifiers.
   *
   *     expect({ foo: 1, bar: 2 }).to.have.keys(['foo', 'bar']);
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('foo', 'bar');
   *
   * @name keys
   * @alias key
   * @param {String...|Array} keys
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , str
      , ok = true;

    keys = keys instanceof Array
      ? keys
      : Array.prototype.slice.call(arguments);

    if (!keys.length) throw new Error('keys required');

    var actual = Object.keys(obj)
      , expected = keys
      , len = keys.length;

    // Inclusion
    ok = keys.every(function(key){
      return ~actual.indexOf(key);
    });

    // Strict
    if (!flag(this, 'negate') && !flag(this, 'contains')) {
      ok = ok && keys.length == actual.length;
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key){
        return _.inspect(key);
      });
      var last = keys.pop();
      str = keys.join(', ') + ', and ' + last;
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + str
      , 'expected #{this} to not ' + str
      , expected.sort()
      , actual.sort()
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw(constructor)
   *
   * Asserts that the function target will throw a specific error, or specific type of error
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test
   * for the error's message.
   *
   *     var err = new ReferenceError('This is a bad function.');
   *     var fn = function () { throw err; }
   *     expect(fn).to.throw(ReferenceError);
   *     expect(fn).to.throw(Error);
   *     expect(fn).to.throw(/bad function/);
   *     expect(fn).to.not.throw('good function');
   *     expect(fn).to.throw(ReferenceError, /bad function/);
   *     expect(fn).to.throw(err);
   *     expect(fn).to.not.throw(new RangeError('Out of range.'));
   *
   * Please note that when a throw expectation is negated, it will check each
   * parameter independently, starting with error constructor type. The appropriate way
   * to check for the existence of a type of error but for a message that does not match
   * is to use `and`.
   *
   *     expect(fn).to.throw(ReferenceError)
   *        .and.not.throw(/good function/);
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {ErrorConstructor} constructor
   * @param {String|RegExp} expected error message
   * @param {String} message _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @api public
   */

  function assertThrows (constructor, errMsg, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('function');

    var thrown = false
      , desiredError = null
      , name = null
      , thrownError = null;

    if (arguments.length === 0) {
      errMsg = null;
      constructor = null;
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {
      errMsg = constructor;
      constructor = null;
    } else if (constructor && constructor instanceof Error) {
      desiredError = constructor;
      constructor = null;
      errMsg = null;
    } else if (typeof constructor === 'function') {
      name = constructor.prototype.name || constructor.name;
      if (name === 'Error' && constructor !== Error) {
        name = (new constructor()).name;
      }
    } else {
      constructor = null;
    }

    try {
      obj();
    } catch (err) {
      // first, check desired error
      if (desiredError) {
        this.assert(
            err === desiredError
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp}'
          , (desiredError instanceof Error ? desiredError.toString() : desiredError)
          , (err instanceof Error ? err.toString() : err)
        );

        flag(this, 'object', err);
        return this;
      }

      // next, check constructor
      if (constructor) {
        this.assert(
            err instanceof constructor
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp} but #{act} was thrown'
          , name
          , (err instanceof Error ? err.toString() : err)
        );

        if (!errMsg) {
          flag(this, 'object', err);
          return this;
        }
      }

      // next, check message
      var message = 'object' === _.type(err) && "message" in err
        ? err.message
        : '' + err;

      if ((message != null) && errMsg && errMsg instanceof RegExp) {
        this.assert(
            errMsg.exec(message)
          , 'expected #{this} to throw error matching #{exp} but got #{act}'
          , 'expected #{this} to throw error not matching #{exp}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else if ((message != null) && errMsg && 'string' === typeof errMsg) {
        this.assert(
            ~message.indexOf(errMsg)
          , 'expected #{this} to throw error including #{exp} but got #{act}'
          , 'expected #{this} to throw error not including #{act}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else {
        thrown = true;
        thrownError = err;
      }
    }

    var actuallyGot = ''
      , expectedThrown = name !== null
        ? name
        : desiredError
          ? '#{exp}' //_.inspect(desiredError)
          : 'an error';

    if (thrown) {
      actuallyGot = ' but #{act} was thrown'
    }

    this.assert(
        thrown === true
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot
      , (desiredError instanceof Error ? desiredError.toString() : desiredError)
      , (thrownError instanceof Error ? thrownError.toString() : thrownError)
    );

    flag(this, 'object', thrownError);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method)
   *
   * Asserts that the object or class target will respond to a method.
   *
   *     Klass.prototype.bar = function(){};
   *     expect(Klass).to.respondTo('bar');
   *     expect(obj).to.respondTo('bar');
   *
   * To check if a constructor will respond to a static function,
   * set the `itself` flag.
   *
   *     Klass.baz = function(){};
   *     expect(Klass).itself.to.respondTo('baz');
   *
   * @name respondTo
   * @param {String} method
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('respondTo', function (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === _.type(obj) && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  });

  /**
   * ### .itself
   *
   * Sets the `itself` flag, later used by the `respondTo` assertion.
   *
   *     function Foo() {}
   *     Foo.bar = function() {}
   *     Foo.prototype.baz = function() {}
   *
   *     expect(Foo).itself.to.respondTo('bar');
   *     expect(Foo).itself.not.to.respondTo('baz');
   *
   * @name itself
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(method)
   *
   * Asserts that the target passes a given truth test.
   *
   *     expect(1).to.satisfy(function(num) { return num > 0; });
   *
   * @name satisfy
   * @param {Function} matcher
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('satisfy', function (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , this.negate ? false : true
      , result
    );
  });

  /**
   * ### .closeTo(expected, delta)
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *
   * @name closeTo
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('closeTo', function (expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj, msg).is.a('number');
    if (_.type(expected) !== 'number' || _.type(delta) !== 'number') {
      throw new Error('the arguments to closeTo must be numbers');
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  });

  function isSubsetOf(subset, superset, cmp) {
    return subset.every(function(elem) {
      if (!cmp) return superset.indexOf(elem) !== -1;

      return superset.some(function(elem2) {
        return cmp(elem, elem2);
      });
    })
  }

  /**
   * ### .members(set)
   *
   * Asserts that the target is a superset of `set`,
   * or that the target and `set` have the same strictly-equal (===) members.
   * Alternately, if the `deep` flag is set, set members are compared for deep
   * equality.
   *
   *     expect([1, 2, 3]).to.include.members([3, 2]);
   *     expect([1, 2, 3]).to.not.include.members([3, 2, 8]);
   *
   *     expect([4, 2]).to.have.members([2, 4]);
   *     expect([5, 2]).to.not.have.members([5, 2, 1]);
   *
   *     expect([{ id: 1 }]).to.deep.include.members([{ id: 1 }]);
   *
   * @name members
   * @param {Array} set
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj).to.be.an('array');
    new Assertion(subset).to.be.an('array');

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    if (flag(this, 'contains')) {
      return this.assert(
          isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to be a superset of #{act}'
        , 'expected #{this} to not be a superset of #{act}'
        , obj
        , subset
      );
    }

    this.assert(
        isSubsetOf(obj, subset, cmp) && isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to have the same members as #{act}'
        , 'expected #{this} to not have the same members as #{act}'
        , obj
        , subset
    );
  });
};

},{}],17:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


module.exports = function (chai, util) {

  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .ok(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.ok('everything', 'everything is ok');
   *     assert.ok(false, 'this will fail');
   *
   * @name ok
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */

  assert.ok = function (val, msg) {
    new Assertion(val, msg).is.ok;
  };

  /**
   * ### .notOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.notOk('everything', 'this will fail');
   *     assert.notOk(false, 'this will pass');
   *
   * @name notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */

  assert.notOk = function (val, msg) {
    new Assertion(val, msg).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.deepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.eql(exp);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg).is['true'];
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg).is['false'];
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg).to.not.equal(null);
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object (as revealed by
   * `Object.prototype.toString`).
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object.
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('number');
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Works
   * for strings and arrays.
   *
   *     assert.include('foobar', 'bar', 'foobar contains string "bar"');
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Works
   * for strings and arrays.
   *i
   *     assert.notInclude('foobar', 'baz', 'string not include substring');
   *     assert.notInclude([ 1, 2, 3 ], 4, 'array not include contain value');
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude).not.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.property(prop);
  };

  /**
   * ### .deepProperty(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`, which can be a
   * string using dot- and bracket-notation for deep reference.
   *
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name deepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.deepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop);
  };

  /**
   * ### .notDeepProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for deep reference.
   *
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notDeepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notDeepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`.
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.property(prop, val);
  };

  /**
   * ### .propertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`.
   *
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');
   *
   * @name propertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.propertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for deep
   * reference.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop, val);
  };

  /**
   * ### .deepPropertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`. `property` can use dot- and
   * bracket-notation for deep reference.
   *
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *
   * @name deepPropertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepPropertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);
  };

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 5, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg).to.have.length(len);
  };

  /**
   * ### .throws(function, [constructor/string/regexp], [string/regexp], [message])
   *
   * Asserts that `function` will throw an error that is an instance of
   * `constructor`, or alternately that it will throw an error with message
   * matching `regexp`.
   *
   *     assert.throw(fn, 'function throws a reference error');
   *     assert.throw(fn, /function throws a reference error/);
   *     assert.throw(fn, ReferenceError);
   *     assert.throw(fn, ReferenceError, 'function throws a reference error');
   *     assert.throw(fn, ReferenceError, /function throws a reference error/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */

  assert.Throw = function (fn, errt, errs, msg) {
    if ('string' === typeof errt || errt instanceof RegExp) {
      errs = errt;
      errt = null;
    }

    var assertErr = new Assertion(fn, msg).to.Throw(errt, errs);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will _not_ throw an error that is an instance of
   * `constructor`, or alternately that it will not throw an error with message
   * matching `regexp`.
   *
   *     assert.doesNotThrow(fn, Error, 'function does not throw');
   *
   * @name doesNotThrow
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */

  assert.doesNotThrow = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }

    new Assertion(fn, msg).to.not.Throw(type);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    if (!~['==', '===', '>', '>=', '<', '<=', '!=', '!=='].indexOf(operator)) {
      throw new Error('Invalid operator "' + operator + '"');
    }
    var test = new Assertion(eval(val + operator + val2), msg);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.closeTo(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members.
   * Order is not taken into account.
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset`.
   * Order is not taken into account.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.members(subset);
  }

  /*!
   * Undocumented / untested
   */

  assert.ifError = function (val, msg) {
    new Assertion(val, msg).to.not.be.ok;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('Throw', 'throw')
  ('Throw', 'throws');
};

},{}],18:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };
};


},{}],19:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String || this instanceof Number) {
        return new Assertion(this.constructor(this), null, shouldGetter);
      } else if (this instanceof Boolean) {
        return new Assertion(this == true, null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],20:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var transferFlags = require('./transferFlags');
var flag = require('./flag');
var config = require('../config');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
// and there seems no easy cross-platform way to detect them (@see chaijs/chai/issues/69).
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### addChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @name addChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function () {
        chainableBehavior.chainingBehavior.call(this);

        var assert = function assert() {
          var old_ssfi = flag(this, 'ssfi');
          if (old_ssfi && config.includeStack === false)
            flag(this, 'ssfi', assert);
          var result = chainableBehavior.method.apply(this, arguments);
          return result === undefined ? this : result;
        };

        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = assert.__proto__ = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (!excludeNames.test(asserterName)) {
              var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
              Object.defineProperty(assert, asserterName, pd);
            }
          });
        }

        transferFlags(this, assert);
        return assert;
      }
    , configurable: true
  });
};

},{"../config":15,"./flag":23,"./transferFlags":37}],21:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');

/**
 * ### .addMethod (ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @name addMethod
 * @api public
 */
var flag = require('./flag');

module.exports = function (ctx, name, method) {
  ctx[name] = function () {
    var old_ssfi = flag(this, 'ssfi');
    if (old_ssfi && config.includeStack === false)
      flag(this, 'ssfi', ctx[name]);
    var result = method.apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{"../config":15,"./flag":23}],22:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### addProperty (ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @name addProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter.call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],23:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### flag(object ,key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object (constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @name flag
 * @api private
 */

module.exports = function (obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],24:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */

module.exports = function (obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],25:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],26:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @name getMessage
 * @api public
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#{this}/g, objDisplay(val))
    .replace(/#{act}/g, objDisplay(actual))
    .replace(/#{exp}/g, objDisplay(expected));

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":23,"./getActual":24,"./inspect":31,"./objDisplay":32}],27:[function(require,module,exports){
/*!
 * Chai - getName utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getName(func)
 *
 * Gets the name of a function, in a cross-browser way.
 *
 * @param {Function} a function (usually a constructor)
 */

module.exports = function (func) {
  if (func.name) return func.name;

  var match = /^\s?function ([^(]*)\(/.exec(func);
  return match && match[1] ? match[1] : "";
};

},{}],28:[function(require,module,exports){
/*!
 * Chai - getPathValue utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .getPathValue(path, object)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue('prop1.str', obj); // Hello
 *     getPathValue('prop1.att[2]', obj); // b
 *     getPathValue('prop2.arr[0].nested', obj); // Universe
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} value or `undefined`
 * @name getPathValue
 * @api public
 */

var getPathValue = module.exports = function (path, obj) {
  var parsed = parsePath(path);
  return _getPathValue(parsed, obj);
};

/*!
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `_getPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be as near infinitely deep and nested
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath (path) {
  var str = path.replace(/\[/g, '.[')
    , parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function (value) {
    var re = /\[(\d+)\]$/
      , mArr = re.exec(value)
    if (mArr) return { i: parseFloat(mArr[1]) };
    else return { p: value };
  });
};

/*!
 * ## _getPathValue(parsed, obj)
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(parsed, obj);
 *
 * @param {Object} parsed definition from `parsePath`.
 * @param {Object} object to search against
 * @returns {Object|Undefined} value
 * @api private
 */

function _getPathValue (parsed, obj) {
  var tmp = obj
    , res;
  for (var i = 0, l = parsed.length; i < l; i++) {
    var part = parsed[i];
    if (tmp) {
      if ('undefined' !== typeof part.p)
        tmp = tmp[part.p];
      else if ('undefined' !== typeof part.i)
        tmp = tmp[part.i];
      if (i == (l - 1)) res = tmp;
    } else {
      res = undefined;
    }
  }
  return res;
};

},{}],29:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(subject);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(subject);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],30:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Main exports
 */

var exports = module.exports = {};

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('./type');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path value
 */

exports.getPathValue = require('./getPathValue');

/*!
 * Function name
 */

exports.getName = require('./getName');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');


},{"./addChainableMethod":20,"./addMethod":21,"./addProperty":22,"./flag":23,"./getActual":24,"./getMessage":26,"./getName":27,"./getPathValue":28,"./inspect":31,"./objDisplay":32,"./overwriteChainableMethod":33,"./overwriteMethod":34,"./overwriteProperty":35,"./test":36,"./transferFlags":37,"./type":38,"deep-eql":40}],31:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('./getName');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      var name = getName(value);
      var nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    var name = getName(value);
    var nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str;
  if (value.__lookupGetter__) {
    if (value.__lookupGetter__(key)) {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"./getEnumerableProperties":25,"./getName":27,"./getProperties":29}],32:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay (object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @api public
 */

module.exports = function (obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":15,"./inspect":31}],33:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteChainableMethod (ctx, name, fn)
 *
 * Overwites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'length',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.length(3);
 *     expect(myFoo).to.have.length.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function () {
    var result = chainingBehavior(_chainingBehavior).call(this);
    return result === undefined ? this : result;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function () {
    var result = method(_method).apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{}],34:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteMethod (ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @name overwriteMethod
 * @api public
 */

module.exports = function (ctx, name, method) {
  var _method = ctx[name]
    , _super = function () { return this; };

  if (_method && 'function' === typeof _method)
    _super = _method;

  ctx[name] = function () {
    var result = method(_super).apply(this, arguments);
    return result === undefined ? this : result;
  }
};

},{}],35:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteProperty (ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @name overwriteProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter(_super).call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],36:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag');

/**
 * # test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":23}],37:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, and `message`)
 * will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags too; usually a new assertion
 * @param {Boolean} includeAll
 * @name getAllFlags
 * @api private
 */

module.exports = function (assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],38:[function(require,module,exports){
/*!
 * Chai - type utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Arguments]': 'arguments'
  , '[object Array]': 'array'
  , '[object Date]': 'date'
  , '[object Function]': 'function'
  , '[object Number]': 'number'
  , '[object RegExp]': 'regexp'
  , '[object String]': 'string'
};

/**
 * ### type(object)
 *
 * Better implementation of `typeof` detection that can
 * be used cross-browser. Handles the inconsistencies of
 * Array, `null`, and `undefined` detection.
 *
 *     utils.type({}) // 'object'
 *     utils.type(null) // `null'
 *     utils.type(undefined) // `undefined`
 *     utils.type([]) // `array`
 *
 * @param {Mixed} object to detect type of
 * @name type
 * @api private
 */

module.exports = function (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
};

},{}],39:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || arguments.callee;
  if (ssf && Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],40:[function(require,module,exports){
module.exports = require('./lib/eql');

},{"./lib/eql":41}],41:[function(require,module,exports){
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var type = require('type-detect');

/*!
 * Buffer.isBuffer browser shim
 */

var Buffer;
try { Buffer = require('buffer').Buffer; }
catch(ex) {
  Buffer = {};
  Buffer.isBuffer = function() { return false; }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;

/**
 * Assert super-strict (egal) equality between
 * two objects of any type.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @param {Array} memoised (optional)
 * @return {Boolean} equal match
 */

function deepEqual(a, b, m) {
  if (sameValue(a, b)) {
    return true;
  } else if ('date' === type(a)) {
    return dateEqual(a, b);
  } else if ('regexp' === type(a)) {
    return regexpEqual(a, b);
  } else if (Buffer.isBuffer(a)) {
    return bufferEqual(a, b);
  } else if ('arguments' === type(a)) {
    return argumentsEqual(a, b, m);
  } else if (!typeEqual(a, b)) {
    return false;
  } else if (('object' !== type(a) && 'object' !== type(b))
  && ('array' !== type(a) && 'array' !== type(b))) {
    return sameValue(a, b);
  } else {
    return objectEqual(a, b, m);
  }
}

/*!
 * Strict (egal) equality test. Ensures that NaN always
 * equals NaN and `-0` does not equal `+0`.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} equal match
 */

function sameValue(a, b) {
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  return a !== a && b !== b;
}

/*!
 * Compare the types of two given objects and
 * return if they are equal. Note that an Array
 * has a type of `array` (not `object`) and arguments
 * have a type of `arguments` (not `array`/`object`).
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function typeEqual(a, b) {
  return type(a) === type(b);
}

/*!
 * Compare two Date objects by asserting that
 * the time values are equal using `saveValue`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {Boolean} result
 */

function dateEqual(a, b) {
  if ('date' !== type(b)) return false;
  return sameValue(a.getTime(), b.getTime());
}

/*!
 * Compare two regular expressions by converting them
 * to string and checking for `sameValue`.
 *
 * @param {RegExp} a
 * @param {RegExp} b
 * @return {Boolean} result
 */

function regexpEqual(a, b) {
  if ('regexp' !== type(b)) return false;
  return sameValue(a.toString(), b.toString());
}

/*!
 * Assert deep equality of two `arguments` objects.
 * Unfortunately, these must be sliced to arrays
 * prior to test to ensure no bad behavior.
 *
 * @param {Arguments} a
 * @param {Arguments} b
 * @param {Array} memoize (optional)
 * @return {Boolean} result
 */

function argumentsEqual(a, b, m) {
  if ('arguments' !== type(b)) return false;
  a = [].slice.call(a);
  b = [].slice.call(b);
  return deepEqual(a, b, m);
}

/*!
 * Get enumerable properties of a given object.
 *
 * @param {Object} a
 * @return {Array} property names
 */

function enumerable(a) {
  var res = [];
  for (var key in a) res.push(key);
  return res;
}

/*!
 * Simple equality for flat iterable objects
 * such as Arrays or Node.js buffers.
 *
 * @param {Iterable} a
 * @param {Iterable} b
 * @return {Boolean} result
 */

function iterableEqual(a, b) {
  if (a.length !==  b.length) return false;

  var i = 0;
  var match = true;

  for (; i < a.length; i++) {
    if (a[i] !== b[i]) {
      match = false;
      break;
    }
  }

  return match;
}

/*!
 * Extension to `iterableEqual` specifically
 * for Node.js Buffers.
 *
 * @param {Buffer} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function bufferEqual(a, b) {
  if (!Buffer.isBuffer(b)) return false;
  return iterableEqual(a, b);
}

/*!
 * Block for `objectEqual` ensuring non-existing
 * values don't get in.
 *
 * @param {Mixed} object
 * @return {Boolean} result
 */

function isValue(a) {
  return a !== null && a !== undefined;
}

/*!
 * Recursively check the equality of two objects.
 * Once basic sameness has been established it will
 * defer to `deepEqual` for each enumerable key
 * in the object.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function objectEqual(a, b, m) {
  if (!isValue(a) || !isValue(b)) {
    return false;
  }

  if (a.prototype !== b.prototype) {
    return false;
  }

  var i;
  if (m) {
    for (i = 0; i < m.length; i++) {
      if ((m[i][0] === a && m[i][1] === b)
      ||  (m[i][0] === b && m[i][1] === a)) {
        return true;
      }
    }
  } else {
    m = [];
  }

  try {
    var ka = enumerable(a);
    var kb = enumerable(b);
  } catch (ex) {
    return false;
  }

  ka.sort();
  kb.sort();

  if (!iterableEqual(ka, kb)) {
    return false;
  }

  m.push([ a, b ]);

  var key;
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], m)) {
      return false;
    }
  }

  return true;
}

},{"buffer":8,"type-detect":42}],42:[function(require,module,exports){
module.exports = require('./lib/type');

},{"./lib/type":43}],43:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Array]': 'array'
  , '[object RegExp]': 'regexp'
  , '[object Function]': 'function'
  , '[object Arguments]': 'arguments'
  , '[object Date]': 'date'
};

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */

function getType (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library () {
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function (type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function (obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],44:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || !!this._all;
    }
    else {
      return !!this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if(!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    exports.EventEmitter2 = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],45:[function(require,module,exports){
/**
 * Copyright (c) 2014 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author liuxing
 * @date  14-12-1
 * @description
 *
 */



/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF),
        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t) {
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
}
function md5_ff(a, b, c, d, x, s, t) {
    return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t) {
    return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t) {
    return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t) {
    return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */
function binl_md5(x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    var i, olda, oldb, oldc, oldd,
        a = 1732584193,
        b = -271733879,
        c = -1732584194,
        d = 271733878;

    for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;

        a = md5_ff(a, b, c, d, x[i], 7, -680876936);
        d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5_gg(b, c, d, a, x[i], 20, -373897302);
        a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5_hh(d, a, b, c, x[i], 11, -358537222);
        c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = md5_ii(a, b, c, d, x[i], 6, -198630844);
        d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
    }
    return [a, b, c, d];
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2rstr(input) {
    var i,
        output = '';
    for (i = 0; i < input.length * 32; i += 8) {
        output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
    }
    return output;
}

/*
 * Convert a raw string to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */
function rstr2binl(input) {
    var i,
        output = [];
    output[(input.length >> 2) - 1] = undefined;
    for (i = 0; i < output.length; i += 1) {
        output[i] = 0;
    }
    for (i = 0; i < input.length * 8; i += 8) {
        output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return output;
}

/*
 * Calculate the MD5 of a raw string
 */
function rstr_md5(s) {
    return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
}

/*
 * Calculate the HMAC-MD5, of a key and some data (raw strings)
 */
function rstr_hmac_md5(key, data) {
    var i,
        bkey = rstr2binl(key),
        ipad = [],
        opad = [],
        hash;
    ipad[15] = opad[15] = undefined;
    if (bkey.length > 16) {
        bkey = binl_md5(bkey, key.length * 8);
    }
    for (i = 0; i < 16; i += 1) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }
    hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
    return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
}

/*
 * Convert a raw string to a hex string
 */
function rstr2hex(input) {
    var hex_tab = '0123456789abcdef',
        output = '',
        x,
        i;
    for (i = 0; i < input.length; i += 1) {
        x = input.charCodeAt(i);
        output += hex_tab.charAt((x >>> 4) & 0x0F) +
        hex_tab.charAt(x & 0x0F);
    }
    return output;
}

/*
 * Encode a string as utf-8
 */
function str2rstr_utf8(input) {
    return unescape(encodeURIComponent(input));
}

/*
 * Take string arguments and return either raw or hex encoded strings
 */
function raw_md5(s) {
    return rstr_md5(str2rstr_utf8(s));
}
function hex_md5(s) {
    return rstr2hex(raw_md5(s));
}
function raw_hmac_md5(k, d) {
    return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
}
function hex_hmac_md5(k, d) {
    return rstr2hex(raw_hmac_md5(k, d));
}

function md5(string, key, raw) {
    if (!key) {
        if (!raw) {
            return hex_md5(string);
        }
        return raw_md5(string);
    }
    if (!raw) {
        return hex_hmac_md5(key, string);
    }
    return raw_hmac_md5(key, string);
}
module.exports = md5;

},{}],46:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],47:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],48:[function(require,module,exports){
var Model = require("./model");
var utils = require("./utils");
var dataAgent = require('./dataAgent');
var appProps = require("../libs/appProps");
var device = require("../libs/device");
var waitForCloud = require("../libs/waitForCloud");
var log = require("./log");
var _ = require('underscore');
var online = true;
var staticConfig = require("../libs/constants.js");
var cloudHost;
var config;

function Config() {
    var self = this;
    self.setType('config');
    self.setLocalId('config');    
}
utils.extend(Config, Model);
Config.prototype.init = function(config, cb) {
    var self = this;

    if (config.studioMode) { //running in studio
        self.set("studioMode", true);
        self.fromJSON(config);
        cb();
    } else {
        self.set("studioMode", false);
        //load hard coded static config first
        self.staticConfig(config);
        //attempt to load config from mbaas then local storage.
        self.refresh(true, cb);
    }
};
Config.prototype.isStudioMode = function() {
    return this.get("studioMode");
};

Config.prototype.getStorageStrategy = function(){
    return this.get("storageStrategy");
};
Config.prototype.refresh = function(fromRemote, cb) {
    var self = this;
    if (typeof cb === 'undefined') {
        cb = fromRemote;
        fromRemote = false;
    }

    function _handler(err, res) {
        var configObj = {};

        if (!err && res) {
            if (typeof(res) === "string") {
                try {
                    configObj = JSON.parse(res);
                } catch (error) {
                    log.e("Invalid json config defintion from remote", error);
                    configObj = {};
                    return cb(error, null);
                }
            } else {
                configObj = res;
            }

            self.fromJSON(_.extend(self.getProps(), configObj));

            self.saveLocal(function(err, updatedConfigJSON) {
                cb(err, self);
            });
        } else {
            cb(err, self);
        }
    }
    self.loadLocal(function(err, localConfig) {
        if (err) {
            log.e("Config loadLocal ", err);
        }

        dataAgent.refreshRead(self, _handler);
    });
};
Config.prototype.getCloudHost = function() {
    return cloudHost;
};
Config.prototype.staticConfig = function(config) {
    config = config || {};
    var self = this;

    //config_admin_user can not be set by the user.
    if (config.config_admin_user) {
        delete config.config_admin_user;
    }

    //Full config
    var fullConfig = _.clone(staticConfig);

    //User config takes preceidence.
    fullConfig = _.extend(fullConfig, config);

    self._initMBaaS(fullConfig);

    self.fromJSON(fullConfig);
};
Config.prototype._initMBaaS = function(config) {
    cloudHost = config.cloudHost;
};
Config.prototype.setOnline = function() {
    var wasOnline = online;
    online = true;

    if (!wasOnline) {
        this.emit('online');
    }
};
Config.prototype.setOffline = function() {
    var wasOnline = online;
    online = false;

    if (wasOnline) {
        this.emit('offline');
    }
};
Config.prototype.isOnline = function() {
    var self = this;
    if (utils.isPhoneGap()) {
        if (navigator.connection && navigator.connection.type) {
            return online === true && navigator.connection.type !== Connection.NONE;
        } else {
            return online === true;
        }
    } else {
        return online === true;
    }

};
Config.prototype.isStudioMode = function() {
    return this.get("studioMode", false);
};

Config.prototype.getAppId = function() {
    return this.get('appId');
};

function getConfig(){
    if(!config){
        config = new Config();
    }   

    return config;
}

module.exports = getConfig();



},{"../libs/appProps":2,"../libs/constants.js":3,"../libs/device":4,"../libs/waitForCloud":6,"./dataAgent":49,"./log":68,"./model":69,"./utils":78,"underscore":47}],49:[function(require,module,exports){
var storeMbaas = require("./storeMbaas");
var localStorage = require("./localStorage");
var utils = require("./utils");
var Store = require("./store");
var log = require("./log");


//default data agent uses mbaas as remote store, localstorage as local store
var DataAgent = {
    remoteStore: storeMbaas,
    localStore: localStorage
};

/**
 * Read from local store first,
 if not exists, read from remote store and store locally
 * @param  {[type]}   model [description]
 * @param  {Function} cb    (err,res,isFromRemote)
 * @return {[type]}         [description]
 */
DataAgent.read = function(model, cb) {
    console.log("LOG ", log);
    log.d("DataAgent read ", model);
    var that = this;
    localStorage.read(model, function(err, locRes) {
        if (err || !locRes) {
            //local loading failed

            log.d("Error reading model from localStore ", model, err);

            that.refreshRead(model, cb);
        } else {
            //local loading succeed
            cb(null, locRes, false);
        }
    });
};
/**
 * Read from remote store and store the content locally.
 * @param  {[type]}   model [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
DataAgent.refreshRead = function(model, cb) {
    log.d("DataAgent refreshRead ", model);
    var that = this;
    storeMbaas.read(model, function(err, res) {
        if (err) {
            log.e("Error reading model from remoteStore ", model, err);
            cb(err);
        } else {
            log.d("Model refresh successfull from remoteStore ", model, res);
            //update model from remote response
            model.fromJSON(res);
            //update local storage for the model
            that.localStore.upsert(model, function() {
                var args = Array.prototype.slice.call(arguments, 0);
                args.push(true);
                cb.apply({}, args);
            });
        }
    });
};

/**
 * Attempt to run refresh read first, if failed, run read.
 * @param  {[type]}   model [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
DataAgent.attemptRead = function(model, cb) {
    log.d("DataAgent attemptRead ", model);
    var self = this;


    self.checkOnlineStatus(function(online) {
        if (require("./config").isOnline()) {
            self.refreshRead(model, function(err) {
                if (err) {
                    self.read(model, cb);
                } else {
                    cb.apply({}, arguments);
                }
            });
        } else {
            self.read(model, cb);
        }
    });
};

/**
 * Check online status of the remote store.
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
DataAgent.checkOnlineStatus = function(cb) {
    log.d("DataAgent check online status ");
    var self = this;

    if (utils.isPhoneGap()) {
        if (navigator.connection.type) {
            if (navigator.connection.type === Connection.NONE) {
                //No connection availabile, no need to ping.
                require("./config").offline();
                return cb(false);
            }
        }
    }


    storeMbaas.isOnline(function(online) {
        if (online === false) {
            require("./config").setOffline();
        } else {
            require("./config").setOnline();
        }

        cb(null, online);
    });
};

module.exports = DataAgent;

},{"./config":48,"./localStorage":67,"./log":68,"./store":72,"./storeMbaas":73,"./utils":78}],50:[function(require,module,exports){
/**
 * Field model for form
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");
var fieldCheckboxes = require("./fieldCheckboxes");
var fieldFile = require("./fieldFile");
var fieldImage = require("./fieldImage");
var fieldLocation = require("./fieldLocation");
var fieldMatrix = require("./fieldMatrix");
var fieldRadio = require("./fieldRadio");

function Field(opt, form) {
    opt = opt || {};
    if (opt) {
        this.fromJSON(opt);
        this.getLocalId();
    }
    if (form) {
        this.form = form;
    }
}

utils.extend(Field, Model);
utils.extend(Field, fieldCheckboxes);
utils.extend(Field, fieldFile);
utils.extend(Field, fieldLocation);
utils.extend(Field, fieldMatrix);
utils.extend(Field, fieldRadio);
utils.extend(Field, fieldImage);

Field.prototype.isRequired = function() {
    return this.get('required');
};
Field.prototype.getFieldValidation = function() {
    return this.getFieldOptions().validation || {};
};
Field.prototype.getFieldDefinition = function() {
    return this.getFieldOptions().definition || {};
};
Field.prototype.getMinRepeat = function() {
    var def = this.getFieldDefinition();
    return def.minRepeat || 1;
};
Field.prototype.getMaxRepeat = function() {
    var def = this.getFieldDefinition();
    return def.maxRepeat || 1;
};
Field.prototype.getFieldOptions = function() {
    return this.get('fieldOptions', {
        'validation': {},
        'definition': {}
    });
};
Field.prototype.getPhotoOptions = function() {
    var photoOptions = {
        "targetWidth": null,
        "targetHeight": null,
        "quality": null,
        "saveToPhotoAlbum": null,
        "pictureSource": null,
        "encodingType": null
    };

    var fieldDef = this.getFieldDefinition();
    photoOptions.targetWidth = fieldDef.photoWidth;
    photoOptions.targetHeight = fieldDef.photoHeight;
    photoOptions.quality = fieldDef.photoQuality;
    photoOptions.saveToPhotoAlbum = fieldDef.saveToPhotoAlbum;
    photoOptions.pictureSource = fieldDef.photoSource;
    photoOptions.encodingType = fieldDef.photoType;

    return photoOptions;
};
Field.prototype.isRepeating = function() {
    return this.get('repeating', false);
};
/**
 * retrieve field type.
 * @return {[type]} [description]
 */
Field.prototype.getType = function() {
    return this.get('type', 'text');
};

Field.prototype.setType = function(type) {
    return this.set('type', type || 'text');
};

Field.prototype.getFieldId = function() {
    return this.get('_id', '');
};
Field.prototype.getName = function() {
    return this.get('name', 'unknown');
};

Field.prototype.getCode = function() {
    return this.get('fieldCode', null);
};
Field.prototype.getHelpText = function() {
    return this.get('helpText', '');
};

/**
 * return default value for a field
 *
 */
Field.prototype.getDefaultValue = function() {
    var def = this.getFieldDefinition();
    if (def) {
        return def.defaultValue;
    }
    return "";
};

Field.prototype.isAdminField = function() {
    return this.get("adminOnly");
};


/**
 * Process an input value. convert to submission format. run Field.prototype.validate before this
 * @param  {[type]} params {"value", "isStore":optional}
 * @param {cb} cb(err,res)
 * @return {[type]}           submission json used for fieldValues for the field
 */
Field.prototype.processInput = function(params, cb) {
    var type = this.getType();
    var processorName = 'process_' + type;
    var inputValue = params.value;
    if (typeof inputValue === 'undefined' || inputValue === null) {
        //if user input is empty, keep going.
        return cb(null, inputValue);
    }
    // try to find specified processor
    if (this[processorName] && typeof this[processorName] === 'function') {
        this[processorName](params, cb);
    } else {
        cb(null, inputValue);
    }
};
/**
 * Convert the submission value back to input value.
 * @param  {[type]} submissionValue [description]
 * @param { function} cb callback
 * @return {[type]}                 [description]
 */
Field.prototype.convertSubmission = function(submissionValue, cb) {
    var type = this.getType();
    var processorName = 'convert_' + type;
    // try to find specified processor
    if (this[processorName] && typeof this[processorName] === 'function') {
        this[processorName](submissionValue, cb);
    } else {
        cb(null, submissionValue);
    }
};
/**
 * validate an input with this Field.prototype.
 * @param  {[type]} inputValue [description]
 * @return true / error message
 */
Field.prototype.validate = function(inputValue, inputValueIndex, cb) {
    if (typeof(inputValueIndex) === 'function') {
        cb = inputValueIndex;
        inputValueIndex = 0;
    }
    this.form.getRuleEngine().validateFieldValue(this.getFieldId(), inputValue, inputValueIndex, cb);
};
/**
 * return rule array attached to this Field.prototype.
 * @return {[type]} [description]
 */
Field.prototype.getRules = function() {
    var id = this.getFieldId();
    return this.form.getRulesByFieldId(id);
};
Field.prototype.setVisible = function(isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
        this.emit('visible');
    } else {
        this.emit('hidden');
    }
};

module.exports = Field;

},{"./config":48,"./fieldCheckboxes":51,"./fieldFile":52,"./fieldImage":53,"./fieldLocation":54,"./fieldMatrix":55,"./fieldRadio":56,"./log":68,"./model":69,"./utils":78}],51:[function(require,module,exports){
/**
 * extension of Field class to support checkbox field
 */

function getCheckBoxOptions() {
    var def = this.getFieldDefinition();
    if (def.options) {
        return def.options;
    } else {
        throw 'checkbox choice definition is not found in field definition';
    }
}

function process_checkboxes(params, cb) {
    var inputValue = params.value;
    if (!inputValue || !inputValue.selections || !(inputValue.selections instanceof Array)) {
        cb('the input value for processing checkbox field should be like {selections: [val1,val2]}');
    } else {
        cb(null, inputValue);
    }
}

function convert_checkboxes(value, cb) {
    var rtn = [];
    for (var i = 0; i < value.length; i++) {
        rtn.push(value[i].selections);
    }
    cb(null, rtn);
}

module.exports = {
    prototype: {
        getCheckBoxOptions: getCheckBoxOptions,
        process_checkboxes: process_checkboxes,
        convert_checkboxes: convert_checkboxes
    }
};
},{}],52:[function(require,module,exports){
/**
 * extension of Field class to support file field
 */
var Model = require("./model.js");
var log = require("./log.js");
var config = require("./config.js");
var localStorage = require("./localStorage.js");
var utils = require('./utils.js');

function checkFileObj(obj) {
    return obj.fileName && obj.fileType && obj.hashName;
}

function process_file(params, cb) {
    var inputValue = params.value;
    var isStore = params.isStore === undefined ? true : params.isStore;
    var lastModDate = new Date().getTime();
    var previousFile = params.previousFile || {};
    var hashName = null;
    if (typeof inputValue === 'undefined' || inputValue === null) {
        return cb("No input value to process_file", null);
    }

    function getFileType(fileType, fileNameString) {
        fileType = fileType || "";
        fileNameString = fileNameString || "";

        //The type if file is already known. No need to parse it out.
        if (fileType.length > 0) {
            return fileType;
        }

        //Camera does not sent file type. Have to parse it from the file name.
        if (fileNameString.indexOf(".png") > -1) {
            return "image/png";
        } else if (fileNameString.indexOf(".jpg") > -1) {
            return "image/jpeg";
        } else {
            return "application/octet-stream";
        }
    }

    function getFileName(fileNameString, filePathString) {
        fileNameString = fileNameString || "";
        if (fileNameString.length > 0) {
            return fileNameString;
        } else {
            //Need to extract the name from the file path
            var indexOfName = filePathString.lastIndexOf("/");
            if (indexOfName > -1) {
                return filePathString.slice(indexOfName);
            } else {
                return null;
            }
        }
    }

    var file = inputValue;
    if (inputValue instanceof HTMLInputElement) {
        file = inputValue.files[0] || {}; // 1st file only, not support many files yet.
    }

    if (typeof(file.lastModifiedDate) === 'undefined') {
        lastModDate = utils.getTime().getTime();
    }

    if (file.lastModifiedDate instanceof Date) {
        lastModDate = file.lastModifiedDate.getTime();
    }

    var fileName = getFileName(file.name || file.fileName, file.fullPath);

    var fileType = getFileType(file.type || file.fileType, fileName);

    //Placeholder files do not have a file type. It inherits from previous types
    if (fileName === null && !previousFile.fileName) {
        return cb("Expected picture to be PNG or JPEG but was null");
    }

    if (previousFile.hashName) {
        if (fileName === previousFile.hashName || file.hashName === previousFile.hashName) {
            //Submitting an existing file already saved, no need to save.
            return cb(null, previousFile);
        }
    }

    var rtnJSON = {
        'fileName': fileName,
        'fileSize': file.size,
        'fileType': fileType,
        'fileUpdateTime': lastModDate,
        'hashName': '',
        'imgHeader': '',
        'contentType': 'binary'
    };

    //The file to be submitted is new
    previousFile = rtnJSON;

    var name = fileName + new Date().getTime() + Math.ceil(Math.random() * 100000);
    utils.md5(name, function(err, res) {
        hashName = res;
        if (err) {
            hashName = name;
        }
        hashName = 'filePlaceHolder' + hashName;

        if (fileName.length === 0) {
            previousFile.fileName = hashName;
        }

        previousFile.hashName = hashName;
        if (isStore) {
            localStorage.saveFile(hashName, file, function(err, res) {
                if (err) {
                    log.e(err);
                    cb(err);
                } else {
                    cb(null, previousFile);
                }
            });
        } else {
            cb(null, previousFile);
        }
    });
}

module.exports = {
    prototype: {
        checkFileObj: checkFileObj,
        process_file: process_file
    }

};
},{"./config.js":48,"./localStorage.js":67,"./log.js":68,"./model.js":69,"./utils.js":78}],53:[function(require,module,exports){
/**
 * extension of Field class to support file field
 */

var localStorage = require("./localStorage.js");
var fileSystem = require("./fileSystem.js");
var log = require("./log.js");
var config = require("./config.js");
var async = require("async");
var _ = require("underscore");

function imageProcess(params, cb) {
    var self = this;
    var inputValue = params.value;
    var isStore = params.isStore === undefined ? true : params.isStore;
    var previousFile = params.previousFile || {};
    if (typeof(inputValue) !== "string") {
        return cb("Expected base64 string image or file URI but parameter was not a string", null);
    }

    //Input value can be either a base64 String or file uri, the behaviour of upload will change accordingly.

    if (inputValue.length < 1) {
        return cb("Expected base64 string or file uri but got string of lenght 0:  " + inputValue, null);
    }

    if (inputValue.indexOf(";base64,") > -1) {
        var imgName = '';
        var dataArr = inputValue.split(';base64,');
        var imgType = dataArr[0].split(':')[1];
        var extension = imgType.split('/')[1];
        var size = inputValue.length;
        genImageName(function(err, n) {
            imgName = previousFile.hashName ? previousFile.hashName : 'filePlaceHolder' + n;
            //TODO Abstract this out
            var meta = {
                'fileName': imgName + '.' + extension,
                'hashName': imgName,
                'contentType': 'base64',
                'fileSize': size,
                'fileType': imgType,
                'imgHeader': 'data:' + imgType + ';base64,',
                'fileUpdateTime': new Date().getTime()
            };
            if (isStore) {
                localStorage.updateTextFile(imgName, dataArr[1], function(err, res) {
                    if (err) {
                        log.e(err);
                        cb(err);
                    } else {
                        cb(null, meta);
                    }
                });
            } else {
                cb(null, meta);
            }
        });
    } else {
        //Image is a file uri, the file needs to be saved as a file.
        //Can use the process_file function to do this.
        //Need to read the file as a file first
        fileSystem.readAsFile(inputValue, function(err, file) {
            if (err) {
                return cb(err);
            }

            params.value = file;
            self.process_file(params, cb);
        });
    }
}

function genImageName(cb) {
    var name = new Date().getTime() + '' + Math.ceil(Math.random() * 100000);
    utils.md5(name, cb);
}

//TODO - Dont make functions here!
function convertImage(value, cb) {
    async.map(value || [], function(meta, cb) {
        _loadImage(meta, function() {
            cb(null, value);
        });
    }, cb);
}

//An image can be either a base64 image or a binary image.
//If base64, need to load the data as text.
//If binary, just need to load the file uri.
function _loadImage(meta, cb) {
    if (meta) {

        /**
         * If the file already contains a local uri, then no need to load it.
         */
        if (meta.localURI) {
            return cb(null, meta);
        }

        var name = meta.hashName;
        if (meta.contentType === "base64") {
            localStorage.readFileText(name, function(err, text) {
                if (err) {
                    log.e(err);
                }
                meta.data = text;
                cb(err, meta);
            });
        } else if (meta.contentType === "binary") {
            localStorage.readFile(name, function(err, file) {
                if (err) {
                    log.e("Error reading file " + name, err);
                }

                if (file && file.fullPath) {
                    meta.data = file.fullPath;
                } else {
                    meta.data = "file-not-found";
                }

                cb(err, meta);
            });
        } else {
            log.e("Error load image with invalid meta" + meta.contentType);
        }
    } else {
        cb(null, meta);
    }
}

module.exports = {
    prototype: {
        process_signature: imageProcess,
        convert_signature: convertImage,
        process_photo: imageProcess,
        convert_photo: convertImage
    }

};
},{"./config.js":48,"./fileSystem.js":60,"./localStorage.js":67,"./log.js":68,"async":7,"underscore":47}],54:[function(require,module,exports){
    /**
     * extension of Field class to support latitude longitude field
     */

    var Model = require("./model");
    var log = require("./log");
    var config = require("./config");

    function process_location(params, cb) {
        var inputValue = params.value;
        var def = this.getFieldDefinition();
        var obj = {};
        switch (def.locationUnit) {
            case 'latlong':
                if (!inputValue.lat || !inputValue.long) {
                    cb('the input values for latlong field is {lat: number, long: number}');
                } else {
                    obj = {
                        'lat': inputValue.lat,
                        'long': inputValue.long
                    };
                    cb(null, obj);
                }
                break;
            case 'eastnorth':
                if (!inputValue.zone || !inputValue.eastings || !inputValue.northings) {
                    cb('the input values for northeast field is {zone: text, eastings: text, northings:text}');
                } else {
                    obj = {
                        'zone': inputValue.zone,
                        'eastings': inputValue.eastings,
                        'northings': inputValue.northings
                    };
                    cb(null, obj);
                }
                break;
            default:
                cb('Invalid subtype type of location field, allowed types: latlong and eastnorth, was: ' + def.locationUnit);
                break;
        }
    }

    module.exports = {
        prototype: {
            process_location: process_location
        }
    };
},{"./config":48,"./log":68,"./model":69}],55:[function(require,module,exports){
/**
 * extension of Field class to support matrix field
 */

var Model = require("./model");
var log = require("./log");
var config = require("./config");

function getMatrixRows() {
    var def = this.getFieldDefinition();
    if (def.rows) {
        return def.rows;
    } else {
        log.e('matrix rows definition is not found in field definition');
        return null;
    }
}

function getMatrixCols() {
    var def = this.getFieldDefinition();
    if (def.columns) {
        return def.columns;
    } else {
        log.e('matrix columns definition is not found in field definition');
        return null;
    }
}

module.exports = {
    prototype: {
        getMatrixRows: getMatrixRows,
        getMatrixCols: getMatrixCols
    }
};
},{"./config":48,"./log":68,"./model":69}],56:[function(require,module,exports){
/**
 * extension of Field class to support radio field
 */

var Model = require("./model");
var log = require("./log");
var config = require("./config");

function getRadioOption() {
    var def = this.getFieldDefinition();
    if (def.options) {
        return def.options;
    } else {
        log.e('Radio options definition is not found in field definition');
    }
}

module.exports = {
    prototype: {
        getRadioOption: getRadioOption
    }
};
},{"./config":48,"./log":68,"./model":69}],57:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var localStorage = require("./localStorage");
var utils = require("./utils");

function FileSubmission(fileData) {
    log.d("FileSubmission ", fileData);
    Model.call(this, {
        '_type': 'fileSubmission',
        'data': fileData
    });
}

utils.extend(FileSubmission, Model);

FileSubmission.prototype.loadFile = function(cb) {
    log.d("FileSubmission loadFile");
    var fileName = this.getHashName();
    var that = this;
    localStorage.readFile(fileName, function(err, file) {
        if (err) {
            log.e("FileSubmission loadFile. Error reading file", fileName, err);
            cb(err);
        } else {
            log.d("FileSubmission loadFile. File read correctly", fileName, file);
            that.fileObj = file;
            cb(null);
        }
    });
};
FileSubmission.prototype.getProps = function() {
    if (this.fileObj) {
        log.d("FileSubmissionDownload: file object found");
        return this.fileObj;
    } else {
        log.e("FileSubmissionDownload: no file object found");
    }
};
FileSubmission.prototype.setSubmissionId = function(submissionId) {
    log.d("FileSubmission setSubmissionId.", submissionId);
    this.set('submissionId', submissionId);
};
FileSubmission.prototype.getSubmissionId = function() {
    return this.get('submissionId');
};
FileSubmission.prototype.getHashName = function() {
    return this.get('data').hashName;
};
FileSubmission.prototype.getFieldId = function() {
    return this.get('data').fieldId;
};

module.exports = FileSubmission;

},{"./config":48,"./localStorage":67,"./log":68,"./model":69,"./utils":78}],58:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var localStorage = require("./localStorage");
var FileSubmission = require("./fileSubmission");
var utils = require("./utils");

function Base64FileSubmission(fileData) {
    FileSubmission.call(this, fileData);
    this.set('_type', 'base64fileSubmission');
}

utils.extend(Base64FileSubmission, Model);

module.exports = Base64FileSubmission;

},{"./config":48,"./fileSubmission":57,"./localStorage":67,"./log":68,"./model":69,"./utils":78}],59:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var localStorage = require("./localStorage");
var FileSubmission = require("./fileSubmission");
var utils = require("./utils");


function FileSubmissionDownload(fileData) {
    log.d("FileSubmissionDownload ", fileData);
    Model.call(this, {
        '_type': 'fileSubmissionDownload',
        'data': fileData
    });
}

utils.extend(FileSubmissionDownload, Model);

FileSubmissionDownload.prototype.setSubmissionId = function(submissionId) {
    log.d("FileSubmission setSubmissionId.", submissionId);
    this.set('submissionId', submissionId);
};
FileSubmissionDownload.prototype.getSubmissionId = function() {
    log.d("FileSubmission getSubmissionId: ", this.get('submissionId'));
    return this.get('submissionId', "");
};
FileSubmissionDownload.prototype.getHashName = function() {
    log.d("FileSubmission getHashName: ", this.get('data').hashName);
    return this.get('data', {}).hashName;
};
FileSubmissionDownload.prototype.getFieldId = function() {
    log.d("FileSubmission getFieldId: ", this.get('data').fieldId);
    return this.get('data', {}).fieldId;
};
FileSubmissionDownload.prototype.getFileMetaData = function() {
    log.d("FileSubmission getFileMetaData: ", this.get('data'));
    if (this.get('data')) {
        log.d("FileSubmission getFileMetaData: data found", this.get('data'));
    } else {
        log.e("FileSubmission getFileMetaData: No data found");
    }
    return this.get('data', {});
};
FileSubmissionDownload.prototype.getFileGroupId = function() {
    log.d("FileSubmission getFileGroupId: ", this.get('data'));
    return this.get('data', {}).groupId || "notset";
};
FileSubmissionDownload.prototype.getRemoteFileURL = function() {
    var self = this;
    log.d("FileSubmission getRemoteFileURL: ");

    //RemoteFileUrl = cloudHost + /mbaas/forms/submission/:submissionId/file/:fileGroupId
    //Returned by the mbaas.
    function buildRemoteFileUrl() {
        var submissionId = self.getSubmissionId();
        var fileGroupId = self.getFileGroupId();
        var urlTemplate = config.get('formUrls', {}).fileSubmissionDownload;
        if (urlTemplate) {
            urlTemplate = urlTemplate.replace(":submissionId", submissionId);
            urlTemplate = urlTemplate.replace(":fileGroupId", fileGroupId);
            urlTemplate = urlTemplate.replace(":appId", config.get('appId', "notSet"));
            return config.getCloudHost() + "/mbaas" + urlTemplate;
        } else {
            return "notset";
        }
    }

    return buildRemoteFileUrl();
};

module.exports = FileSubmissionDownload;

},{"./config":48,"./fileSubmission":57,"./localStorage":67,"./log":68,"./model":69,"./utils":78}],60:[function(require,module,exports){
var utils = require("./utils");
var async = require('async');

var fileSystemAvailable = false;
var _requestFileSystem = function() {
    console.error("No file system available");
};
//placeholder
var PERSISTENT = 1;
//placeholder
function isFileSystemAvailable() {
    _checkEnv();
    return fileSystemAvailable;
}
//convert a file object to base64 encoded.
function fileToBase64(file, cb) {
    if (!file instanceof File) {
        return cb('Only file object can be used for converting');
    }
    var fileReader = new FileReader();
    fileReader.onloadend = function(evt) {
        var text = evt.target.result;
        return cb(null, text);
    };
    fileReader.readAsDataURL(file);
}

function _createBlobOrString(contentstr) {
    var retVal;
    if (utils.isPhoneGap()) { // phonegap filewriter works with strings, later versions also ork with binary arrays, and if passed a blob will just convert to binary array anyway
        retVal = contentstr;
    } else {
        var targetContentType = 'text/plain';
        try {
            retVal = new Blob([contentstr], {
                type: targetContentType
            }); // Blob doesn't exist on all androids
        } catch (e) {
            // TypeError old chrome and FF
            var blobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder ||
                window.MSBlobBuilder;
            if (e.name === 'TypeError' && blobBuilder) {
                var bb = new blobBuilder();
                bb.append([contentstr.buffer]);
                retVal = bb.getBlob(targetContentType);
            } else {
                // We can't make a Blob, so just return the stringified content
                retVal = contentstr;
            }
        }
    }
    return retVal;
}


function getBasePath(cb) {
    save("dummy.txt", "TestContnet", function(err, fileEntry) {
        if (err) {
            return cb(err);
        }

        _getFileEntry("dummy.txt", 0, {}, function(err, fileEntry) {
            var sPath = fileEntry.fullPath.replace("dummy.txt", "");
            fileEntry.remove();
            return cb(null, sPath);
        });
    });
}

function _getSaveObject(content) {
    var saveObj = null;
    if (typeof content === 'object' && content !== null) {
        if (content instanceof File || content instanceof Blob) {
            //File object
            saveObj = content;
        } else {
            //JSON object
            var contentstr = JSON.stringify(content);
            saveObj = _createBlobOrString(contentstr);
        }
    } else if (typeof content === 'string') {
        saveObj = _createBlobOrString(content);
    }

    return saveObj;
}

/**
 * Save a content to file system into a file
 *
 * In the case where the content is a File and PhoneGap is available, the function will attempt to use the "copyTo" function instead of writing the file.
 * This is because windows phone does not allow writing binary files with PhoneGap.
 * @param  {[type]} fileName file name to be stored.
 * @param  {[type]} content  json object / string /  file object / blob object
 * @param  {[type]} cb  (err, result)
 * @return {[type]}          [description]
 */
function save(fileName, content, cb) {
    var self = this;
    var saveObj = _getSaveObject(content);
    if (saveObj === null) {
        return cb("Invalid content type. Object was null");
    }
    var size = saveObj.size || saveObj.length;

    _getFileEntry(fileName, size, {
        create: true
    }, function(err, fileEntry) {
        if (err) {
            cb(err);
        } else {
            if (utils.isPhoneGap() && saveObj instanceof File) {
                //Writing binary files is not possible in windows phone.
                //So if the thing to save is a file, and it is in phonegap, use the copyTo functions instead.
                fileEntry.getParent(function(parentDir) {
                    //Get the file entry for the file input
                    _resolveFile(saveObj.fullPath, function(err, fileToCopy) {
                        if (err) {
                            return cb(err);
                        }
                        fileName = fileEntry.name;

                        fileEntry.remove(function() {
                            fileToCopy.copyTo(parentDir, fileName, function(copiedFile) {
                                return cb(null, copiedFile);
                            }, function(err) {
                                return cb(err);
                            });
                        }, function(err) {
                            return cb(err);
                        });
                    }, function(err) {
                        return cb(err);
                    });
                }, function(err) {
                    return cb(err);
                });
            } else {
                //Otherwise, just write text
                fileEntry.createWriter(function(writer) {
                    function _onFinished(evt) {
                        return cb(null, evt);
                    }

                    function _onTruncated() {
                        writer.onwriteend = _onFinished;
                        writer.write(saveObj); //write method can take a blob or file object according to html5 standard.
                    }
                    writer.onwriteend = _onTruncated;
                    //truncate the file first.
                    writer.truncate(0);
                }, function(e) {
                    cb('Failed to create file write:' + e);
                });
            }

        }
    });
}
/**
 * Remove a file from file system
 * @param  {[type]}   fileName file name of file to be removed
 * @param  {Function} cb
 * @return {[type]}            [description]
 */
function remove(fileName, cb) {
    _getFileEntry(fileName, 0, {}, function(err, fileEntry) {
        if (err) {
            if (!(err.name === 'NotFoundError' || err.code === 1)) {
                return cb(err);
            } else {
                return cb(null, null);
            }
        }
        fileEntry.remove(function() {
            cb(null, null);
        }, function(e) {
            cb('Failed to remove file' + e);
        });
    });
}
/**
 * Read a file as text
 * @param  {[type]}   fileName [description]
 * @param  {Function} cb       (err,text)
 * @return {[type]}            [description]
 */
function readAsText(fileName, cb) {
    _getFile(fileName, function(err, file) {
        if (err) {
            cb(err);
        } else {
            var reader = new FileReader();
            reader.onloadend = function(evt) {
                var text = evt.target.result;
                if (typeof text === "object") {
                    text = JSON.stringify(text);
                }
                // Check for URLencoded
                // PG 2.2 bug in readAsText()
                try {
                    text = decodeURIComponent(text);
                } catch (e) {

                }
                return cb(null, text);
            };
            reader.readAsText(file);
        }
    });
}
/**
 * Read a file and return base64 encoded data
 * @param  {[type]}   fileName [description]
 * @param  {Function} cb       (err,base64Encoded)
 * @return {[type]}            [description]
 */
function readAsBase64Encoded(fileName, cb) {
    _getFile(fileName, function(err, file) {
        if (err) {
            return cb(err);
        }
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            var text = evt.target.result;
            return cb(null, text);
        };
        reader.readAsDataURL(file);
    });
}
/**
 * Read a file return blob object (which can be used for XHR uploading binary)
 * @param  {[type]}   fileName [description]
 * @param  {Function} cb       (err, blob)
 * @return {[type]}            [description]
 */
function readAsBlob(fileName, cb) {
    _getFile(fileName, function(err, file) {
        if (err) {
            return cb(err);
        } else {
            var type = file.type;
            var reader = new FileReader();
            reader.onloadend = function(evt) {
                var arrayBuffer = evt.target.result;
                var blob = new Blob([arrayBuffer], {
                    'type': type
                });
                cb(null, blob);
            };
            reader.readAsArrayBuffer(file);
        }
    });
}

function readAsFile(fileName, cb) {
    _getFile(fileName, cb);
}
/**
 * Retrieve a file object
 * @param  {[type]}   fileName [description]
 * @param  {Function} cb     (err,file)
 * @return {[type]}            [description]
 */
function _getFile(fileName, cb) {
    _getFileEntry(fileName, 0, {}, function(err, fe) {
        if (err) {
            return cb(err);
        }
        fe.file(function(file) {
            cb(null, file);
        }, function(e) {
            cb(e);
        });
    });
}

function _resolveFile(fileName, cb) {
    //This is necessary to get the correct uri for apple. The URI in a file object for iphone does not have the file:// prefix.
    //This gives invalid uri errors when trying to resolve.
    if (fileName.indexOf("file://") === -1 && window.device.platform !== "Win32NT") {
        fileName = "file://" + fileName;
    }
    window.resolveLocalFileSystemURI(fileName, function(fileEntry) {
        return cb(null, fileEntry);
    }, function(err) {
        return cb(err);
    });
}

function _getFileEntry(fileName, size, params, cb) {
    var self = this;
    _checkEnv();
    if (typeof(fileName) === "string") {
        _requestFileSystem(PERSISTENT, size, function gotFS(fileSystem) {
            fileSystem.root.getFile(fileName, params, function gotFileEntry(fileEntry) {
                cb(null, fileEntry);
            }, function(err) {
                if (err.name === 'QuotaExceededError' || err.code === 10) {
                    //this happens only on browser. request for 1 gb storage
                    //TODO configurable from cloud
                    var bigSize = 1024 * 1024 * 1024;
                    _requestQuote(bigSize, function(err, bigSize) {
                        _getFileEntry(fileName, size, params, cb);
                    });
                } else {
                    if (!utils.isPhoneGap()) {
                        return cb(err);
                    } else {
                        _resolveFile(fileName, cb);
                    }
                }
            });
        }, function() {
            cb('Failed to requestFileSystem');
        });
    } else {
        if (typeof(cb) === "function") {
            cb("Expected file name to be a string but was " + fileName);
        }
    }
}

function _requestQuote(size, cb) {
    if (navigator.webkitPersistentStorage) {
        //webkit browser
        navigator.webkitPersistentStorage.requestQuota(size, function(size) {
            cb(null, size);
        }, function(err) {
            cb(err, 0);
        });
    } else {
        //PhoneGap does not need to do this.return directly.
        cb(null, size);
    }
}

function _checkEnv() {
    if (window.requestFileSystem) {
        _requestFileSystem = window.requestFileSystem;
        fileSystemAvailable = true;
    } else if (window.webkitRequestFileSystem) {
        _requestFileSystem = window.webkitRequestFileSystem;
        fileSystemAvailable = true;
    } else {
        fileSystemAvailable = false;
    }
    if (window.LocalFileSystem) {
        PERSISTENT = window.LocalFileSystem.PERSISTENT;
    } else if (window.PERSISTENT) {
        PERSISTENT = window.PERSISTENT;
    }
}

module.exports = {
    isFileSystemAvailable: isFileSystemAvailable,
    save: save,
    remove: remove,
    readAsText: readAsText,
    readAsBlob: readAsBlob,
    readAsBase64Encoded: readAsBase64Encoded,
    readAsFile: readAsFile,
    fileToBase64: fileToBase64,
    getBasePath: getBasePath
};
},{"./utils":78,"async":7}],61:[function(require,module,exports){
var Page = require("./page");
var Field = require("./field");
var RulesEngine = require("./rulesEngine");
var utils = require("./utils");
var log = require("./log");
var submission = require("./submission");
var Model = require("./model");
var forms = require("./forms");
var _ = require('underscore');

var _forms = {};
//cache of all forms. single instance for 1 formid
/**
 * [Form description]
 * @param {[type]}   params  {formId: string, fromRemote:boolean(false), rawMode:false, rawData:JSON}
 * @param {Function} cb         [description]
 */
function Form(params, cb) {
    var that = this;
    var rawMode = params.rawMode || false;
    var rawData = params.rawData || null;
    var formId = params.formId;
    var fromRemote = params.fromRemote;
    log.d("Form: ", rawMode, rawData, formId, fromRemote);

    if (typeof fromRemote === 'function' || typeof cb === 'function') {
        if (typeof fromRemote === 'function') {
            cb = fromRemote;
            fromRemote = false;
        }
    } else {
        return log.e('A callback function is required for initialising form data. new Form (formId, [isFromRemote], cb)');
    }

    if (!formId) {
        return cb('Cannot initialise a form object without an id. id:' + formId, null);
    }

    that.set('_id', formId);
    that.set('_type', 'form');
    that.setRemoteId(formId);
    that.getLocalId();

    function loadFromLocal() {
        log.d("Form: loadFromLocal ", rawMode, rawData, formId, fromRemote);
        if (_forms[formId]) {
            //found form object in mem return it.
            cb(null, _forms[formId]);
            return _forms[formId];
        }

        function processRawFormJSON() {
            that.fromJSON(rawData);
            that.initialise();

            _forms[that.getFormId()] = that;
            return cb(null, that);
        }

        if (rawData) {
            return processRawFormJSON();
        } else {

            /**
             * No Form JSON object to process into Models, load the form from local
             * storage.
             */
            that.refresh(false, function(err, form) {
                if (err) {
                    return cb(err);
                }

                form.initialise();

                _forms[formId] = form;
                return cb(null, form);
            });
        }
    }


    function loadFromRemote() {
        log.d("Form: loadFromRemote", rawMode, rawData, formId, fromRemote);

        function checkForUpdate(form) {
            log.d("Form: checkForUpdate", rawMode, rawData, formId, fromRemote);
            form.refresh(false, function(err, obj) {
                if (err) {
                    log.e("Error refreshing form from local: ", err);
                }
                if (forms.isFormUpdated(form)) {
                    form.refresh(true, function(err, obj1) {
                        if (err) {
                            return cb(err, null);
                        }
                        form.initialise();

                        _forms[formId] = obj1;
                        return cb(err, obj1);
                    });
                } else {
                    form.initialise();
                    _forms[formId] = obj;
                    cb(err, obj);
                }
            });
        }

        if (_forms[formId]) {
            log.d("Form: loaded from cache", rawMode, rawData, formId, fromRemote);
            //found form object in mem return it.
            if (!forms.isFormUpdated(_forms[formId])) {
                cb(null, _forms[formId]);
                return _forms[formId];
            }
        }

        checkForUpdate(that);
    }

    //Raw mode is for avoiding interaction with the mbaas
    if (rawMode === true) {
        loadFromLocal();
    } else {
        loadFromRemote();
    }
}

utils.extend(Form, Model);

Form.prototype.getLastUpdate = function() {
    log.d("Form: getLastUpdate");
    return this.get('lastUpdatedTimestamp');
};
/**
 * Initiliase form json to objects
 * @return {[type]} [description]
 */
Form.prototype.initialise = function() {
    this.filterAdminFields();
    this.initialisePage();
    this.initialiseFields();
};
/**
 * Admin fields should not be part of the form.
 */
Form.prototype.filterAdminFields = function() {
    var pages = this.getPagesDef();

    pages = _.map(pages, function(page){
        var pageFields = page.fields;
        page.fields = _.filter(pageFields, function(field) {
            return !field.adminOnly;
        });

        if (!page.fields) {
            return null;
        }

        return page;
    });

    //Removing unnecessary pages.
    pages = _.compact(pages);

    this.set("pages", pages);
    this.buildFieldRef();
};

Form.prototype.buildFieldRef = function() {
    var pages = this.getPagesDef();
    var newFieldRef = {};
    var pageRef = {};

    _.each(pages, function(page, pageIndex) {
        pageRef[page._id] = pageIndex;
        var fields = _.each(page.fields, function(field, fieldIndex) {
            newFieldRef[field._id] = {
                page: pageIndex,
                field: fieldIndex
            };
        });
    });

    this.set('pageRef', pageRef);
    this.set("fieldRef", newFieldRef);
};

Form.prototype.initialiseFields = function() {
    log.d("Form: initialiseFields");
    var fieldsRef = this.getFieldRef();
    this.fields = {};
    for (var fieldId in fieldsRef) {
        var fieldRef = fieldsRef[fieldId];
        var pageIndex = fieldRef.page;
        var fieldIndex = fieldRef.field;
        if (pageIndex === undefined || fieldIndex === undefined) {
            throw 'Corruptted field reference';
        }
        var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
        if (fieldDef) {
            this.fields[fieldId] = new Field(fieldDef, this);
        } else {
            throw 'Field def is not found.';
        }
    }
};
Form.prototype.initialisePage = function() {
    log.d("Form: initialisePage");
    var pages = this.getPagesDef();
    this.pages = [];
    for (var i = 0; i < pages.length; i++) {
        var pageDef = pages[i];
        var pageModel = new Page(pageDef, this);
        this.pages.push(pageModel);
    }
};
Form.prototype.getPageNumberByFieldId = function(fieldId) {
    if (fieldId) {
        return this.getFieldRef()[fieldId].page;
    } else {
        return null;
    }
};
Form.prototype.getPageModelList = function() {
    return this.pages;
};
Form.prototype.getName = function() {
    return this.get('name', '');
};
Form.prototype.getDescription = function() {
    return this.get('description', '');
};
Form.prototype.getFieldRef = function() {
    return this.get('fieldRef', {});
};
Form.prototype.getPagesDef = function() {
    return this.get('pages', []);
};
Form.prototype.getPageRef = function() {
    return this.get('pageRef', {});
};
Form.prototype.getFieldModelById = function(fieldId) {
    return this.fields[fieldId];
};
/**
 * Finding a field model by the Field Code specified in the studio if it exists
 * Otherwise return null;
 * @param code - The code of the field that is being searched for
 */
Form.prototype.getFieldModelByCode = function(code) {
    var self = this;
    if (!code || typeof(code) !== "string") {
        return null;
    }

    for (var fieldId in self.fields) {
        var field = self.fields[fieldId];
        if (field.getCode() !== null && field.getCode() === code) {
            return field;
        }
    }

    return null;
};
Form.prototype.getFieldDefByIndex = function(pageIndex, fieldIndex) {
    log.d("Form: getFieldDefByIndex: ", pageIndex, fieldIndex);
    var pages = this.getPagesDef();
    var page = pages[pageIndex];
    if (page) {
        var fields = page.fields ? page.fields : [];
        var field = fields[fieldIndex];
        if (field) {
            return field;
        }
    }
    log.e("Form: getFieldDefByIndex: No field found for page and field index: ", pageIndex, fieldIndex);
    return null;
};
Form.prototype.getPageModelById = function(pageId) {
    log.d("Form: getPageModelById: ", pageId);
    var index = this.getPageRef()[pageId];
    if (typeof index === 'undefined') {
        log.e('page id is not found in pageRef: ' + pageId);
    } else {
        return this.pages[index];
    }
};
Form.prototype.newSubmission = function() {
    log.d("Form: newSubmission");
    return submission.newInstance(this);
};
Form.prototype.getFormId = function() {
    return this.get('_id');
};
Form.prototype.removeFromCache = function() {
    log.d("Form: removeFromCache");
    if (_forms[this.getFormId()]) {
        delete _forms[this.getFormId()];
    }
};
Form.prototype.getFileFieldsId = function() {
    log.d("Form: getFileFieldsId");
    var fieldsId = [];
    for (var fieldId in this.fields) {
        var field = this.fields[fieldId];
        if (field.getType() === 'file' || field.getType() === 'photo' || field.getType() === 'signature') {
            fieldsId.push(fieldId);
        }
    }
    return fieldsId;
};

Form.prototype.getRuleEngine = function() {
    log.d("Form: getRuleEngine");
    var formDefinition = this.getProps();
    return new RulesEngine(formDefinition);
};


module.exports = Form;
},{"./field":50,"./forms":66,"./log":68,"./model":69,"./page":70,"./rulesEngine":71,"./submission":74,"./utils":78,"underscore":47}],62:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");

function FormSubmission(submissionJSON) {
    Model.call(this, {
        '_type': 'formSubmission',
        'data': submissionJSON
    });
}

utils.extend(FormSubmission, Model);

FormSubmission.prototype.getProps = function() {
    return this.get('data');
};
FormSubmission.prototype.getFormId = function() {
    if (!this.get('data')) {
        log.e("No form data for form submission");
    }

    return this.get('data').formId;
};

module.exports = FormSubmission;
},{"./config":48,"./log":68,"./model":69,"./utils":78}],63:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");

function FormSubmissionComplete(submissionTask) {
    Model.call(this, {
        '_type': 'completeSubmission',
        'submissionId': submissionTask.get('submissionId'),
        'localSubmissionId': submissionTask.get('localSubmissionId')
    });
}

utils.extend(FormSubmissionComplete, Model);

module.exports = FormSubmissionComplete;
},{"./config":48,"./log":68,"./model":69,"./utils":78}],64:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");

function FormSubmissionDownload(uploadTask) {
    Model.call(this, {
        '_type': 'formSubmissionDownload',
        'data': uploadTask
    });
}
FormSubmissionDownload.prototype.getSubmissionId = function() {
    return this.get('data').get("submissionId", "not-set");
};

utils.extend(FormSubmissionDownload, Model);

module.exports = FormSubmissionDownload;
},{"./config":48,"./log":68,"./model":69,"./utils":78}],65:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");

function FormSubmissionStatus(submissionTask) {
    Model.call(this, {
        '_type': 'submissionStatus',
        'submissionId': submissionTask.get('submissionId'),
        'localSubmissionId': submissionTask.get('localSubmissionId')
    });
}

utils.extend(FormSubmissionStatus, Model);

module.exports = FormSubmissionStatus;
},{"./config":48,"./log":68,"./model":69,"./utils":78}],66:[function(require,module,exports){
var Model = require("./model");
var utils = require("./utils");
var log = require("./log");

var forms;

function Forms() {
    Model.call(this, {
        '_type': 'forms',
        '_ludid': 'forms_list',
        'loaded': false
    });
}

utils.extend(Forms, Model);

Forms.prototype.isFormUpdated = function(formModel) {
    var id = formModel.get('_id');
    var formLastUpdate = formModel.getLastUpdate();
    var formMeta = this.getFormMetaById(id);
    if (formMeta) {
        return formLastUpdate !== formMeta.lastUpdatedTimestamp;
    } else {
        //could have been deleted. leave it for now
        return false;
    }
};
Forms.prototype.setLocalId = function() {
    log.e("Forms setLocalId. Not Permitted for Forms.prototype.");
};
Forms.prototype.getFormMetaById = function(formId) {
    log.d("Forms getFormMetaById ", formId);
    var forms = this.getFormsList();
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        if (form._id === formId) {
            return form;
        }
    }
    log.e("Forms getFormMetaById: No form found for id: ", formId);
    return null;
};
Forms.prototype.size = function() {
    return this.get('forms').length;
};
Forms.prototype.getFormsList = function() {
    return this.get('forms', []);
};
Forms.prototype.getFormIdByIndex = function(index) {
    log.d("Forms getFormIdByIndex: ", index);
    return this.getFormsList()[index]._id;
};


module.exports = new Forms();

},{"./log":68,"./model":69,"./utils":78}],67:[function(require,module,exports){
/**
 * Local storage stores a model's json definition persistently.
 */
var utils = require("./utils.js");
var Store = require("./store.js");
var fileSystem = require("./fileSystem.js");
var Lawnchair = require("../libs/lawnchair.js");
var localStorage, localStorageLawnchair;

var _fileSystemAvailable = function() {
    return fileSystem.isFileSystemAvailable();
};

//placeholder
function LocalStorage() {
    Store.call(this, 'LocalStorage');
}

LocalStorage.prototype.getLawnchairAdapter = function(cb) {
    Lawnchair({
        fail: onFail,
        adapter: require("./config.js").getStorageStrategy()
    }, function() {
        return cb(null, this);
    });
};

utils.extend(LocalStorage, Store);

//store a model to local storage
LocalStorage.prototype.create = function(model, cb) {
    var key = model.getLocalId();
    this.update(model, cb);
};

//read a model from local storage
LocalStorage.prototype.read = function(model, cb) {
    if (typeof(model) === "object") {
        if (model.get("_type") === "offlineTest") {
            return cb(null, {});
        }
    }

    var key = _getKey(model);
    if (key !== null) {
        _fhData({
            'act': 'load',
            'key': key.toString()
        }, cb, cb);
    } else {
        //model does not exist in local storage if key is null.
        cb(null, null);
    }
};
//update a model
LocalStorage.prototype.update = function(model, cb) {
    var key = _getKey(model);
    var data = model.getProps();
    var dataStr = JSON.stringify(data);
    _fhData({
        'act': 'save',
        'key': key.toString(),
        'val': dataStr
    }, cb, cb);
};
//delete a model
LocalStorage.prototype.removeEntry = function(model, cb) {
    var key = _getKey(model);
    _fhData({
        'act': 'remove',
        'key': key.toString()
    }, cb, cb);
};
LocalStorage.prototype.upsert = function(model, cb) {
    var key = _getKey(model);
    if (key === null) {
        this.create(model, cb);
    } else {
        this.update(model, cb);
    }
};
LocalStorage.prototype.switchFileSystem = function(isOn) {
    _fileSystemAvailable = function() {
        return isOn;
    };
};
LocalStorage.prototype.defaultStorage = function() {
    _fileSystemAvailable = function() {
        return fileSystem.isFileSystemAvailable();
    };
};
LocalStorage.prototype.saveFile = function(fileName, fileToSave, cb) {
    if (!_fileSystemAvailable()) {
        return cb("File system not available");
    }

    _fhData({
        'act': 'save',
        'key': fileName,
        'val': fileToSave
    }, cb, cb);
};
LocalStorage.prototype.updateTextFile = function(key, dataStr, cb) {
    _fhData({
        'act': 'save',
        'key': key,
        'val': dataStr
    }, cb, cb);
};
LocalStorage.prototype.readFile = function(fileName, cb) {
    _fhData({
        'act': 'loadFile',
        'key': fileName
    }, cb, cb);
};
LocalStorage.prototype.readFileText = function(fileName, cb) {
    _fhData({
        'act': 'load',
        'key': fileName
    }, cb, cb);
};

function _getKey(key) {
    return typeof(key.getLocalId) === "function" ? key.getLocalId() : key;
}
//use different local storage model according to environment
function _fhData() {
    if (_fileSystemAvailable()) {
        _fhFileData.apply({}, arguments);
    } else {
        _fhLSData.apply({}, arguments);
    }
}
//use $fh data -- TODO, this should not be an option.
function _fhLSData(options, success, failure) {
    //allow for no $fh api in studio
    if (!$fh || !$fh.data) {
        return success();
    }

    $fh.data(options, function(res) {
        if (typeof res === 'undefined') {
            res = {
                key: options.key,
                val: options.val
            };
        }
        //unify the interfaces
        if (options.act.toLowerCase() === 'remove') {
            return success(null, null);
        }
        success(null, res.val ? res.val : null);
    }, failure);
}
//use file system
function _fhFileData(options, success, failure) {
    function fail(msg) {
        if (typeof failure !== 'undefined') {
            return failure(msg, {});
        } else {}
    }

    function filenameForKey(key, cb) {
        var appid = require("./config.js").get("appId", "unknownAppId");
        key = key + appid;
        utils.md5(key, function(err, hash) {
            if (err) {
                hash = key;
            }

            var filename = hash;

            if (key.indexOf("filePlaceHolder") === -1) {
                filename += ".txt";
            }

            if (typeof navigator.externalstorage !== 'undefined') {
                navigator.externalstorage.enable(function handleSuccess(res) {
                    var path = filename;
                    if (res.path) {
                        path = res.path;
                        if (!path.match(/\/$/)) {
                            path += '/';
                        }
                        path += filename;
                    }
                    filename = path;
                    return cb(filename);
                }, function handleError(err) {
                    return cb(filename);
                });
            } else {
                return cb(filename);
            }
        });
    }

    function save(key, value) {
        filenameForKey(key, function(hash) {
            fileSystem.save(hash, value, function(err, res) {
                if (err) {
                    fail(err);
                } else {
                    success(null, value);
                }
            });
        });
    }

    function remove(key) {
        filenameForKey(key, function(hash) {
            fileSystem.remove(hash, function(err) {
                if (err) {
                    if (err.name === 'NotFoundError' || err.code === 1) {
                        //same respons of $fh.data if key not found.
                        success(null, null);
                    } else {
                        fail(err);
                    }
                } else {
                    success(null, null);
                }
            });
        });
    }

    function load(key) {
        filenameForKey(key, function(hash) {
            fileSystem.readAsText(hash, function(err, text) {
                if (err) {
                    if (err.name === 'NotFoundError' || err.code === 1) {
                        //same respons of $fh.data if key not found.
                        success(null, null);
                    } else {
                        fail(err);
                    }
                } else {
                    success(null, text);
                }
            });
        });
    }

    function loadFile(key) {
        filenameForKey(key, function(hash) {
            fileSystem.readAsFile(hash, function(err, file) {
                if (err) {
                    if (err.name === 'NotFoundError' || err.code === 1) {
                        //same respons of $fh.data if key not found.
                        success(null, null);
                    } else {
                        fail(err);
                    }
                } else {
                    success(null, file);
                }
            });
        });
    }

    if (typeof options.act === 'undefined') {
        return load(options.key);
    } else if (options.act === 'save') {
        return save(options.key, options.val);
    } else if (options.act === 'remove') {
        return remove(options.key);
    } else if (options.act === 'load') {
        return load(options.key);
    } else if (options.act === 'loadFile') {
        return loadFile(options.key);
    } else {
        if (typeof failure !== 'undefined') {
            return failure('Action [' + options.act + '] is not defined', {});
        }
    }
}

module.exports = function() {
    if (!localStorage) {
        localStorage = new LocalStorage();
    }

    return localStorage;
}();
},{"../libs/lawnchair.js":5,"./config.js":48,"./fileSystem.js":60,"./store.js":72,"./utils.js":78}],68:[function(require,module,exports){
/**
 * Async log module
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */

var utils = require("./utils");
var localStorage = require('./localStorage');
var currentLog;

var Log = {
    logs: [],
    isWriting: false,
    moreToWrite: false
};

Log.info = function(logLevel, msgs) {
    var args = Array.prototype.slice.call(arguments, 0);

    var self = this;
    if (require("./config").get("logger") === true) {
        var levelString = "";
        var curLevel = require("./config").get("log_level");
        var log_levels = require("./config").get("log_levels");

        if (typeof logLevel === "string") {
            levelString = logLevel;
            logLevel = log_levels.indexOf(logLevel.toLowerCase());
        } else {
            logLevel = 0;
        }

        curLevel = isNaN(parseInt(curLevel, 10)) ? curLevel : parseInt(curLevel, 10);
        logLevel = isNaN(parseInt(logLevel, 10)) ? logLevel : parseInt(logLevel, 10);

        if (curLevel < logLevel) {
            return;
        } else {

            var logs = self.getLogs();
            args.shift();
            var logStr = "";
            while (args.length > 0) {
                logStr += JSON.stringify(args.shift()) + " ";
            }
            logs.push(self.wrap(logStr, levelString));
            if (logs.length > require("./config").get("log_line_limit")) {
                logs.shift();
            }
            if (self.isWriting) {
                self.moreToWrite = true;
            } else {
                var _recursiveHandler = function() {
                    if (self.moreToWrite) {
                        self.moreToWrite = false;
                        self.write(_recursiveHandler);
                    }
                };
                self.write(_recursiveHandler);
            }
        }
    }
};
Log.wrap = function(msg, levelString) {
    var now = new Date();
    var dateStr = now.toISOString();
    if (typeof msg === "object") {
        msg = JSON.stringify(msg);
    }
    var finalMsg = dateStr + " " + levelString.toUpperCase() + " " + msg;
    return finalMsg;
};

Log.write = function(cb) {
    var self = this;
    self.isWriting = true;
    self.saveLocal(function() {
        self.isWriting = false;
        cb();
    });
};
Log.e = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("error");
    this.info.apply(this, args);
};
Log.w = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("warning");
    this.info.apply(this, args);
};
Log.l = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("log");
    this.info.apply(this, args);
};
Log.d = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    this.info("debug", args);
};
Log.getLogs = function() {
    return this.logs || [];
};
Log.clearLogs = function(cb) {
    this.logs = [];
    this.saveLocal(function() {
        if (cb) {
            cb();
        }
    });
};
Log.saveLocal = function(cb) {
    localStorage.upsert(this, cb);
};
Log.sendLogs = function(cb) {
    var email = require("./config").get("log_email");
    var configJSON = require("./config").getProps();
    var logs = this.getLogs();
    var params = {
        "type": "email",
        "to": email,
        "subject": "App Forms App Logs",
        "body": "Configuration:\n" + JSON.stringify(configJSON) + "\n\nApp Logs:\n" + logs.join("\n")
    };
    utils.send(params, cb);
};

Log.getLocalId = function() {
    return "formsLogs";
};

Log.getProps = function() {
    return this.logs || [];
};

module.exports = Log;

},{"./config":48,"./localStorage":67,"./utils":78}],69:[function(require,module,exports){
var Event = require('eventemitter2').EventEmitter2;
var utils = require("./utils");
var localStorage = require("./localStorage");
var dataAgent = require("./dataAgent");
var _ = require('underscore');

var Model = function(options) {
    this.props = options || {
        '_type': 'model'
    };
    this.touch();
};

utils.extend(Model, Event);

Model.prototype.getProps = function() {
    this.props = this.props || {};
    return this.props;
};
Model.prototype.get = function(key, def) {
    return typeof this.props[key] === 'undefined' ? def : this.props[key];
};
Model.prototype.getType = function() {
    return this.get('_type');
};
Model.prototype.setType = function(type) {
    return this.set('_type', type);
};
Model.prototype.set = function(key, val) {
    if(!this.props){
        this.props = {};
    }
    if (key && val !== null) {
        this.props[key] = val;
    }
};
Model.prototype.setLocalId = function(localId) {
    this.set('_ludid', localId || this.getLocalId());
};
Model.prototype.getLocalId = function() {
    var localId = this.get('_ludid', utils.localId(this));
    this.setLocalId(localId);
    return localId;
};
Model.prototype.getRemoteId = function() {
    return this.get('_id');
};
Model.prototype.setRemoteId = function(remoteId) {
    return this.set('_id', remoteId);
};
Model.prototype.toJSON = function() {
    var retJSON = {};
    for (var key in this.props) {
        retJSON[key] = this.props[key];
    }
    return retJSON;
};
Model.prototype.fromJSON = function(json) {
    var self = this;
    if (typeof json === 'string') {
        this.fromJSONStr(json);
    } else {
        _.extend(self.getProps(), json);
    }
    this.touch();
};
Model.prototype.fromJSONStr = function(jsonStr) {
    try {
        var json = JSON.parse(jsonStr);
        this.fromJSON(json);
    } catch (e) {
        console.error("Error parsing JSON", e);
    }
};

Model.prototype.touch = function() {
    this.set('_localLastUpdate', utils.getTime());
};
Model.prototype.getLocalUpdateTimeStamp = function() {
    return this.get('_localLastUpdate');
};
// *
//  * retrieve model from local or remote with data agent store.
//  * @param {boolean} fromRemote optional true--force from remote
//  * @param  {Function} cb (err,currentModel)
//  * @return {[type]}      [description]

Model.prototype.refresh = function(fromRemote, cb) {
    var that = this;
    if (typeof cb === 'undefined') {
        cb = fromRemote;
        fromRemote = false;
    }
    if (fromRemote) {
        dataAgent.attemptRead(this, _handler);
    } else {
        dataAgent.read(this, _handler);
    }

    function _handler(err, res) {
        if (!err && res) {
            that.fromJSON(res);
            cb(null, that);
        } else {
            cb(err, that);
        }
    }
};
Model.prototype.attemptRefresh = function(cb) {
    var self = this;
    dataAgent.attemptRead(this, function(err, res) {
        if (!err && res) {
            self.fromJSON(res);
            cb(null, self);
        } else {
            cb(err, self);
        }
    });
};
/**
 * Retrieve model from local storage store
 * @param  {Function} cb (err, curModel)
 * @return {[type]}      [description]
 */
Model.prototype.loadLocal = function(cb) {
    var that = this;
    localStorage.read(this, function(err, res) {
        if (err) {
            cb(err);
        } else {
            if (res) {
                that.fromJSON(res);
            }
            cb(err, that);
        }
    });
};
/**
 * save current model to local storage store
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
Model.prototype.saveLocal = function(cb) {
    localStorage.upsert(this, cb);
};
/**
 * Remove current model from local storage store
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
Model.prototype.clearLocal = function(cb) {
    localStorage.removeEntry(this, cb);
};

module.exports = Model;

},{"./dataAgent":49,"./localStorage":67,"./utils":78,"eventemitter2":44,"underscore":47}],70:[function(require,module,exports){
/**
 * One form contains multiple pages
 */
var log = require("./log");
var config = require("./config");
var Model = require("./model");
var utils = require("./utils");
var _ = require('underscore');

function Page(opt, parentForm) {
    if (typeof opt === 'undefined' || typeof parentForm === 'undefined') {
        log.e('Page initialise failed: new Page(pageDefinitionJSON, parentFormModel)');
        return;
    }

    this.setType('page');
    this.fromJSON(opt);
    this.form = parentForm;
    this.initialise();
}

utils.extend(Page, Model);

Page.prototype.initialise = function() {
    var fieldsDef = this.getFieldDef();
    this.fieldsIds = _.map(fieldsDef, function(fieldDef){
        return fieldDef._id;  
    });
};
Page.prototype.setVisible = function(isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
        this.emit('visible');
    } else {
        this.emit('hidden');
    }
};
Page.prototype.getFieldDef = function() {
    return this.get("fields", []);
};

Page.prototype.getFieldModelList = function() {
    var self = this;
    var list = _.map(this.fieldsIds, function(fieldId){
        return self.form.getFieldModelById(fieldId);
    });
    return list;
};
Page.prototype.checkForSectionBreaks = function() { //Checking for any sections

    for (var i = 0; i < this.fieldsIds.length; i++) {
        var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);
        if (fieldModel && fieldModel.getType() === "sectionBreak") {
            return true;
        }
    }
    return false;
};
Page.prototype.getSections = function() { //Checking for any sections
    var sectionList = {};
    var currentSection = null;
    var sectionBreaksExist = this.checkForSectionBreaks();
    var insertSectionBreak = false;

    if (sectionBreaksExist) {
        //If there are section breaks, the first field in the form must be a section break. If not, add a placeholder
        var firstField = this.form.getFieldModelById(this.fieldsIds[0]);

        if (firstField.getType() !== "sectionBreak") {
            insertSectionBreak = true;
        }
    } else {
        return null;
    }

    for (var i = 0; i < this.fieldsIds.length; i++) {
        var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);

        if (insertSectionBreak && i === 0) { //Adding a first section.
            currentSection = "sectionBreak" + i;
            sectionList[currentSection] = sectionList[currentSection] ? sectionList[currentSection] : {
                fields: []
            };
            sectionList[currentSection].title = "Section " + (i + 1);
        }

        if (currentSection !== null && fieldModel.getType() !== "sectionBreak") {
            sectionList[currentSection].fields.push(fieldModel);
        }

        if (fieldModel.getType() === "sectionBreak") {
            currentSection = "sectionBreak" + i;
            sectionList[currentSection] = sectionList[currentSection] ? sectionList[currentSection] : {
                fields: []
            };
            sectionList[currentSection].title = fieldModel.get('name', "Section " + (i + 1));
            sectionList[currentSection].fields.push(fieldModel);
        }
    }

    return sectionList;
};
Page.prototype.getFieldModelById = function(fieldId) {
    return this.form.getFieldModelById(fieldId);
};
Page.prototype.getPageId = function() {
    return this.get("_id", "");
};
Page.prototype.getFieldIds = function() {
    return this.fieldsIds;
};
Page.prototype.getName = function() {
    return this.get('name', '');
};
Page.prototype.getDescription = function() {
    return this.get('description', '');
};

module.exports = Page;

},{"./config":48,"./log":68,"./model":69,"./utils":78,"underscore":47}],71:[function(require,module,exports){
/*! fh-forms - v0.8.00 -  */
/*! async - v0.2.9 -  */
/*! 2014-08-27 */
/* This is the prefix file */

var async = require('async');
var _ = require('underscore');

function rulesEngine(formDef) {
    /*
     * Sample Usage
     *
     * var engine = formsRulesEngine(form-definition);
     *
     * engine.validateForms(form-submission, function(err, res) {});
     *      res:
     *      {
     *          "validation": {
     *              "fieldId": {
     *                  "fieldId": "",
     *                  "valid": true,
     *                  "errorMessages": [
     *                      "length should be 3 to 5",
     *                      "should not contain dammit",
     *                      "should repeat at least 2 times"
     *                  ]
     *              },
     *              "fieldId1": {
     *
     *              }
     *          }
     *      }
     *
     *
     * engine.validateField(fieldId, submissionJSON, function(err,res) {});
     *      // validate only field values on validation (no rules, no repeat checking)
     *      res:
     *      "validation":{
     *              "fieldId":{
     *                  "fieldId":"",
     *                  "valid":true,
     *                  "errorMessages":[
     *                      "length should be 3 to 5",
     *                      "should not contain dammit"
     *                  ]
     *              }
     *          }
     *
     * engine.checkRules(submissionJSON, unction(err, res) {})
     *      // check all rules actions
     *      res:
     *      {
     *          "actions": {
     *              "pages": {
     *                  "targetId": {
     *                      "targetId": "",
     *                      "action": "show|hide"
     *                  }
     *              },
     *              "fields": {
     *
     *              }
     *          }
     *      }
     *
     */

    var FIELD_TYPE_CHECKBOX = "checkboxes";
    var FIELD_TYPE_DATETIME = "dateTime";
    var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY = "date";
    var FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY = "time";
    var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME = "datetime";

    var formsRulesEngine = function(formDef) {
        var initialised;

        var definition = formDef;
        var submission;

        var fieldMap = {};
        var adminFieldMap = {}; //Admin fields should not be part of a submission
        var requiredFieldMap = {};
        var submissionRequiredFieldsMap = {}; // map to hold the status of the required fields per submission
        var fieldRulePredicateMap = {};
        var fieldRuleSubjectMap = {};
        var pageRulePredicateMap = {};
        var pageRuleSubjectMap = {};
        var submissionFieldsMap = {};
        var validatorsMap = {
            "text": validatorString,
            "textarea": validatorString,
            "number": validatorNumericString,
            "emailAddress": validatorEmail,
            "dropdown": validatorDropDown,
            "radio": validatorDropDown,
            "checkboxes": validatorCheckboxes,
            "location": validatorLocation,
            "locationMap": validatorLocationMap,
            "photo": validatorFile,
            "signature": validatorFile,
            "file": validatorFile,
            "dateTime": validatorDateTime,
            "url": validatorString,
            "sectionBreak": validatorSection
        };

        var validatorsClientMap = {
            "text": validatorString,
            "textarea": validatorString,
            "number": validatorNumericString,
            "emailAddress": validatorEmail,
            "dropdown": validatorDropDown,
            "radio": validatorDropDown,
            "checkboxes": validatorCheckboxes,
            "location": validatorLocation,
            "locationMap": validatorLocationMap,
            "photo": validatorAnyFile,
            "signature": validatorAnyFile,
            "file": validatorAnyFile,
            "dateTime": validatorDateTime,
            "url": validatorString,
            "sectionBreak": validatorSection
        };

        var isFieldRuleSubject = function(fieldId) {
            return !!fieldRuleSubjectMap[fieldId];
        };

        var isPageRuleSubject = function(pageId) {
            return !!pageRuleSubjectMap[pageId];
        };

        function buildFieldMap(cb) {
            // Iterate over all fields in form definition & build fieldMap
            async.each(definition.pages, function(page, cbPages) {
                async.each(page.fields, function(field, cbFields) {
                    field.pageId = page._id;

                    /**
                     * If the field is an admin field, then it is not considered part of validation for a submission.
                     */
                    if (field.adminOnly) {
                        adminFieldMap[field._id] = field;
                        return cbFields();
                    }

                    field.fieldOptions = field.fieldOptions ? field.fieldOptions : {};
                    field.fieldOptions.definition = field.fieldOptions.definition ? field.fieldOptions.definition : {};
                    field.fieldOptions.validation = field.fieldOptions.validation ? field.fieldOptions.validation : {};

                    fieldMap[field._id] = field;
                    if (field.required) {
                        requiredFieldMap[field._id] = {
                            field: field,
                            submitted: false,
                            validated: false
                        };
                    }
                    return cbFields();
                }, function() {
                    return cbPages();
                });
            }, cb);
        }

        function buildFieldRuleMaps(cb) {
            // Iterate over all rules in form definition & build ruleSubjectMap
            async.each(definition.fieldRules, function(rule, cbRules) {
                async.each(rule.ruleConditionalStatements, function(ruleConditionalStatement, cbRuleConditionalStatements) {
                    var fieldId = ruleConditionalStatement.sourceField;
                    fieldRulePredicateMap[fieldId] = fieldRulePredicateMap[fieldId] || [];
                    fieldRulePredicateMap[fieldId].push(rule);
                    return cbRuleConditionalStatements();
                }, function() {

                    /**
                     * Target fields are an array of fieldIds that can be targeted by a field rule
                     * To maintain backwards compatibility, the case where the targetPage is not an array has to be considered
                     * @type {*|Array}
                     */
                    if (Array.isArray(rule.targetField)) {
                        async.each(rule.targetField, function(targetField, cb) {
                            fieldRuleSubjectMap[targetField] = fieldRuleSubjectMap[targetField] || [];
                            fieldRuleSubjectMap[targetField].push(rule);
                            cb();
                        }, cbRules);
                    } else {
                        fieldRuleSubjectMap[rule.targetField] = fieldRuleSubjectMap[rule.targetField] || [];
                        fieldRuleSubjectMap[rule.targetField].push(rule);
                        return cbRules();
                    }
                });
            }, cb);
        }

        function buildPageRuleMap(cb) {
            // Iterate over all rules in form definition & build ruleSubjectMap
            async.each(definition.pageRules, function(rule, cbRules) {
                async.each(rule.ruleConditionalStatements, function(ruleConditionalStatement, cbRulePredicates) {
                    var fieldId = ruleConditionalStatement.sourceField;
                    pageRulePredicateMap[fieldId] = pageRulePredicateMap[fieldId] || [];
                    pageRulePredicateMap[fieldId].push(rule);
                    return cbRulePredicates();
                }, function() {

                    /**
                     * Target pages are an array of pageIds that can be targeted by a page rule
                     * To maintain backwards compatibility, the case where the targetPage is not an array has to be considered
                     * @type {*|Array}
                     */
                    if (Array.isArray(rule.targetPage)) {
                        async.each(rule.targetPage, function(targetPage, cb) {
                            pageRuleSubjectMap[targetPage] = pageRuleSubjectMap[targetPage] || [];
                            pageRuleSubjectMap[targetPage].push(rule);
                            cb();
                        }, cbRules);
                    } else {
                        pageRuleSubjectMap[rule.targetPage] = pageRuleSubjectMap[rule.targetPage] || [];
                        pageRuleSubjectMap[rule.targetPage].push(rule);
                        return cbRules();
                    }
                });
            }, cb);
        }

        function buildSubmissionFieldsMap(cb) {
            submissionRequiredFieldsMap = JSON.parse(JSON.stringify(requiredFieldMap)); // clone the map for use with this submission
            submissionFieldsMap = {}; // start with empty map, rulesEngine can be called with multiple submissions

            // iterate over all the fields in the submissions and build a map for easier lookup
            async.each(submission.formFields, function(formField, cb) {
                if (!formField.fieldId) return cb(new Error("No fieldId in this submission entry: " + util.inspect(formField)));

                /**
                 * If the field passed in a submission is an admin field, then return an error.
                 */
                if (adminFieldMap[formField.fieldId]) {
                    return cb("Submission " + formField.fieldId + " is an admin field. Admin fields cannot be passed to the rules engine.");
                }

                submissionFieldsMap[formField.fieldId] = formField;
                return cb();
            }, cb);
        }

        function init(cb) {
            if (initialised) return cb();
            async.parallel([
                buildFieldMap,
                buildFieldRuleMaps,
                buildPageRuleMap
            ], function(err) {
                if (err) return cb(err);
                initialised = true;
                return cb();
            });
        }

        function initSubmission(formSubmission, cb) {
            init(function(err) {
                if (err) return cb(err);

                submission = formSubmission;
                buildSubmissionFieldsMap(cb);
            });
        }

        function getPreviousFieldValues(submittedField, previousSubmission, cb) {
            if (previousSubmission && previousSubmission.formFields) {
                async.filter(previousSubmission.formFields, function(formField, cb) {
                    return cb(formField.fieldId.toString() === submittedField.fieldId.toString());
                }, function(results) {
                    var previousFieldValues = null;
                    if (results && results[0] && results[0].fieldValues) {
                        previousFieldValues = results[0].fieldValues;
                    }
                    return cb(undefined, previousFieldValues);
                });
            } else {
                return cb();
            }
        }

        function validateForm(submission, previousSubmission, cb) {
            if ("function" === typeof previousSubmission) {
                cb = previousSubmission;
                previousSubmission = null;
            }
            init(function(err) {
                if (err) return cb(err);

                initSubmission(submission, function(err) {
                    if (err) return cb(err);

                    async.waterfall([

                        function(cb) {
                            return cb(undefined, {
                                validation: {
                                    valid: true
                                }
                            }); // any invalid fields will set this to false
                        },
                        function(res, cb) {
                            validateSubmittedFields(res, previousSubmission, cb);
                        },
                        checkIfRequiredFieldsNotSubmitted
                    ], function(err, results) {
                        if (err) return cb(err);

                        return cb(undefined, results);
                    });
                });
            });
        }

        function validateSubmittedFields(res, previousSubmission, cb) {
            // for each field, call validateField
            async.each(submission.formFields, function(submittedField, callback) {
                var fieldID = submittedField.fieldId;
                var fieldDef = fieldMap[fieldID];

                getPreviousFieldValues(submittedField, previousSubmission, function(err, previousFieldValues) {
                    if (err) return callback(err);
                    getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, function(err, fieldRes) {
                        if (err) return callback(err);

                        if (!fieldRes.valid) {
                            res.validation.valid = false; // indicate invalid form if any fields invalid
                            res.validation[fieldID] = fieldRes; // add invalid field info to validate form result
                        }

                        return callback();
                    });

                });
            }, function(err) {
                if (err) {
                    return cb(err);
                }
                return cb(undefined, res);
            });
        }

        function checkIfRequiredFieldsNotSubmitted(res, cb) {
            async.each(Object.keys(submissionRequiredFieldsMap), function(requiredFieldId, cb) {
                var resField = {};
                if (!submissionRequiredFieldsMap[requiredFieldId].submitted) {
                    isFieldVisible(requiredFieldId, true, function(err, visible) {
                        if (err) return cb(err);
                        if (visible) { // we only care about required fields if they are visible
                            resField.fieldId = requiredFieldId;
                            resField.valid = false;
                            resField.fieldErrorMessage = ["Required Field Not Submitted"];
                            res.validation[requiredFieldId] = resField;
                            res.validation.valid = false;
                        }
                        return cb();
                    });
                } else { // was included in submission
                    return cb();
                }
            }, function(err) {
                if (err) return cb(err);

                return cb(undefined, res);
            });
        }

        /*
         * validate only field values on validation (no rules, no repeat checking)
         *     res:
         *     "validation":{
         *             "fieldId":{
         *                 "fieldId":"",
         *                 "valid":true,
         *                 "errorMessages":[
         *                     "length should be 3 to 5",
         *                     "should not contain dammit"
         *                 ]
         *             }
         *         }
         */
        function validateField(fieldId, submission, cb) {
            init(function(err) {
                if (err) return cb(err);

                initSubmission(submission, function(err) {
                    if (err) return cb(err);

                    var submissionField = submissionFieldsMap[fieldId];
                    var fieldDef = fieldMap[fieldId];
                    getFieldValidationStatus(submissionField, fieldDef, null, function(err, res) {
                        if (err) return cb(err);
                        var ret = {
                            validation: {}
                        };
                        ret.validation[fieldId] = res;
                        return cb(undefined, ret);
                    });
                });
            });
        }

        /*
         * validate only single field value (no rules, no repeat checking)
         * cb(err, result)
         * example of result:
         * "validation":{
         *         "fieldId":{
         *             "fieldId":"",
         *             "valid":true,
         *             "errorMessages":[
         *                 "length should be 3 to 5",
         *                 "should not contain dammit"
         *             ]
         *         }
         *     }
         */
        function validateFieldValue(fieldId, inputValue, valueIndex, cb) {
            if ("function" === typeof valueIndex) {
                cb = valueIndex;
                valueIndex = 0;
            }

            init(function(err) {
                if (err) return cb(err);
                var fieldDefinition = fieldMap[fieldId];

                var required = false;
                if (fieldDefinition.repeating &&
                    fieldDefinition.fieldOptions &&
                    fieldDefinition.fieldOptions.definition &&
                    fieldDefinition.fieldOptions.definition.minRepeat) {
                    required = (valueIndex < fieldDefinition.fieldOptions.definition.minRepeat);
                } else {
                    required = fieldDefinition.required;
                }

                var validation = (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) ? fieldDefinition.fieldOptions.validation : undefined;

                if (validation && false === validation.validateImmediately) {
                    var ret = {
                        validation: {}
                    };
                    ret.validation[fieldId] = {
                        "valid": true
                    };
                    return cb(undefined, ret);
                }

                if (fieldEmpty(inputValue)) {
                    if (required) {
                        return formatResponse("No value specified for required input", cb);
                    } else {
                        return formatResponse(undefined, cb); // optional field not supplied is valid
                    }
                }

                // not empty need to validate
                getClientValidatorFunction(fieldDefinition.type, function(err, validator) {
                    if (err) return cb(err);

                    validator(inputValue, fieldDefinition, undefined, function(err) {
                        var message;
                        if (err) {
                            if (err.message) {
                                message = err.message;
                            } else {
                                message = "Unknown error message";
                            }
                        }
                        formatResponse(message, cb);
                    });
                });
            });

            function formatResponse(msg, cb) {
                var messages = {
                    errorMessages: []
                };
                if (msg) {
                    messages.errorMessages.push(msg);
                }
                return createValidatorResponse(fieldId, messages, function(err, res) {
                    if (err) return cb(err);
                    var ret = {
                        validation: {}
                    };
                    ret.validation[fieldId] = res;
                    return cb(undefined, ret);
                });
            }
        }

        function createValidatorResponse(fieldId, messages, cb) {
            // intentionally not checking err here, used further down to get validation errors
            var res = {};
            res.fieldId = fieldId;
            res.errorMessages = messages.errorMessages || [];
            res.fieldErrorMessage = messages.fieldErrorMessage || [];
            async.some(res.errorMessages, function(item, cb) {
                return cb(item !== null);
            }, function(someErrors) {
                res.valid = !someErrors && (res.fieldErrorMessage.length < 1);

                return cb(undefined, res);
            });
        }

        function getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, cb) {
            isFieldVisible(fieldDef._id, true, function(err, visible) {
                if (err) {
                    return cb(err);
                }
                validateFieldInternal(submittedField, fieldDef, previousFieldValues, visible, function(err, messages) {
                    if (err) return cb(err);
                    createValidatorResponse(submittedField.fieldId, messages, cb);
                });
            });
        }

        function getMapFunction(key, map, cb) {
            var validator = map[key];
            if (!validator) {
                return cb(new Error("Invalid Field Type " + key));
            }

            return cb(undefined, validator);
        }

        function getValidatorFunction(fieldType, cb) {
            return getMapFunction(fieldType, validatorsMap, cb);
        }

        function getClientValidatorFunction(fieldType, cb) {
            return getMapFunction(fieldType, validatorsClientMap, cb);
        }

        function fieldEmpty(fieldValue) {
            return ('undefined' === typeof fieldValue || null === fieldValue || "" === fieldValue); // empty string also regarded as not specified
        }

        function validateFieldInternal(submittedField, fieldDef, previousFieldValues, visible, cb) {
            previousFieldValues = previousFieldValues || null;
            countSubmittedValues(submittedField, function(err, numSubmittedValues) {
                if (err) return cb(err);
                async.series({
                    valuesSubmitted: async.apply(checkValueSubmitted, submittedField, fieldDef, visible),
                    repeats: async.apply(checkRepeat, numSubmittedValues, fieldDef, visible),
                    values: async.apply(checkValues, submittedField, fieldDef, previousFieldValues)
                }, function(err, results) {
                    if (err) return cb(err);

                    var fieldErrorMessages = [];
                    if (results.valuesSubmitted) {
                        fieldErrorMessages.push(results.valuesSubmitted);
                    }
                    if (results.repeats) {
                        fieldErrorMessages.push(results.repeats);
                    }
                    return cb(undefined, {
                        fieldErrorMessage: fieldErrorMessages,
                        errorMessages: results.values
                    });
                });
            });

            return; // just functions below this

            function checkValueSubmitted(submittedField, fieldDefinition, visible, cb) {
                if (!fieldDefinition.required) return cb(undefined, null);

                var valueSubmitted = submittedField && submittedField.fieldValues && (submittedField.fieldValues.length > 0);
                //No value submitted is only an error if the field is visible.
                if (!valueSubmitted && visible) {
                    return cb(undefined, "No value submitted for field " + fieldDefinition.name);
                }
                return cb(undefined, null);

            }

            function countSubmittedValues(submittedField, cb) {
                var numSubmittedValues = 0;
                if (submittedField && submittedField.fieldValues && submittedField.fieldValues.length > 0) {
                    for (var i = 0; i < submittedField.fieldValues.length; i += 1) {
                        if (submittedField.fieldValues[i]) {
                            numSubmittedValues += 1;
                        }
                    }
                }
                return cb(undefined, numSubmittedValues);
            }

            function checkRepeat(numSubmittedValues, fieldDefinition, visible, cb) {
                //If the field is not visible, then checking the repeating values of the field is not required
                if (!visible) {
                    return cb(undefined, null);
                }

                if (fieldDefinition.repeating && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.definition) {
                    if (fieldDefinition.fieldOptions.definition.minRepeat) {
                        if (numSubmittedValues < fieldDefinition.fieldOptions.definition.minRepeat) {
                            return cb(undefined, "Expected min of " + fieldDefinition.fieldOptions.definition.minRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
                        }
                    }

                    if (fieldDefinition.fieldOptions.definition.maxRepeat) {
                        if (numSubmittedValues > fieldDefinition.fieldOptions.definition.maxRepeat) {
                            return cb(undefined, "Expected max of " + fieldDefinition.fieldOptions.definition.maxRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
                        }
                    }
                } else {
                    if (numSubmittedValues > 1) {
                        return cb(undefined, "Should not have multiple values for non-repeating field");
                    }
                }

                return cb(undefined, null);
            }

            function checkValues(submittedField, fieldDefinition, previousFieldValues, cb) {
                getValidatorFunction(fieldDefinition.type, function(err, validator) {
                    if (err) return cb(err);
                    async.map(submittedField.fieldValues, function(fieldValue, cb) {
                        if (fieldEmpty(fieldValue)) {
                            return cb(undefined, null);
                        } else {
                            validator(fieldValue, fieldDefinition, previousFieldValues, function(validationError) {
                                var errorMessage;
                                if (validationError) {
                                    errorMessage = validationError.message || "Error during validation of field";
                                } else {
                                    errorMessage = null;
                                }

                                if (submissionRequiredFieldsMap[fieldDefinition._id]) { // set to true if at least one value
                                    submissionRequiredFieldsMap[fieldDefinition._id].submitted = true;
                                }

                                return cb(undefined, errorMessage);
                            });
                        }
                    }, function(err, results) {
                        if (err) return cb(err);

                        return cb(undefined, results);
                    });
                });
            }
        }

        function convertSimpleFormatToRegex(field_format_string) {
            var regex = "^";
            var C = "c".charCodeAt(0);
            var N = "n".charCodeAt(0);

            var i;
            var ch;
            var match;
            var len = field_format_string.length;
            for (i = 0; i < len; i += 1) {
                ch = field_format_string.charCodeAt(i);
                switch (ch) {
                    case C:
                        match = "[a-zA-Z0-9]";
                        break;
                    case N:
                        match = "[0-9]";
                        break;
                    default:
                        var num = ch.toString(16).toUpperCase();
                        match = "\\u" + ("0000" + num).substr(-4);
                        break;
                }
                regex += match;
            }
            return regex + "$";
        }

        function validFormatRegex(fieldValue, field_format_string) {
            var pattern = new RegExp(field_format_string);
            return pattern.test(fieldValue);
        }

        function validFormat(fieldValue, field_format_mode, field_format_string) {
            var regex;
            if ("simple" === field_format_mode) {
                regex = convertSimpleFormatToRegex(field_format_string);
            } else if ("regex" === field_format_mode) {
                regex = field_format_string;
            } else { // should never be anything else, but if it is then default to simple format
                regex = convertSimpleFormatToRegex(field_format_string);
            }

            return validFormatRegex(fieldValue, regex);
        }

        function validatorString(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (typeof fieldValue !== "string") {
                return cb(new Error("Expected string but got " + typeof(fieldValue)));
            }

            var validation = {};
            if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
                validation = fieldDefinition.fieldOptions.validation;
            }

            var field_format_mode = validation.field_format_mode || "";
            field_format_mode = field_format_mode.trim();
            var field_format_string = validation.field_format_string || "";
            field_format_string = field_format_string.trim();

            if (field_format_string && (field_format_string.length > 0) && field_format_mode && (field_format_mode.length > 0)) {
                if (!validFormat(fieldValue, field_format_mode, field_format_string)) {
                    return cb(new Error("field value in incorrect format, expected format: " + field_format_string + " but submission value is: " + fieldValue));
                }
            }

            if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min) {
                if (fieldValue.length < fieldDefinition.fieldOptions.validation.min) {
                    return cb(new Error("Expected minimum string length of " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
                }
            }

            if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.max) {
                if (fieldValue.length > fieldDefinition.fieldOptions.validation.max) {
                    return cb(new Error("Expected maximum string length of " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
                }
            }

            return cb();
        }

        function validatorNumericString(fieldValue, fieldDefinition, previousFieldValues, cb) {
            var testVal = (fieldValue - 0); // coerce to number (or NaN)
            /*jshint eqeqeq:false */
            var numeric = (testVal == fieldValue); // testVal co-erced to numeric above, so numeric comparison and NaN != NaN

            if (!numeric) {
                return cb(new Error("Expected numeric but got: " + fieldValue));
            }

            return validatorNumber(testVal, fieldDefinition, previousFieldValues, cb);
        }

        function validatorNumber(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (typeof fieldValue !== "number") {
                return cb(new Error("Expected number but got " + typeof(fieldValue)));
            }

            if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min) {
                if (fieldValue < fieldDefinition.fieldOptions.validation.min) {
                    return cb(new Error("Expected minimum Number " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
                }
            }

            if (fieldDefinition.fieldOptions.validation.max) {
                if (fieldValue > fieldDefinition.fieldOptions.validation.max) {
                    return cb(new Error("Expected maximum Number " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
                }
            }

            return cb();
        }

        function validatorEmail(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (typeof(fieldValue) !== "string") {
                return cb(new Error("Expected string but got " + typeof(fieldValue)));
            }

            if (fieldValue.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/g) === null) {
                return cb(new Error("Invalid email address format: " + fieldValue));
            } else {
                return cb();
            }
        }

        function validatorDropDown(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (typeof(fieldValue) !== "string") {
                return cb(new Error("Expected submission to be string but got " + typeof(fieldValue)));
            }

            //Check value exists in the field definition
            if (!fieldDefinition.fieldOptions.definition.options) {
                return cb(new Error("No options exist for field " + fieldDefinition.name));
            }

            async.some(fieldDefinition.fieldOptions.definition.options, function(dropdownOption, cb) {
                return cb(dropdownOption.label === fieldValue);
            }, function(found) {
                if (!found) {
                    return cb(new Error("Invalid option specified: " + fieldValue));
                } else {
                    return cb();
                }
            });
        }

        function validatorCheckboxes(fieldValue, fieldDefinition, previousFieldValues, cb) {
            var minVal;
            if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
                minVal = fieldDefinition.fieldOptions.validation.min;
            }
            var maxVal;
            if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
                maxVal = fieldDefinition.fieldOptions.validation.max;
            }

            if (minVal) {
                if (fieldValue.selections === null || fieldValue.selections === undefined || fieldValue.selections.length < minVal) {
                    var len;
                    if (fieldValue.selections) {
                        len = fieldValue.selections.length;
                    }
                    return cb(new Error("Expected a minimum number of selections " + minVal + " but got " + len));
                }
            }

            if (maxVal) {
                if (fieldValue.selections) {
                    if (fieldValue.selections.length > maxVal) {
                        return cb(new Error("Expected a maximum number of selections " + maxVal + " but got " + fieldValue.selections.length));
                    }
                }
            }

            var optionsInCheckbox = [];

            async.eachSeries(fieldDefinition.fieldOptions.definition.options, function(choice, cb) {
                for (var choiceName in choice) {
                    optionsInCheckbox.push(choice[choiceName]);
                }
                return cb();
            }, function() {
                async.eachSeries(fieldValue.selections, function(selection, cb) {
                    if (typeof(selection) !== "string") {
                        return cb(new Error("Expected checkbox submission to be string but got " + typeof(selection)));
                    }

                    if (optionsInCheckbox.indexOf(selection) === -1) {
                        return cb(new Error("Checkbox Option " + selection + " does not exist in the field."));
                    }

                    return cb();
                }, cb);
            });
        }

        function validatorLocationMap(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (fieldValue.lat && fieldValue["long"]) {
                if (isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
                    return cb(new Error("Invalid latitude and longitude values"));
                } else {
                    return cb();
                }
            } else {
                return cb(new Error("Invalid object for locationMap submission"));
            }
        }


        function validatorLocation(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (fieldDefinition.fieldOptions.definition.locationUnit === "latlong") {
                if (fieldValue.lat && fieldValue["long"]) {
                    if (isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
                        return cb(new Error("Invalid latitude and longitude values"));
                    } else {
                        return cb();
                    }
                } else {
                    return cb(new Error("Invalid object for latitude longitude submission"));
                }
            } else {
                if (fieldValue.zone && fieldValue.eastings && fieldValue.northings) {
                    //Zone must be 3 characters, eastings 6 and northings 9
                    return validateNorthingsEastings(fieldValue, cb);
                } else {
                    return cb(new Error("Invalid object for northings easting submission. Zone, Eastings and Northings elemets are required"));
                }
            }

            function validateNorthingsEastings(fieldValue, cb) {
                if (typeof(fieldValue.zone) !== "string" || fieldValue.zone.length === 0) {
                    return cb(new Error("Invalid zone definition for northings and eastings location. " + fieldValue.zone));
                }

                var east = parseInt(fieldValue.eastings, 10);
                if (isNaN(east)) {
                    return cb(new Error("Invalid eastings definition for northings and eastings location. " + fieldValue.eastings));
                }

                var north = parseInt(fieldValue.northings, 10);
                if (isNaN(north)) {
                    return cb(new Error("Invalid northings definition for northings and eastings location. " + fieldValue.northings));
                }

                return cb();
            }
        }

        function validatorAnyFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
            // if any of the following validators return ok, then return ok.
            validatorBase64(fieldValue, fieldDefinition, previousFieldValues, function(err) {
                if (!err) {
                    return cb();
                }
                validatorFile(fieldValue, fieldDefinition, previousFieldValues, function(err) {
                    if (!err) {
                        return cb();
                    }
                    validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, function(err) {
                        if (!err) {
                            return cb();
                        }
                        return cb(err);
                    });
                });
            });
        }

        function checkFileSize(fieldDefinition, fieldValue, sizeKey, cb) {
            fieldDefinition = fieldDefinition || {};
            var fieldOptions = fieldDefinition.fieldOptions || {};
            var fieldOptionsDef = fieldOptions.definition || {};
            var fileSizeMax = fieldOptionsDef.file_size || null; //FileSizeMax will be in KB. File size is in bytes

            if (fileSizeMax !== null) {
                var fieldValueSize = fieldValue[sizeKey];
                var fieldValueSizeKB = 1;
                if (fieldValueSize > 1000) {
                    fieldValueSizeKB = fieldValueSize / 1000;
                }
                if (fieldValueSize > (fileSizeMax * 1000)) {
                    return cb(new Error("File size is too large. File can be a maximum of " + fileSizeMax + "KB. Size of file selected: " + fieldValueSizeKB + "KB"));
                } else {
                    return cb();
                }
            } else {
                return cb();
            }
        }

        function validatorFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (typeof fieldValue !== "object") {
                return cb(new Error("Expected object but got " + typeof(fieldValue)));
            }

            var keyTypes = [{
                keyName: "fileName",
                valueType: "string"
            }, {
                keyName: "fileSize",
                valueType: "number"
            }, {
                keyName: "fileType",
                valueType: "string"
            }, {
                keyName: "fileUpdateTime",
                valueType: "number"
            }, {
                keyName: "hashName",
                valueType: "string"
            }];

            async.each(keyTypes, function(keyType, cb) {
                var actualType = typeof fieldValue[keyType.keyName];
                if (actualType !== keyType.valueType) {
                    return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
                }
                if (keyType.keyName === "fileName" && fieldValue[keyType.keyName].length <= 0) {
                    return cb(new Error("Expected value for " + keyType.keyName));
                }

                return cb();
            }, function(err) {
                if (err) return cb(err);

                checkFileSize(fieldDefinition, fieldValue, "fileSize", function(err) {
                    if (err) {
                        return cb(err);
                    }

                    if (fieldValue.hashName.indexOf("filePlaceHolder") > -1) { //TODO abstract out to config
                        return cb();
                    } else if (previousFieldValues && previousFieldValues.hashName && previousFieldValues.hashName.indexOf(fieldValue.hashName) > -1) {
                        return cb();
                    } else {
                        return cb(new Error("Invalid file placeholder text" + fieldValue.hashName));
                    }
                });
            });
        }

        function validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if ((typeof File !== "function")) {
                return cb(new Error("Expected File object but got " + typeof(fieldValue)));
            }

            var keyTypes = [{
                keyName: "name",
                valueType: "string"
            }, {
                keyName: "size",
                valueType: "number"
            }];

            async.each(keyTypes, function(keyType, cb) {
                var actualType = typeof fieldValue[keyType.keyName];
                if (actualType !== keyType.valueType) {
                    return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
                }
                if (actualType === "string" && fieldValue[keyType.keyName].length <= 0) {
                    return cb(new Error("Expected value for " + keyType.keyName));
                }
                if (actualType === "number" && fieldValue[keyType.keyName] <= 0) {
                    return cb(new Error("Expected > 0 value for " + keyType.keyName));
                }

                return cb();
            }, function(err) {
                if (err) return cb(err);


                checkFileSize(fieldDefinition, fieldValue, "size", function(err) {
                    if (err) {
                        return cb(err);
                    }
                    return cb();
                });
            });
        }

        function validatorBase64(fieldValue, fieldDefinition, previousFieldValues, cb) {
            if (typeof fieldValue !== "string") {
                return cb(new Error("Expected base64 string but got " + typeof(fieldValue)));
            }

            if (fieldValue.length <= 0) {
                return cb(new Error("Expected base64 string but was empty"));
            }

            return cb();
        }

        function validatorDateTime(fieldValue, fieldDefinition, previousFieldValues, cb) {
            var testDate;
            var valid = false;
            var parts = [];

            if (typeof(fieldValue) !== "string") {
                return cb(new Error("Expected string but got " + typeof(fieldValue)));
            }

            switch (fieldDefinition.fieldOptions.definition.datetimeUnit) {
                case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:

                    parts = fieldValue.split("/");
                    valid = parts.length === 3;

                    if (valid) {
                        valid = isNumberBetween(parts[2], 1, 31);
                    }

                    if (valid) {
                        valid = isNumberBetween(parts[1], 1, 12);
                    }

                    if (valid) {
                        valid = isNumberBetween(parts[0], 1000, 9999);
                    }

                    try {
                        if (valid) {
                            testDate = new Date(parts[3], parts[1], parts[0]);
                        } else {
                            testDate = new Date(fieldValue);
                        }
                        valid = (testDate.toString() !== "Invalid Date");
                    } catch (e) {
                        valid = false;
                    }

                    if (valid) {
                        return cb();
                    } else {
                        return cb(new Error("Invalid date value " + fieldValue + ". Date format is YYYY/MM/DD"));
                    }
                    break;
                case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
                    parts = fieldValue.split(':');
                    valid = (parts.length === 2) || (parts.length === 3);
                    if (valid) {
                        valid = isNumberBetween(parts[0], 0, 23);
                    }
                    if (valid) {
                        valid = isNumberBetween(parts[1], 0, 59);
                    }
                    if (valid && (parts.length === 3)) {
                        valid = isNumberBetween(parts[2], 0, 59);
                    }
                    if (valid) {
                        return cb();
                    } else {
                        return cb(new Error("Invalid time value " + fieldValue + ". Time format is HH:MM:SS"));
                    }
                    break;
                case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
                    parts = fieldValue.split(/[- :]/);

                    valid = (parts.length === 6) || (parts.length === 5);

                    if (valid) {
                        valid = isNumberBetween(parts[2], 1, 31);
                    }

                    if (valid) {
                        valid = isNumberBetween(parts[1], 1, 12);
                    }

                    if (valid) {
                        valid = isNumberBetween(parts[0], 1000, 9999);
                    }

                    if (valid) {
                        valid = isNumberBetween(parts[3], 0, 23);
                    }
                    if (valid) {
                        valid = isNumberBetween(parts[4], 0, 59);
                    }
                    if (valid && parts.length === 6) {
                        valid = isNumberBetween(parts[5], 0, 59);
                    } else {
                        parts[5] = 0;
                    }

                    try {
                        if (valid) {
                            testDate = new Date(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]);
                        } else {
                            testDate = new Date(fieldValue);
                        }

                        valid = (testDate.toString() !== "Invalid Date");
                    } catch (e) {
                        valid = false;
                    }

                    if (valid) {
                        return cb();
                    } else {
                        return cb(new Error("Invalid dateTime string " + fieldValue + ". dateTime format is YYYY/MM/DD HH:MM:SS"));
                    }
                    break;
                default:
                    return cb(new Error("Invalid dateTime fieldtype " + fieldDefinition.fieldOptions.definition.datetimeUnit));
            }
        }

        function validatorSection(value, fieldDefinition, previousFieldValues, cb) {
            return cb(new Error("Should not submit section field: " + fieldDefinition.name));
        }

        function rulesResult(rules, cb) {
            var visible = true;

            // Itterate over each rule that this field is a predicate of
            async.each(rules, function(rule, cbRule) {
                // For each rule, itterate over the predicate fields and evaluate the rule
                var predicateMapQueries = [];
                var predicateMapPassed = [];
                async.each(rule.ruleConditionalStatements, function(ruleConditionalStatement, cbPredicates) {
                    var field = fieldMap[ruleConditionalStatement.sourceField];
                    var passed = false;
                    var submissionValues = [];
                    var condition;
                    var testValue;
                    if (submissionFieldsMap[ruleConditionalStatement.sourceField] && submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues) {
                        submissionValues = submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues;
                        condition = ruleConditionalStatement.restriction;
                        testValue = ruleConditionalStatement.sourceValue;

                        // Validate rule predictes on the first entry only.
                        passed = isConditionActive(field, submissionValues[0], testValue, condition);
                    }
                    predicateMapQueries.push({
                        "field": field,
                        "submissionValues": submissionValues,
                        "condition": condition,
                        "testValue": testValue,
                        "passed": passed
                    });

                    if (passed) {
                        predicateMapPassed.push(field);
                    }
                    return cbPredicates();
                }, function(err) {
                    if (err) cbRule(err);

                    function rulesPassed(condition, passed, queries) {
                        return ((condition === "and") && ((passed.length === queries.length))) || // "and" condition - all rules must pass
                        ((condition === "or") && ((passed.length > 0))); // "or" condition - only one rule must pass
                    }

                    /**
                     * If any rule condition that targets the field/page hides that field/page, then the page is hidden.
                     * Hiding the field/page takes precedence over any show. This will maintain consistency.
                     * E.g. if x is y then show p1,p2 takes precendence over if x is z then hide p1, p2
                     */
                    if (rulesPassed(rule.ruleConditionalOperator, predicateMapPassed, predicateMapQueries)) {
                        visible = (rule.type === "show") && visible;
                    } else {
                        visible = (rule.type !== "show") && visible;
                    }

                    return cbRule();
                });
            }, function(err) {
                if (err) return cb(err);

                return cb(undefined, visible);
            });
        }

        function isPageVisible(pageId, cb) {
            init(function(err) {
                if (err) return cb(err);
                if (isPageRuleSubject(pageId)) { // if the page is the target of a rule
                    return rulesResult(pageRuleSubjectMap[pageId], cb); // execute page rules
                } else {
                    return cb(undefined, true); // if page is not subject of any rule then must be visible
                }
            });
        }

        function isFieldVisible(fieldId, checkContainingPage, cb) {
            /*
             * fieldId = Id of field to check for reule predeciate references
             * checkContainingPage = if true check page containing field, and return false if the page is hidden
             */
            init(function(err) {
                if (err) return cb(err);

                // Fields are visable by default
                var field = fieldMap[fieldId];

                /**
                 * If the field is an admin field, the rules engine returns an error, as admin fields cannot be the subject of rules engine actions.
                 */
                if (adminFieldMap[fieldId]) {
                    return cb(new Error("Submission " + fieldId + " is an admin field. Admin fields cannot be passed to the rules engine."));
                } else if (!field) {
                    return cb(new Error("Field does not exist in form"));
                }

                async.waterfall([

                    function testPage(cb) {
                        if (checkContainingPage) {
                            isPageVisible(field.pageId, cb);
                        } else {
                            return cb(undefined, true);
                        }
                    },
                    function testField(pageVisible, cb) {
                        if (!pageVisible) { // if page containing field is not visible then don't need to check field
                            return cb(undefined, false);
                        }

                        if (isFieldRuleSubject(fieldId)) { // If the field is the subject of a rule it may have been hidden
                            return rulesResult(fieldRuleSubjectMap[fieldId], cb); // execute field rules
                        } else {
                            return cb(undefined, true); // if not subject of field rules then can't be hidden
                        }
                    }
                ], cb);
            });
        }

        /*
         * check all rules actions
         *      res:
         *      {
         *          "actions": {
         *              "pages": {
         *                  "targetId": {
         *                      "targetId": "",
         *                      "action": "show|hide"
         *                  }
         *              },
         *              "fields": {
         *              }
         *          }
         *      }
         */
        function checkRules(submissionJSON, cb) {
            init(function(err) {
                if (err) return cb(err);

                initSubmission(submissionJSON, function(err) {
                    if (err) return cb(err);
                    var actions = {};

                    async.parallel([

                        function(cb) {
                            actions.fields = {};
                            async.eachSeries(Object.keys(fieldRuleSubjectMap), function(fieldId, cb) {
                                isFieldVisible(fieldId, false, function(err, fieldVisible) {
                                    if (err) return cb(err);
                                    actions.fields[fieldId] = {
                                        targetId: fieldId,
                                        action: (fieldVisible ? "show" : "hide")
                                    };
                                    return cb();
                                });
                            }, cb);
                        },
                        function(cb) {
                            actions.pages = {};
                            async.eachSeries(Object.keys(pageRuleSubjectMap), function(pageId, cb) {
                                isPageVisible(pageId, function(err, pageVisible) {
                                    if (err) return cb(err);
                                    actions.pages[pageId] = {
                                        targetId: pageId,
                                        action: (pageVisible ? "show" : "hide")
                                    };
                                    return cb();
                                });
                            }, cb);
                        }
                    ], function(err) {
                        if (err) return cb(err);

                        return cb(undefined, {
                            actions: actions
                        });
                    });
                });
            });
        }

        return {
            validateForm: validateForm,
            validateField: validateField,
            validateFieldValue: validateFieldValue,
            checkRules: checkRules,

            // The following are used internally, but exposed for tests
            validateFieldInternal: validateFieldInternal,
            initSubmission: initSubmission,
            isFieldVisible: isFieldVisible,
            isConditionActive: isConditionActive
        };
    };

    function isNumberBetween(num, min, max) {
        var numVal = parseInt(num, 10);
        return (!isNaN(numVal) && (numVal >= min) && (numVal <= max));
    }

    function cvtTimeToSeconds(fieldValue) {
        var seconds = 0;
        if (typeof fieldValue === "string") {
            var parts = fieldValue.split(':');
            valid = (parts.length === 2) || (parts.length === 3);
            if (valid) {
                valid = isNumberBetween(parts[0], 0, 23);
                seconds += (parseInt(parts[0], 10) * 60 * 60);
            }
            if (valid) {
                valid = isNumberBetween(parts[1], 0, 59);
                seconds += (parseInt(parts[1], 10) * 60);
            }
            if (valid && (parts.length === 3)) {
                valid = isNumberBetween(parts[2], 0, 59);
                seconds += parseInt(parts[2], 10);
            }
        }
        return seconds;
    }

    function isConditionActive(field, fieldValue, testValue, condition) {

        var fieldType = field.type;
        var fieldOptions = field.fieldOptions ? field.fieldOptions : {};

        if (typeof(fieldValue) === 'undefined' || fieldValue === null) {
            return false;
        }

        function numericalComparison(condition, fieldValue, testValue) {
            var fieldValNum = parseInt(fieldValue, 10);
            var testValNum = parseInt(testValue, 10);

            if (isNaN(fieldValNum) || isNaN(testValNum)) {
                return false;
            }

            if ("is equal to" === condition) {
                return fieldValNum === testValNum;
            } else if ("is less than" === condition) {
                return fieldValNum < testValNum;
            } else if ("is greater than" === condition) {
                return fieldValNum > testValNum;
            } else {
                return false;
            }
        }

        var valid = true;
        if ("is equal to" === condition) {
            valid = numericalComparison("is equal to", fieldValue, testValue);
        } else if ("is greater than" === condition) {
            valid = numericalComparison("is greater than", fieldValue, testValue);
        } else if ("is less than" === condition) {
            valid = numericalComparison("is less than", fieldValue, testValue);
        } else if ("is at" === condition) {
            valid = false;
            if (fieldType === FIELD_TYPE_DATETIME) {
                switch (fieldOptions.definition.datetimeUnit) {
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
                        try {
                            valid = (new Date(new Date(fieldValue).toDateString()).getTime() === new Date(new Date(testValue).toDateString()).getTime());
                        } catch (e) {
                            valid = false;
                        }
                        break;
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
                        valid = cvtTimeToSeconds(fieldValue) === cvtTimeToSeconds(testValue);
                        break;
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
                        try {
                            valid = (new Date(fieldValue).getTime() === new Date(testValue).getTime());
                        } catch (e) {
                            valid = false;
                        }
                        break;
                    default:
                        valid = false; // TODO should raise error here?
                        break;
                }
            }
        } else if ("is before" === condition) {
            valid = false;
            if (fieldType === FIELD_TYPE_DATETIME) {
                switch (fieldOptions.definition.datetimeUnit) {
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
                        try {
                            valid = (new Date(new Date(fieldValue).toDateString()).getTime() < new Date(new Date(testValue).toDateString()).getTime());
                        } catch (e) {
                            valid = false;
                        }
                        break;
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
                        valid = cvtTimeToSeconds(fieldValue) < cvtTimeToSeconds(testValue);
                        break;
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
                        try {
                            valid = (new Date(fieldValue).getTime() < new Date(testValue).getTime());
                        } catch (e) {
                            valid = false;
                        }
                        break;
                    default:
                        valid = false; // TODO should raise error here?
                        break;
                }
            }
        } else if ("is after" === condition) {
            valid = false;
            if (fieldType === FIELD_TYPE_DATETIME) {
                switch (fieldOptions.definition.datetimeUnit) {
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
                        try {
                            valid = (new Date(new Date(fieldValue).toDateString()).getTime() > new Date(new Date(testValue).toDateString()).getTime());
                        } catch (e) {
                            valid = false;
                        }
                        break;
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
                        valid = cvtTimeToSeconds(fieldValue) > cvtTimeToSeconds(testValue);
                        break;
                    case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
                        try {
                            valid = (new Date(fieldValue).getTime() > new Date(testValue).getTime());
                        } catch (e) {
                            valid = false;
                        }
                        break;
                    default:
                        valid = false; // TODO should raise error here?
                        break;
                }
            }
        } else if ("is" === condition) {
            if (fieldType === FIELD_TYPE_CHECKBOX) {
                valid = fieldValue && fieldValue.selections && fieldValue.selections.indexOf(testValue) !== -1;
            } else {
                valid = fieldValue === testValue;
            }
        } else if ("is not" === condition) {
            if (fieldType === FIELD_TYPE_CHECKBOX) {
                valid = fieldValue && fieldValue.selections && fieldValue.selections.indexOf(testValue) === -1;
            } else {
                valid = fieldValue !== testValue;
            }
        } else if ("contains" === condition) {
            valid = fieldValue.indexOf(testValue) !== -1;
        } else if ("does not contain" === condition) {
            valid = fieldValue.indexOf(testValue) === -1;
        } else if ("begins with" === condition) {
            valid = fieldValue.substring(0, testValue.length) === testValue;
        } else if ("ends with" === condition) {
            valid = fieldValue.substring(Math.max(0, (fieldValue.length - testValue.length)), fieldValue.length) === testValue;
        } else {
            valid = false;
        }

        return valid;
    }

    return formsRulesEngine(formDef);
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = rulesEngine;
}
},{"async":7,"underscore":47}],72:[function(require,module,exports){
function Store(name) {
    this.name = name;
}
Store.prototype.create = function(model, cb) {
    throw 'Create not implemented:' + this.name;
};
/**
 * Read a model data from store
 * @param  {[type]} model          [description]
 * @param  {[type]} cb(error, data);
 */
Store.prototype.read = function(model, cb) {
    throw 'Read not implemented:' + this.name;
};
Store.prototype.update = function(model, cb) {
    throw 'Update not implemented:' + this.name;
};
Store.prototype.removeEntry = function(model, cb) {
    throw 'Delete not implemented:' + this.name;
};
Store.prototype.upsert = function(model, cb) {
    throw 'Upsert not implemented:' + this.name;
};

module.exports = Store;

},{}],73:[function(require,module,exports){
var log = require("./log");
var utils = require("./utils");
var Store = require("./store");
var web = require("./web");

var mbaas;

function MBaaS() {
    this.name = 'MBaaS';
}

utils.extend(MBaaS, Store);

MBaaS.prototype.checkStudio = function() {
    return require("./config").get("studioMode");
};
MBaaS.prototype.create = function(model, cb) {
    var self = this;
    if (self.checkStudio()) {
        cb("Studio mode mbaas not supported");
    } else {
        var url = _getUrl(model);
        if (self.isFileAndPhoneGap(model)) {
            web.uploadFile(url, model.getProps(), cb);
        } else {
            web.post(url, model.getProps(), cb);
        }
    }
};
MBaaS.prototype.isFileAndPhoneGap = function(model) {
    var self = this;
    return self.isFileTransfer(model) && self.isPhoneGap();
};
MBaaS.prototype.isFileTransfer = function(model) {
    return (model.get("_type") === "fileSubmission" || model.get("_type") === "base64fileSubmission" || model.get("_type") === "fileSubmissionDownload");
};
MBaaS.prototype.isPhoneGap = function() {
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
};
MBaaS.prototype.read = function(model, cb) {
    var self = this;
    if (self.checkStudio()) {
        cb("Studio mode mbaas not supported");
    } else {
        if (model.get("_type") === "offlineTest") {
            cb("offlinetest. ignore");
        } else {
            var url = _getUrl(model);

            if (self.isFileTransfer(model) && self.isPhoneGap()) {
                web.downloadFile(url, model.getFileMetaData(), cb);
            } else if (self.isFileTransfer(model)) { //Trying to download a file without phone. No need as the direct web urls can be used
                return cb(null, model.getRemoteFileURL());
            } else {
                web.get(url, cb);
            }
        }
    }
};
MBaaS.prototype.update = function(model, cb) {};
MBaaS["delete"] = function(model, cb) {};
//@Deprecated use create instead
MBaaS.prototype.completeSubmission = function(submissionToComplete, cb) {
    if (this.checkStudio()) {
        return cb("Studio mode mbaas not supported");
    }
    var url = _getUrl(submissionToComplete);
    web.post(url, {}, cb);
};
MBaaS.prototype.submissionStatus = function(submission, cb) {
    if (this.checkStudio()) {
        return cb("Studio mode mbaas not supported");
    }
    var url = _getUrl(submission);
    web.get(url, cb);
};
MBaaS.prototype.isOnline = function(cb) {
    var host = require("./config").getCloudHost();
    var url = host + require("./config").get('statusUrl', "/sys/info/ping");

    web.get(url, function(err) {
        if (err) {
            log.e("Online status ajax ", err);
            return cb(false);
        } else {
            log.d("Online status ajax success");
            return cb(true);
        }
    });
};

function _getUrl(model) {
    log.d("_getUrl ", model);


    var config = require("./config");
    var type = model.get('_type');
    var host = config.getCloudHost();
    var mBaaSBaseUrl = config.get('mbaasBaseUrl', "");
    var formUrls = config.get('formUrls');
    var relativeUrl = "";
    if (formUrls[type]) {
        relativeUrl = formUrls[type];
    } else {
        log.e('type not found to get url:' + type);
    }
    var url = host + mBaaSBaseUrl + relativeUrl;
    var props = {};
    props.appId = require("./config").get('appId');
    //Theme and forms do not require any parameters that are not in _fh
    switch (type) {
        case 'config':
            props.appid = model.get("appId");
            props.deviceId = model.get("deviceId");
            break;
        case 'form':
            props.formId = model.get('_id');
            break;
        case 'formSubmission':
            props.formId = model.getFormId();
            break;
        case 'fileSubmission':
            props.submissionId = model.getSubmissionId();
            props.hashName = model.getHashName();
            props.fieldId = model.getFieldId();
            break;
        case 'base64fileSubmission':
            props.submissionId = model.getSubmissionId();
            props.hashName = model.getHashName();
            props.fieldId = model.getFieldId();
            break;
        case 'submissionStatus':
            props.submissionId = model.get('submissionId');
            break;
        case 'completeSubmission':
            props.submissionId = model.get('submissionId');
            break;
        case 'formSubmissionDownload':
            props.submissionId = model.getSubmissionId();
            break;
        case 'fileSubmissionDownload':
            props.submissionId = model.getSubmissionId();
            props.fileGroupId = model.getFileGroupId();
            break;
        case 'offlineTest':
            return "http://127.0.0.1:8453";
    }
    for (var key in props) {
        url = url.replace(':' + key, props[key]);
    }
    return url;
}

function getMbaasStore(){
    if(!mbaas){
        mbaas = new MBaaS();
    }

    return mbaas;
}

module.exports = getMbaasStore();

},{"./config":48,"./log":68,"./store":72,"./utils":78,"./web":79}],74:[function(require,module,exports){
//implmenetation
var _submissions = {};
//cache in mem for single reference usage.
var Model = require("./model");
var submissions = require("./submissions");
var log = require("./log");
var utils = require("./utils");
var config = require("./config");
var uploadManager = require("./uploadManager");
var submissions = require("./submissions");
var localStorage = require("./localStorage");
var Form = require("./form");
var async = require("async");
var _ = require("underscore");
var rulesEngine = require('./rulesEngine.js');

var statusMachine = {
    'new': [
        'draft',
        'pending'
    ],
    'draft': [
        'pending',
        'draft'
    ],
    'pending': [
        'inprogress',
        'error',
        'draft'
    ],
    'inprogress': [
        'pending',
        'error',
        'inprogress',
        'downloaded',
        'queued'
    ],
    'submitted': [],
    'error': [
        'draft',
        'pending',
        'error'
    ],
    'downloaded': [],
    'queued': ['error', 'submitted']
};

function Submission(form, params) {
    params = params || {};
    log.d("Submission: ", params);
    Model.call(this, {
        '_type': 'submission'
    });
    if (typeof form !== 'undefined' && form) {
        this.set('formName', form.get('name'));
        this.set('formId', form.get('_id'));
        this.set('deviceFormTimestamp', form.getLastUpdate());
        this.set('createDate', utils.getTime());
        this.set('timezoneOffset', utils.getTime(true));
        this.set('appId', config.get('appId'));
        this.set('appEnvironment', config.get('env'));
        this.set('appCloudName', '');
        this.set('comments', []);
        this.set('formFields', []);
        this.set('saveDate', null);
        this.set('submitDate', null);
        this.set('uploadStartDate', null);
        this.set('submittedDate', null);
        this.set('userId', null);
        this.set('filesInSubmission', []);
        this.set('deviceId', config.get('deviceId'));
        this.transactionMode = false;
    } else {
        this.set('appId', config.get('appId'));
        if (params.submissionId) {
            this.set('downloadSubmission', true);
            this.setRemoteSubmissionId(params.submissionId);
        } else {
            this.set('status', 'new');
        }
    }
    this.set('status', 'new');
    this.getLocalId();
    var localId = this.getLocalId();
    _submissions[localId] = this;
}

utils.extend(Submission, Model);

/**
 * save current submission as draft
 * @return {[type]} [description]
 */
Submission.prototype.saveDraft = function(cb) {
    log.d("Submission saveDraft: ");
    var targetStatus = 'draft';
    var that = this;
    this.set('timezoneOffset', utils.getTime(true));
    this.set('saveDate', utils.getTime());
    this.changeStatus(targetStatus, function(err) {
        if (err) {
            return cb(err);
        } else {
            that.emit('savedraft');
            cb(null, null);
        }
    });
};
Submission.prototype.validateField = function(fieldId, cb) {
    log.d("Submission validateField: ", fieldId);
    var that = this;
    this.getForm(function(err, form) {
        if (err) {
            cb(err);
        } else {
            var submissionData = that.getProps();
            var rE = form.getRuleEngine();
            rE.validateField(fieldId, submissionData, cb);
        }
    });
};
Submission.prototype.checkRules = function(cb) {
    log.d("Submission checkRules: ");
    var self = this;
    this.getForm(function(err, form) {
        if (err) {
            cb(err);
        } else {
            var submission = self.getProps();
            var rE = form.getRuleEngine();
            rE.checkRules(submission, cb);
        }
    });
};

Submission.prototype.performValidation = function(cb) {
    var self = this;
    self.getForm(function(err, form) {
        if (err) {
            log.e("Submission submit: Error getting form ", err);
            return cb(err);
        }
        var rE = form.getRuleEngine();
        var submission = self.getProps();
        var formRuleEngine = rulesEngine(form.getProps());

        formRuleEngine.validateForm(submission, cb);
    });
};

/**
 * Validate the submission only.
 */
Submission.prototype.validateSubmission = function(cb) {
    var self = this;

    self.performValidation(function(err, res) {
        if (err) {
            return cb(err);
        }
        var validation = res.validation;
        if (validation.valid) {
            return cb(null, validation.valid);
        } else {
            self.emit('validationerror', validation);
            cb(null, validation.valid);
        }
    });
};

/**
 * submit current submission to remote
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
Submission.prototype.submit = function(cb) {
    var that = this;
    log.d("Submission submit: ");
    var targetStatus = 'pending';
    var validateResult = true;

    this.set('timezoneOffset', utils.getTime(true));
    that.performValidation(function(err, res) {
        if (err) {
            log.e("Submission submit validateForm: Error validating form ", err);
            cb(err);
        } else {
            log.d("Submission submit: validateForm. Completed result", res);
            var validation = res.validation;
            if (validation.valid) {
                log.d("Submission submit: validateForm. Completed Form Valid", res);
                that.set('submitDate', new Date());
                that.changeStatus(targetStatus, function(error) {
                    if (error) {
                        cb(error);
                    } else {
                        that.emit('submit');
                        cb(null, null);
                    }
                });
            } else {
                log.d("Submission submit: validateForm. Completed Validation error", res);
                that.emit('validationerror', validation);
                cb('Validation error');
            }
        }
    });
};
Submission.prototype.getUploadTask = function(cb) {
    var taskId = this.getUploadTaskId();
    if (taskId) {
        uploadManager.getTaskById(taskId, cb);
    } else {
        cb(null, null);
    }
};
Submission.prototype.getFormId = function() {
    return this.get("formId");
};
/**
 * If a submission is a download submission, the JSON definition of the form
 * that it was submitted against is contained in the submission.
 */
Submission.prototype.getFormSubmittedAgainst = function() {
    return this.get("formSubmittedAgainst");
};
Submission.prototype.getDownloadTask = function(cb) {
    var self = this;
    log.d("getDownloadTask");
    if (self.isDownloadSubmission()) {
        self.getUploadTask(cb);
    } else {
        if (cb && typeof(cb) === 'function') {
            log.e("Submission is not a download submission");
            return cb("Submission is not a download submission");
        }
    }
};
Submission.prototype.cancelUploadTask = function(cb) {
    var targetStatus = 'submit';
    var that = this;
    uploadManager.cancelSubmission(this, function(err) {
        if (err) {
            log.e(err);
        }
        that.changeStatus(targetStatus, cb);
    });
};
Submission.prototype.getUploadTaskId = function() {
    return this.get('uploadTaskId');
};
Submission.prototype.setUploadTaskId = function(utId) {
    this.set('uploadTaskId', utId);
};
Submission.prototype.isInProgress = function() {
    return this.get("status") === "inprogress";
};
Submission.prototype.isDownloaded = function() {
    return this.get("status") === "downloaded";
};
Submission.prototype.isSubmitted = function() {
    return this.get("status") === "submitted";
};
Submission.prototype.submitted = function(cb) {
    var self = this;
    if (self.isDownloadSubmission()) {
        var errMsg = "Downloaded submissions should not call submitted function.";
        log.e(errMsg);
        return cb(errMsg);
    }
    log.d("Submission submitted called");

    var targetStatus = 'submitted';

    self.set('submittedDate', utils.getTime());
    self.changeStatus(targetStatus, function(err) {
        if (err) {
            log.e("Error setting submitted status " + err);
            cb(err);
        } else {
            log.d("Submitted status set for submission " + self.get('submissionId') + " with localId " + self.getLocalId());
            self.emit('submitted', self.get('submissionId'));
            cb(null, null);
        }
    });
};
Submission.prototype.queued = function(cb) {
    var self = this;
    if (self.isDownloadSubmission()) {
        var errMsg = "Downloaded submissions should not call queued function.";
        log.e(errMsg);
        return cb(errMsg);
    }

    var targetStatus = 'queued';
    self.set('queuedDate', utils.getTime());
    self.changeStatus(targetStatus, function(err) {
        if (err) {
            log.e("Error setting queued status " + err);
            cb(err);
        } else {
            log.d("Queued status set for submission " + self.get('submissionId') + " with localId " + self.getLocalId());
            self.emit('queued', self.get('submissionId'));
            cb(null, self);
        }
    });
};
Submission.prototype.downloaded = function(cb) {
    log.d("Submission Downloaded called");
    var that = this;
    var targetStatus = 'downloaded';

    that.set('downloadedDate', utils.getTime());
    that.changeStatus(targetStatus, function(err) {
        if (err) {
            log.e("Error setting downloaded status " + err);
            cb(err);
        } else {
            log.d("Downloaded status set for submission " + that.get('submissionId') + " with localId " + that.getLocalId());
            that.emit('downloaded', that.get('submissionId'));
            cb(null, that);
        }
    });
};

/**
 * change status and save the submission locally and register to submissions list.
 * @param {[type]} status [description]
 */
Submission.prototype.changeStatus = function(status, cb) {
    if (this.isStatusValid(status)) {
        var that = this;
        this.set('status', status);
        this.saveToList(function(err) {
            if (err) {
                log.e(err);
            }
        });
        this.saveLocal(cb);
    } else {
        log.e('Target status is not valid: ' + status);
        cb('Target status is not valid: ' + status);
    }
};
Submission.prototype.upload = function(cb) {
    var targetStatus = "inprogress";
    var self = this;
    if (this.isStatusValid(targetStatus)) {
        this.set("status", targetStatus);
        this.set("uploadStartDate", utils.getTime());
        submissions.updateSubmissionWithoutSaving(this);
        uploadManager.queueSubmission(self, function(err, ut) {
            if (err) {
                cb(err);
            } else {
                ut.set("error", null);
                ut.saveLocal(function(err) {
                    if (err) {
                        log.e("Error saving upload task: " + err);
                    }
                    self.emit("inprogress", ut);
                    ut.on("progress", function(progress) {
                        log.d("Emitting upload progress for submission: " + self.getLocalId() + JSON.stringify(progress));
                        self.emit("progress", progress);
                    });
                    cb(null, ut);
                });
            }
        });
    } else {
        return cb("Invalid Status to upload a form submission.");
    }
};
Submission.prototype.download = function(cb) {
    var that = this;
    log.d("Starting download for submission: " + that.getLocalId());
    var targetStatus = "pending";
    if (this.isStatusValid(targetStatus)) {
        this.set("status", targetStatus);
        targetStatus = "inprogress";
        if (this.isStatusValid(targetStatus)) {
            this.set("status", targetStatus);
            //Status is valid, add the submission to the
            uploadManager.queueSubmission(that, function(err, downloadTask) {
                if (err) {
                    return cb(err);
                }
                downloadTask.set("error", null);
                downloadTask.saveLocal(function(err) {
                    if (err) {
                        log.e("Error saving download task: " + err);
                    }
                    that.emit("inprogress", downloadTask);
                    downloadTask.on("progress", function(progress) {
                        log.d("Emitting download progress for submission: " + that.getLocalId() + JSON.stringify(progress));
                        that.emit("progress", progress);
                    });
                    return cb(null, downloadTask);
                });
                
            });
        } else {
            return cb("Invalid Status to dowload a form submission");
        }
    } else {
        return cb("Invalid Status to download a form submission.");
    }
};
Submission.prototype.saveToList = function(cb) {
    submissions.saveSubmission(this, cb);
};
Submission.prototype.error = function(errorMsg, cb) {
    this.set('errorMessage', errorMsg);
    var targetStatus = 'error';
    this.changeStatus(targetStatus, cb);
    this.emit('error', errorMsg);
};
Submission.prototype.getStatus = function() {
    return this.get('status');
};
/**
 * check if a target status is valid
 * @param  {[type]}  targetStatus [description]
 * @return {Boolean}              [description]
 */
Submission.prototype.isStatusValid = function(targetStatus) {
    log.d("isStatusValid. Target Status: " + targetStatus + " Current Status: " + this.get('status').toLowerCase());
    var status = this.get('status').toLowerCase();
    var nextStatus = statusMachine[status];
    if (nextStatus.indexOf(targetStatus) > -1) {
        return true;
    } else {
        this.set('status', 'error');
        return false;
    }
};
Submission.prototype.addComment = function(msg, user) {
    var now = utils.getTime();
    var ts = now.getTime();
    var newComment = {
        'madeBy': typeof user === 'undefined' ? '' : user.toString(),
        'madeOn': now,
        'value': msg,
        'timeStamp': ts
    };
    this.getComments().push(newComment);
    return ts;
};
Submission.prototype.getComments = function() {
    return this.get('comments');
};
Submission.prototype.removeComment = function(timeStamp) {
    var comments = this.getComments();
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        if (comment.timeStamp === timeStamp) {
            comments.splice(i, 1);
            return;
        }
    }
};

Submission.prototype.populateFilesInSubmission = function() {
    var self = this;
    var tmpFileNames = [];

    var submissionFiles = self.getSubmissionFiles();
    for (var fieldValIndex = 0; fieldValIndex < submissionFiles.length; fieldValIndex++) {
        if (submissionFiles[fieldValIndex].fileName) {
            tmpFileNames.push(submissionFiles[fieldValIndex].fileName);
        } else if (submissionFiles[fieldValIndex].hashName) {
            tmpFileNames.push(submissionFiles[fieldValIndex].hashName);
        }
    }

    self.set("filesInSubmission", submissionFiles);
};

Submission.prototype.getSubmissionFiles = function() {
    var self = this;
    log.d("In getSubmissionFiles: " + self.getLocalId());
    var submissionFiles = [];

    var formFields = self.getFormFields();

    for (var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++) {
        var tmpFieldValues = formFields[formFieldIndex].fieldValues || [];
        for (var fieldValIndex = 0; fieldValIndex < tmpFieldValues.length; fieldValIndex++) {
            if (tmpFieldValues[fieldValIndex].fileName) {
                submissionFiles.push(tmpFieldValues[fieldValIndex]);
            } else if (tmpFieldValues[fieldValIndex].hashName) {
                submissionFiles.push(tmpFieldValues[fieldValIndex]);
            }
        }

    }

    return submissionFiles;
};

// *
//  * Add a value to submission.
//  * This will not cause the field been validated.
//  * Validation should happen:
//  * 1. onblur (field value)
//  * 2. onsubmit (whole submission json)
//  *
//  * @param {[type]} params   {"fieldId","value","index":optional}
//  * @param {} cb(err,res) callback function when finished
//  * @return true / error message

Submission.prototype.addInputValue = function(params, cb) {
    log.d("Adding input value: ", JSON.stringify(params || {}));
    var that = this;
    var fieldId = params.fieldId;
    var inputValue = params.value;

    if (inputValue !== null && typeof(inputValue) !== 'undefined') {
        var index = params.index === undefined ? -1 : params.index;
        this.getForm(function(err, form) {
            var fieldModel = form.getFieldModelById(fieldId);
            if (that.transactionMode) {
                if (!that.tmpFields[fieldId]) {
                    that.tmpFields[fieldId] = [];
                }

                params.isStore = false; //Don't store the files until the transaction is complete
                fieldModel.processInput(params, function(err, result) {
                    if (err) {
                        return cb(err);
                    } else {
                        if (index > -1) {
                            that.tmpFields[fieldId][index] = result;
                        } else {
                            that.tmpFields[fieldId].push(result);
                        }

                        return cb(null, result);
                    }
                });
            } else {
                var target = that.getInputValueObjectById(fieldId);

                //File already exists for this input, overwrite rather than create a new file
                if (target.fieldValues[index]) {
                    if (typeof(target.fieldValues[index].hashName) === "string") {
                        params.previousFile = target.fieldValues[index];
                    }
                }


                fieldModel.processInput(params, function(err, result) {
                    if (err) {
                        return cb(err);
                    } else {
                        if (index > -1) {
                            target.fieldValues[index] = result;
                        } else {
                            target.fieldValues.push(result);
                        }

                        if (typeof(result.hashName) === "string") {
                            that.pushFile(result.hashName);
                        }

                        return cb(null, result);
                    }
                });
            }
        });
    } else {
        log.e("addInputValue: Input value was null. Params: " + fieldId);
        return cb(null, {});
    }
};
Submission.prototype.pushFile = function(hashName) {
    var subFiles = this.get('filesInSubmission', []);
    if (typeof(hashName) === "string") {
        if (subFiles.indexOf(hashName) === -1) {
            subFiles.push(hashName);
            this.set('filesInSubmission', subFiles);
        }
    }
};
Submission.prototype.removeFileValue = function(hashName) {
    var subFiles = this.get('filesInSubmission', []);
    if (typeof(hashName) === "string" && subFiles.indexOf(hashName) > -1) {
        subFiles.splice(subFiles.indexOf(hashName), 1);
        this.set('filesInSubmission', subFiles);
    }
};
Submission.prototype.getInputValueByFieldId = function(fieldId, cb) {
    var self = this;
    var values = this.getInputValueObjectById(fieldId).fieldValues;
    this.getForm(function(err, form) {
        var fieldModel = form.getFieldModelById(fieldId);
        fieldModel.convertSubmission(values, cb);
    });
};
/**
 * Reset submission
 * @return {[type]} [description]
 */
Submission.prototype.reset = function() {
    var self = this;
    self.clearLocalSubmissionFiles(function(err) {
        self.set('formFields', []);
    });
};
Submission.prototype.isDownloadSubmission = function() {
    return this.get("downloadSubmission") === true;
};

Submission.prototype.getSubmissionFile = function(fileName, cb) {
    localStorage.readFile(fileName, cb);
};
Submission.prototype.clearLocalSubmissionFiles = function(cb) {
    log.d("In clearLocalSubmissionFiles");
    var self = this;
    var filesInSubmission = self.get("filesInSubmission", []);
    log.d("Files to clear ", filesInSubmission);
    var localFileName = "";

    //Should probably be emitting events..
    async.eachSeries(filesInSubmission, function(fileMetaObject, cb) {
        localStorage.removeEntry(filesInSubmission[fileMetaObject], function(err) {
            if (err) {
                log.e("Error removing files from " + err);
            }

            cb(err);
        });
    }, cb);
};
Submission.prototype.startInputTransaction = function() {
    this.transactionMode = true;
    this.tmpFields = {};
};
Submission.prototype.endInputTransaction = function(succeed) {
    var self = this;
    self.transactionMode = false;
    var tmpFields = {};
    var fieldId = "";
    var valIndex = 0;
    var valArr = [];
    var val = "";
    if (succeed) {
        tmpFields = this.tmpFields;
        for (fieldId in tmpFields) {
            var target = this.getInputValueObjectById(fieldId);
            valArr = tmpFields[fieldId];
            for (valIndex = 0; valIndex < valArr.length; valIndex++) {
                val = valArr[valIndex];
                target.fieldValues.push(val);
                if (typeof(val.hashName) === "string") {
                    this.pushFile(val.hashName);
                }
            }
        }
        this.tmpFields = {};
    } else {
        //clear any files set as part of the transaction
        tmpFields = this.tmpFields;
        this.tmpFields = {};

        var fileIds = _.map(tmpFields, function(valArr, fieldId) {
            var fileObjects = _.filter(valArr, function(val) {
                return typeof(val.hashName) === "string";
            });

            return _.map(fileObjects, function(fileObject) {
                return fileObject.hashName;
            });
        });

        //Flatten and remove junk
        fileIds = _.flatten(fileIds);
        fileIds = _.compact(fileIds);

        async.eachSeries(fileIds, function(fileId, cb) {
        	log.d("Removing File From Transaction" + fileId);
            localStorage.removeEntry(fileId, cb);
        }, function(err) {
            if (err) {
                log.e("Error removing file from transaction ", err);
            } else {
            	log.d("Finished Removing Transaction Inputs");
            }
        });
    }
};
/**
 * remove an input value from submission
 * @param  {[type]} fieldId field id
 * @param  {[type]} index (optional) the position of the value will be removed if it is repeated field.
 * @return {[type]}         [description]
 */
Submission.prototype.removeFieldValue = function(fieldId, index) {
    var self = this;
    var targetArr = [];
    var valRemoved = {};
    if (this.transactionMode) {
        targetArr = this.tmpFields.fieldId;
    } else {
        targetArr = this.getInputValueObjectById(fieldId).fieldId;
    }
    if (typeof index === 'undefined') {
        valRemoved = targetArr.splice(0, targetArr.length);
    } else {
        if (targetArr.length > index) {
            valRemoved = targetArr.splice(index, 1);
        }
    }

    if (typeof(valRemoved.hashName) === "string") {
        localStorage.removeEntry(valRemoved.hashName, function(err) {
            if (err) {
                log.e("Error removing file: ", err);
            } else {
                self.removeFileValue(valRemoved.hashName);
            }
        });
    }
};
Submission.prototype.getInputValueObjectById = function(fieldId) {
    var formFields = this.getFormFields();
    for (var i = 0; i < formFields.length; i++) {
        var formField = formFields[i];

        if (formField.fieldId._id) {
            if (formField.fieldId._id === fieldId) {
                return formField;
            }
        } else {
            if (formField.fieldId === fieldId) {
                return formField;
            }
        }
    }
    var newField = {
        'fieldId': fieldId,
        'fieldValues': []
    };
    formFields.push(newField);
    return newField;
};
/**
 * get form model related to this submission.
 * @return {[type]} [description]
 */
Submission.prototype.getForm = function(cb) {
    var formId = this.get('formId');
    var Form = require("./form");

    if (formId) {
        log.d("FormId found for getForm: " + formId);
        new Form({
            'formId': formId,
            'rawMode': true
        }, cb);
    } else {
        log.e("No form Id specified for getForm");
        return cb("No form Id specified for getForm");
    }
};
Submission.prototype.reloadForm = function(cb) {
    log.d("Submission reload form");
    var formId = this.get('formId');
    var self = this;
    new require("./form")({
        formId: formId,
        'rawMode': true
    }, function(err, form) {
        if (err) {
            cb(err);
        } else {
            self.form = form;
            if (!self.get('deviceFormTimestamp', null)) {
                self.set('deviceFormTimestamp', form.getLastUpdate());
            }
            cb(null, form);
        }
    });
};
/**
 * Retrieve all file fields related value
 * If the submission has been downloaded, there is no gurantee that the form is  on-device.
 * @return {[type]} [description]
 */
Submission.prototype.getFileInputValues = function(cb) {
    var self = this;
    self.getFileFieldsId(function(err, fileFieldIds) {
        if (err) {
            return cb(err);
        }
        return cb(null, self.getInputValueArray(fileFieldIds));
    });
};

Submission.prototype.getFormFields = function() {
    var formFields = this.get("formFields", []);

    //Removing null values
    for (var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++) {
        formFields[formFieldIndex].fieldValues = formFields[formFieldIndex].fieldValues || [];
        formFields[formFieldIndex].fieldValues = formFields[formFieldIndex].fieldValues.filter(function(fieldValue) {
            return fieldValue !== null && typeof(fieldValue) !== "undefined";
        });
    }

    return formFields;
};

Submission.prototype.getFileFieldsId = function(cb) {
    var self = this;
    var formFieldIds = [];

    if (self.isDownloadSubmission()) {
        //For Submission downloads, there needs to be a scan through the formFields param
        var formFields = self.getFormFields();

        for (var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++) {
            var formFieldEntry = formFields[formFieldIndex].fieldId || {};
            if (formFieldEntry.type === 'file' || formFieldEntry.type === 'photo' || formFieldEntry.type === 'signature') {
                if (formFieldEntry._id) {
                    formFieldIds.push(formFieldEntry._id);
                }
            }
        }
        return cb(null, formFieldIds);
    } else {
        self.getForm(function(err, form) {
            if (err) {
                log.e("Error getting form for getFileFieldsId" + err);
                return cb(err);
            }
            return cb(err, form.getFileFieldsId());
        });
    }
};

Submission.prototype.updateFileLocalURI = function(fileDetails, newLocalFileURI, cb) {
    log.d("updateFileLocalURI: " + newLocalFileURI);
    var self = this;
    fileDetails = fileDetails || {};

    if (fileDetails.fileName && newLocalFileURI) {
        //Search for the file placeholder name.
        self.findFilePlaceholderFieldId(fileDetails.fileName, function(err, fieldDetails) {
            if (err) {
                return cb(err);
            }
            if (fieldDetails.fieldId) {
                var tmpObj = self.getInputValueObjectById(fieldDetails.fieldId).fieldValues[fieldDetails.valueIndex];
                tmpObj.localURI = newLocalFileURI;
                self.getInputValueObjectById(fieldDetails.fieldId).fieldValues[fieldDetails.valueIndex] = tmpObj;
                self.saveLocal(cb);
            } else {
                log.e("No file field matches the placeholder name " + fileDetails.fileName);
                return cb("No file field matches the placeholder name " + fileDetails.fileName);
            }
        });
    } else {
        log.e("Submission: updateFileLocalURI : No fileName for submissionId : " + JSON.stringify(fileDetails));
        return cb("Submission: updateFileLocalURI : No fileName for submissionId : " + JSON.stringify(fileDetails));
    }
};

Submission.prototype.findFilePlaceholderFieldId = function(filePlaceholderName, cb) {
    var self = this;
    var fieldDetails = {};
    self.getFileFieldsId(function(err, fieldIds) {
        for (var i = 0; i < fieldIds.length; i++) {
            var fieldId = fieldIds[i];
            var inputValue = self.getInputValueObjectById(fieldId);
            for (var j = 0; j < inputValue.fieldValues.length; j++) {
                var tmpObj = inputValue.fieldValues[j];
                if (tmpObj) {
                    if (tmpObj.fileName !== null && tmpObj.fileName === filePlaceholderName) {
                        fieldDetails.fieldId = fieldId;
                        fieldDetails.valueIndex = j;
                    }
                }
            }
        }
        return cb(null, fieldDetails);
    });
};

Submission.prototype.getInputValueArray = function(fieldIds) {
    var rtn = [];
    for (var i = 0; i < fieldIds.length; i++) {
        var fieldId = fieldIds[i];
        var inputValue = this.getInputValueObjectById(fieldId);
        for (var j = 0; j < inputValue.fieldValues.length; j++) {
            var tmpObj = inputValue.fieldValues[j];
            if (tmpObj) {
                tmpObj.fieldId = fieldId;
                rtn.push(tmpObj);
            }
        }
    }
    return rtn;
};
Submission.prototype.clearLocal = function(cb) {
    var self = this;
    //remove from uploading list
    uploadManager.cancelSubmission(self, function(err, uploadTask) {
        if (err) {
            log.e(err);
            return cb(err);
        }
        //remove from submission list
        submissions.removeSubmission(self.getLocalId(), function(err) {
            if (err) {
                log.e(err);
                return cb(err);
            }
            self.clearLocalSubmissionFiles(function() {
                Model.prototype.clearLocal.call(self, function(err) {
                    if (err) {
                        log.e(err);
                        return cb(err);
                    }
                    cb(null, null);
                });
            });
        });
    });
};
Submission.prototype.getRemoteSubmissionId = function() {
    return this.get("submissionId", "");
};
Submission.prototype.setRemoteSubmissionId = function(submissionId) {
    if (submissionId) {
        this.set("submissionId", submissionId);
    }
};

function newInstance(form, params) {
    params = params ? params : {};
    var sub = new Submission(form, params);

    if (params.submissionId) {
        submissions.updateSubmissionWithoutSaving(sub);
    }
    return sub;
}

function fromLocal(localId, cb) {
    log.d("Submission fromLocal: ", localId);
    if (_submissions[localId]) {
        log.d("Submission fromLocal from cache: ", localId);
        //already loaded
        cb(null, _submissions[localId]);
    } else {
        //load from storage
        log.d("Submission fromLocal not in cache. Loading from local storage.: ", localId);
        var submissionObject = new Submission();
        submissionObject.setLocalId(localId);
        submissionObject.loadLocal(function(err, submission) {
            if (err) {
                log.e("Submission fromLocal. Error loading from local: ", localId, err);
                cb(err);
            } else {
                log.d("Submission fromLocal. Load from local sucessfull: ", localId);
                if (submission.isDownloadSubmission()) {
                    return cb(null, submission);
                } else {
                    submission.reloadForm(function(err, res) {
                        if (err) {
                            log.e("Submission fromLocal. reloadForm. Error re-loading form: ", localId, err);
                            cb(err);
                        } else {
                            log.d("Submission fromLocal. reloadForm. Re-loading form successfull: ", localId);
                            _submissions[localId] = submission;
                            cb(null, submission);
                        }
                    });
                }

            }
        });
    }
}

module.exports = {
    newInstance: newInstance,
    fromLocal: fromLocal
};
},{"./config":48,"./form":61,"./localStorage":67,"./log":68,"./model":69,"./rulesEngine.js":71,"./submissions":75,"./uploadManager":76,"./utils":78,"async":7,"underscore":47}],75:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var submission = require("./submission");
var utils = require("./utils");
var config = require("./config");
var _ = require("underscore");
var async = require("async");

function Submissions() {
    Model.call(this, {
        '_type': 'submissions',
        '_ludid': 'submissions_list',
        'submissions': []
    });
}

utils.extend(Submissions, Model);

Submissions.prototype.setLocalId = function() {
    log.e("Submissions setLocalId. Not Permitted for submissions.");
};
/**
 * save a submission to list and store it immediately
 * @param  {[type]}   submission [description]
 * @param  {Function} cb         [description]
 * @return {[type]}              [description]
 */
Submissions.prototype.saveSubmission = function(submission, cb) {
    log.d("Submissions saveSubmission");
    var self = this;
    this.updateSubmissionWithoutSaving(submission);
    this.clearSentSubmission(function() {
        self.saveLocal(cb);
    });
};
Submissions.prototype.updateSubmissionWithoutSaving = function(submission) {
    log.d("Submissions updateSubmissionWithoutSaving");
    var pruneData = this.pruneSubmission(submission);
    var localId = pruneData._ludid;
    if (localId) {
        var meta = this.findMetaByLocalId(localId);
        var submissions = this.get('submissions');
        if (meta) {
            //existed, remove the old meta and save the new one.
            submissions.splice(submissions.indexOf(meta), 1);
            submissions.push(pruneData);
        } else {
            // not existed, insert to the tail.
            submissions.push(pruneData);
        }
    } else {
        // invalid local id.
        log.e('Invalid submission for localId:', localId, JSON.stringify(submission));
    }
};
Submissions.prototype.clearSentSubmission = function(cb) {
    log.d("Submissions clearSentSubmission");
    var self = this;
    var maxSent = config.get("max_sent_saved") ? config.get("max_sent_saved") : config.get("sent_save_min");
    var submissions = self.get("submissions");
    var sentSubmissions = this.getSubmitted();
    var toBeRemoved = [];

    //Submissions are sorted by the date they were submitted
    sentSubmissions = _.sortBy(sentSubmissions, function(submission) {
        return Date(submission.submittedDate);
    });

    sentSubmissions = _.map(sentSubmissions, function(submission) {
        return submission._ludid;
    });

    //toBeRemoved Submissions = all but the last maxSent submissions
    toBeRemoved = _.without(sentSubmissions, _.last(sentSubmissions, maxSent));

    //Need to map back to submission meta info
    toBeRemoved = _.map(toBeRemoved, function(submissionLocalId) {
        return self.findMetaByLocalId(submissionLocalId);
    });

    async.eachSeries(toBeRemoved, function(submissionMeta, cb) {
        self.getSubmissionByMeta(submissionMeta, function(err, submission) {
            submission.clearLocal(function(err) {
                if (err) {
                    log.e("Submissions clearSentSubmission submission clearLocal", err);
                }
                cb(err);
            });
        });
    }, function(err) {
        if (err) {
            log.e("Error Deleting Submissions");
        }

        cb(err);
    });
};
Submissions.prototype.findByFormId = function(formId) {
    log.d("Submissions findByFormId", formId);
    var rtn = [];
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
        var obj = submissions[i];
        if (submissions[i].formId === formId) {
            rtn.push(obj);
        }
    }
    return rtn;
};
Submissions.prototype.getSubmissions = function() {
    return this.get('submissions');
};
Submissions.prototype.getSubmissionMetaList = Submissions.prototype.getSubmissions;
//function alias
Submissions.prototype.findMetaByLocalId = function(localId) {
    log.d("Submissions findMetaByLocalId", localId);
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
        var obj = submissions[i];
        if (submissions[i]._ludid === localId) {
            return obj;
        }
    }

    //log.e("Submissions findMetaByLocalId: No submissions for localId: ", localId);
    return null;
};

/**
 * Finding a submission object by it's remote Id
 * @param remoteId
 * @returns {*}
 */
Submissions.prototype.findMetaByRemoteId = function(remoteId) {
    remoteId = remoteId || "";

    log.d("Submissions findMetaByRemoteId: " + remoteId);
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
        var obj = submissions[i];
        if (submissions[i].submissionId) {
            if (submissions[i].submissionId === remoteId) {
                return obj;
            }
        }
    }

    return null;
};
Submissions.prototype.pruneSubmission = function(submission) {
    log.d("Submissions pruneSubmission");
    var fields = [
        '_id',
        '_ludid',
        'status',
        'formName',
        'formId',
        '_localLastUpdate',
        'createDate',
        'submitDate',
        'deviceFormTimestamp',
        'errorMessage',
        'submissionStartedTimestamp',
        'submittedDate',
        'submissionId',
        'saveDate',
        'uploadStartDate'
    ];
    var data = submission.getProps();
    var rtn = {};
    for (var i = 0; i < fields.length; i++) {
        var key = fields[i];
        rtn[key] = data[key];
    }
    return rtn;
};

Submissions.prototype.clear = function(cb) {
    log.d("Submissions clear");
    var that = this;
    this.clearLocal(function(err) {
        if (err) {
            log.e(err);
            cb(err);
        } else {
            that.set("submissions", []);
            cb(null, null);
        }
    });
};
Submissions.prototype.getDrafts = function(params) {
    log.d("Submissions getDrafts: ", params);
    if (!params) {
        params = {};
    }
    params.status = "draft";
    return this.findByStatus(params);
};
Submissions.prototype.getPending = function(params) {
    log.d("Submissions getPending: ", params);
    if (!params) {
        params = {};
    }
    params.status = "pending";
    return this.findByStatus(params);
};
Submissions.prototype.getSubmitted = function(params) {
    log.d("Submissions getSubmitted: ", params);
    if (!params) {
        params = {};
    }
    params.status = "submitted";
    return this.findByStatus(params);
};
Submissions.prototype.getError = function(params) {
    log.d("Submissions getError: ", params);
    if (!params) {
        params = {};
    }
    params.status = "error";
    return this.findByStatus(params);
};
Submissions.prototype.getInProgress = function(params) {
    log.d("Submissions getInProgress: ", params);
    if (!params) {
        params = {};
    }
    params.status = "inprogress";
    return this.findByStatus(params);
};
Submissions.prototype.getDownloaded = function(params) {
    log.d("Submissions getDownloaded: ", params);
    if (!params) {
        params = {};
    }
    params.status = "downloaded";
    return this.findByStatus(params);
};
Submissions.prototype.findByStatus = function(params) {
    log.d("Submissions findByStatus: ", params);
    if (!params) {
        params = {};
    }
    if (typeof params === "string") {
        params = {
            status: params
        };
    }
    if (params.status === null) {
        return [];
    }

    var status = params.status;
    var formId = params.formId;
    var sortField = params.sortField || "createDate";

    var submissions = this.get("submissions", []);
    var rtn = _.filter(submissions, function(submission) {
        if (status === submission.status) {
            if (formId) {
                return submission.formId === formId;
            } else {
                return true;
            }
        } else {
            return false;
        }
    });

    rtn = _.sortBy(rtn, function(submission) {
        return Date(submission.sortField);
    });

    return rtn;
};
/**
 * return a submission model object by the meta data passed in.
 * @param  {[type]}   meta [description]
 * @param  {Function} cb   [description]
 * @return {[type]}        [description]
 */
Submissions.prototype.getSubmissionByMeta = function(meta, cb) {
    log.d("Submissions getSubmissionByMeta: ", meta);
    var localId = meta._ludid;
    if (localId) {
        require("./submission").fromLocal(localId, cb);
    } else {
        log.e("Submissions getSubmissionByMeta: local id not found for retrieving submission.", localId, meta);
        cb("local id not found for retrieving submission");
    }
};
Submissions.prototype.removeSubmission = function(localId, cb) {
    log.d("Submissions removeSubmission: ", localId);
    var index = this.indexOf(localId);
    if (index > -1) {
        this.get('submissions').splice(index, 1);
    }
    this.saveLocal(cb);
};
Submissions.prototype.indexOf = function(localId, cb) {
    log.d("Submissions indexOf: ", localId);
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
        var obj = submissions[i];
        if (submissions[i]._ludid === localId) {
            return i;
        }
    }
    return -1;
};
var submissionsModel;

function getSubmissionsModel(){
    if(!submissionsModel){
        submissionsModel = new Submissions();
    }

    return submissionsModel;
}

module.exports = getSubmissionsModel();
},{"./config":48,"./log":68,"./model":69,"./submission":74,"./utils":78,"async":7,"underscore":47}],76:[function(require,module,exports){
/**
 * Manages submission uploading tasks
 */
var Model = require("./model");
var utils = require("./utils");
var log = require("./log");
var dataAgent = require("./dataAgent");
var uploadTask = require("./uploadTask");
var utils = require("./utils");

function UploadManager() {
    var self = this;
    Model.call(self, {
        '_type': 'uploadManager',
        '_ludid': 'uploadManager_queue'
    });

    self.set('taskQueue', []);
    self.sending = false;
    self.timerInterval = 200;
    self.sendingStart = utils.getTime();
}

utils.extend(UploadManager, Model);

/**
 * Queue a submission to uploading tasks queue
 * @param  {[type]} submissionModel [description]
 * @param {Function} cb callback once finished
 * @return {[type]}                 [description]
 */
UploadManager.prototype.queueSubmission = function(submissionModel, cb) {
    log.d("Queueing Submission for uploadManager");
    var utId;
    var subUploadTask = null;
    var self = this;

    self.checkOnlineStatus(function() {
        if (require('./config.js').isOnline()) {
            if (submissionModel.getUploadTaskId()) {
                utId = submissionModel.getUploadTaskId();
            } else {
                subUploadTask = uploadTask.newInstance(submissionModel);
                utId = subUploadTask.getLocalId();
            }
            self.push(utId);
            if (!self.timer) {
                log.d("Starting timer for uploadManager");
                self.start();
            }
            if (subUploadTask) {
                subUploadTask.saveLocal(function(err) {
                    if (err) {
                        log.e(err);
                    }
                    self.saveLocal(function(err) {
                        if (err) {
                            log.e("Error saving upload manager: " + err);
                        }
                        cb(null, subUploadTask);
                    });
                });
            } else {
                self.saveLocal(function(err) {
                    if (err) {
                        log.e("Error saving upload manager: " + err);
                    }
                    self.getTaskById(utId, cb);
                });
            }
        } else {
            return cb("Working offline cannot submit form.");
        }
    });
};

/**
 * cancel a submission uploading
 * @param  {[type]}   submissionsModel [description]
 * @param  {Function} cb               [description]
 * @return {[type]}                    [description]
 */
UploadManager.prototype.cancelSubmission = function(submissionsModel, cb) {
    var uploadTId = submissionsModel.getUploadTaskId();
    var queue = this.get('taskQueue');
    if (uploadTId) {
        var index = queue.indexOf(uploadTId);
        if (index > -1) {
            queue.splice(index, 1);
        }
        this.getTaskById(uploadTId, function(err, task) {
            if (err) {
                log.e(err);
                cb(err, task);
            } else {
                if (task) {
                    task.clearLocal(cb);
                } else {
                    cb(null, null);
                }
            }
        });
        this.saveLocal(function(err) {
            if (err) {
                log.e(err);
            }
        });
    } else {
        cb(null, null);
    }
};

UploadManager.prototype.getTaskQueue = function() {
    return this.get('taskQueue', []);
};
/**
 * start a timer
 * @param  {} interval ms
 * @return {[type]}      [description]
 */
UploadManager.prototype.start = function() {
    var that = this;
    that.stop();
    that.timer = setInterval(function() {
        that.tick();
    }, this.timerInterval);
};
/**
 * stop uploading
 * @return {[type]} [description]
 */
UploadManager.prototype.stop = function() {
    if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
    }
};
UploadManager.prototype.push = function(uploadTaskId) {
    this.get('taskQueue').push(uploadTaskId);
    this.saveLocal(function(err) {
        if (err) {
            log.e("Error saving local Upload manager", err);
        }
    });
};
UploadManager.prototype.shift = function() {
    var shiftedTask = this.get('taskQueue').shift();
    this.saveLocal(function(err) {
        if (err) {
            log.e(err);
        }
    });
    return shiftedTask;
};
UploadManager.prototype.rollTask = function() {
    this.push(this.shift());
};
UploadManager.prototype.tick = function() {
    var self = this;
    if (self.sending) {
        var now = utils.getTime();
        var timePassed = now.getTime() - self.sendingStart.getTime();
        if (timePassed > require('./config.js').get("timeout") * 1000) {
            //time expired. roll current task to the end of queue
            log.e('Uploading content timeout. it will try to reupload.');
            self.sending = false;
            self.rollTask();
        }
    } else {
        if (self.hasTask()) {
            self.sending = true;
            self.sendingStart = utils.getTime();

            self.getCurrentTask(function(err, task) {
                if (err || !task) {
                    log.e(err);
                    self.sending = false;
                } else {
                    if (task.isCompleted() || task.isError()) {
                        //current task uploaded or aborted by error. shift it from queue
                        self.shift();
                        self.sending = false;
                        self.saveLocal(function(err) {
                            if (err) {
                                log.e("Error saving upload manager: ", err);
                            }
                        });
                    } else {
                        self.checkOnlineStatus(function() {
                            if (require('./config.js').isOnline()) {
                                task.uploadTick(function(err) {
                                    if (err) {
                                        log.e("Error on upload tick: ", err, task);
                                    }

                                    //callback when finished. ready for next upload command
                                    self.sending = false;
                                });
                            } else {
                                log.d("Upload Manager: Tick: Not online.");
                            }
                        });
                    }
                }
            });
        } else {
            //no task . stop timer.
            self.stop();
        }
    }
};
UploadManager.prototype.hasTask = function() {
    return this.get('taskQueue').length > 0;
};
UploadManager.prototype.getCurrentTask = function(cb) {
    var taskId = this.getTaskQueue()[0];
    if (taskId) {
        this.getTaskById(taskId, cb);
    } else {
        cb(null, null);
    }
};
UploadManager.prototype.checkOnlineStatus = function(cb) {
    return dataAgent.checkOnlineStatus(cb);
};
UploadManager.prototype.getTaskById = function(taskId, cb) {
    return uploadTask.fromLocal(taskId, cb);
};

module.exports = new UploadManager();
},{"./config.js":48,"./dataAgent":49,"./log":68,"./model":69,"./uploadTask":77,"./utils":78}],77:[function(require,module,exports){
/**
 * Uploading task for each submission
 */

var Model = require("./model");
var log = require("./log");
var config = require("./config");
var dataAgent = require("./dataAgent");
var FormSubmission = require("./formSubmission");
var FormSubmissionDownload = require("./formSubmissionDownload");
var FormSubmissionStatus = require("./formSubmissionStatus");
var Base64FileSubmission = require("./fileSubmissionBase64");
var FileSubmission = require("./fileSubmission");
var FileSubmissionDownload = require("./fileSubmissionDownload");
var FormSubmissionComplete = require("./formSubmissionComplete");
var Form = require("./form");
var submission = require("./submission");
var utils = require("./utils");

var _uploadTasks = {};

function newInstance(submissionModel) {
    if (submissionModel) {
        var utObj = new UploadTask();
        utObj.init(submissionModel);
        _uploadTasks[utObj.getLocalId()] = utObj;
        return utObj;
    } else {
        return {};
    }
}


function fromLocal(localId, cb) {
    if (_uploadTasks[localId]) {
        return cb(null, _uploadTasks[localId]);
    }
    var utObj = new UploadTask();
    utObj.setLocalId(localId);
    _uploadTasks[localId] = utObj;
    utObj.loadLocal(cb);
}


function UploadTask() {
    Model.call(this, {
        '_type': 'uploadTask'
    });
}

utils.extend(UploadTask, Model);

UploadTask.prototype.init = function(submissionModel) {
    var self = this;
    var submissionLocalId = submissionModel.getLocalId();
    self.setLocalId(submissionLocalId + '_' + 'uploadTask');
    self.set('submissionLocalId', submissionLocalId);
    self.set('fileTasks', []);
    self.set('currentTask', null);
    self.set('completed', false);
    self.set('retryAttempts', 0);
    self.set('retryNeeded', false);
    self.set('mbaasCompleted', false);
    self.set('submissionTransferType', 'upload');
    submissionModel.setUploadTaskId(self.getLocalId());

    function initSubmissionUpload() {
        var json = submissionModel.getProps();
        self.set('jsonTask', json);
        self.set('formId', submissionModel.get('formId'));

    }

    function initSubmissionDownload() {
        self.set('submissionId', submissionModel.getRemoteSubmissionId());
        self.set('jsonTask', {});
        self.set('submissionTransferType', 'download');
    }

    if (submissionModel.isDownloadSubmission()) {
        initSubmissionDownload();
    } else {
        initSubmissionUpload();
    }
};
UploadTask.prototype.getTotalSize = function() {
    var self = this;
    var jsonSize = JSON.stringify(self.get('jsonTask')).length;
    var fileTasks = self.get('fileTasks');
    var fileSize = 0;
    var fileTask;
    for (var i = 0; i < fileTasks.length; i++) {
        fileTask = fileTasks[i];
        fileSize += fileTask.fileSize;
    }
    return jsonSize + fileSize;
};
UploadTask.prototype.getUploadedSize = function() {
    var currentTask = this.getCurrentTask();
    if (currentTask === null) {
        return 0;
    } else {
        var jsonSize = JSON.stringify(this.get('jsonTask')).length;
        var fileTasks = this.get('fileTasks');
        var fileSize = 0;
        for (var i = 0, fileTask;
            (fileTask = fileTasks[i]) && i < currentTask; i++) {
            fileSize += fileTask.fileSize;
        }
        return jsonSize + fileSize;
    }
};
UploadTask.prototype.getRemoteStore = function() {
    return dataAgent.remoteStore;
};
UploadTask.prototype.addFileTasks = function(submissionModel, cb) {
    var self = this;
    submissionModel.getFileInputValues(function(err, files) {
        if (err) {
            log.e("Error getting file Input values: " + err);
            return cb(err);
        }
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            self.addFileTask(file);
        }
        cb();
    });
};
UploadTask.prototype.addFileTask = function(fileDef) {
    this.get('fileTasks').push(fileDef);
};
/**
 * get current uploading task
 * @return {[type]} [description]
 */
UploadTask.prototype.getCurrentTask = function() {
    return this.get('currentTask', null);
};
UploadTask.prototype.getRetryAttempts = function() {
    return this.get('retryAttempts');
};
UploadTask.prototype.increRetryAttempts = function() {
    this.set('retryAttempts', this.get('retryAttempts') + 1);
};
UploadTask.prototype.resetRetryAttempts = function() {
    this.set('retryAttempts', 0);
};
UploadTask.prototype.isStarted = function() {
    return this.getCurrentTask() === null ? false : true;
};


UploadTask.prototype.setSubmissionQueued = function(cb) {
    var self = this;
    self.submissionModel(function(err, submission) {
        if (err) {
            return cb(err);
        }

        if (self.get("submissionId")) {
            submission.setRemoteSubmissionId(self.get("submissionId"));
        }

        submission.queued(cb);
    });
};
/**
 * upload/download form submission
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
UploadTask.prototype.uploadForm = function(cb) {
    var self = this;

    function processUploadDataResult(res) {
        log.d("In processUploadDataResult");
        var formSub = self.get("jsonTask");
        if (res.error) {
            log.e("Error submitting form " + res.error);
            return cb("Error submitting form " + res.error);
        } else {
            var submissionId = res.submissionId;
            // form data submitted successfully.
            formSub.lastUpdate = utils.getTime();
            self.set('submissionId', submissionId);

            self.setSubmissionQueued(function(err) {
                self.increProgress();
                self.saveLocal(function(err) {
                    if (err) {
                        log.e("Error saving uploadTask to local storage" + err);
                    }
                });
                self.emit('progress', self.getProgress());
                return cb(null);
            });
        }
    }

    function processDownloadDataResult(err, res) {
        log.d("In processDownloadDataResult");
        if (err) {
            log.e("Error downloading submission data" + err);
            return cb(err);
        }

        //Have the definition of the submission
        self.submissionModel(function(err, submissionModel) {
            log.d("Got SubmissionModel", err, submissionModel);
            if (err) {
                return cb(err);
            }
            var JSONRes = {};

            //Instantiate the model from the json definition
            if (typeof(res) === "string") {
                try {
                    JSONRes = JSON.parse(res);
                } catch (e) {
                    log.e("processDownloadDataResult Invalid JSON Object Returned", res);
                    return cb("Invalid JSON Object Returned");
                }
            } else {
                JSONRes = res;
            }

            if (JSONRes.status) {
                delete JSONRes.status;
            }

            submissionModel.fromJSON(JSONRes);
            self.set('jsonTask', res);
            submissionModel.saveLocal(function(err) {
                log.d("Saved SubmissionModel", err, submissionModel);
                if (err) {
                    log.e("Error saving updated submission from download submission: " + err);
                }

                //Submission Model is now populated with all the fields in the submission
                self.addFileTasks(submissionModel, function(err) {
                    log.d("addFileTasks called", err, submissionModel);
                    if (err) {
                        return cb(err);
                    }
                    self.increProgress();
                    self.saveLocal(function(err) {
                        if (err) {
                            log.e("Error saving downloadTask to local storage" + err);
                        }

                        self.emit('progress', self.getProgress());
                        return cb();
                    });
                });
            });
        });
    }

    function uploadSubmissionJSON() {
        log.d("In uploadSubmissionJSON");
        var formSub = self.get('jsonTask');
        self.submissionModel(function(err, submissionModel) {
            if (err) {
                return cb(err);
            }
            self.addFileTasks(submissionModel, function(err) {
                if (err) {
                    log.e("Error adding file tasks for submission upload");
                    return cb(err);
                }

                var formSubmissionModel = new FormSubmission(formSub);
                self.getRemoteStore().create(formSubmissionModel, function(err, res) {
                    if (err) {
                        return cb(err);
                    } else {
                        var updatedFormDefinition = res.updatedFormDefinition;
                        if (updatedFormDefinition) {
                            // remote form definition is updated
                            self.refreshForm(updatedFormDefinition, function(err) {
                                //refresh form def in parallel. maybe not needed.
                                log.d("Form Updated, refreshed");
                                if (err) {
                                    log.e(err);
                                }
                                processUploadDataResult(res);
                            });
                        } else {
                            processUploadDataResult(res);
                        }
                    }
                });
            });
        });

    }

    function downloadSubmissionJSON() {
        var formSubmissionDownload = new FormSubmissionDownload(self);
        self.getRemoteStore().read(formSubmissionDownload, processDownloadDataResult);
    }

    if (self.isDownloadTask()) {
        downloadSubmissionJSON();
    } else {
        uploadSubmissionJSON();
    }
};

/**
 * Handles the case where a call to completeSubmission returns a status other than "completed".
 * Will only ever get to this function when a call is made to the completeSubmission server.
 *
 *
 * @param err (String) Error message associated with the error returned
 * @param res {"status" : <pending/error>, "pendingFiles" : [<any pending files not yet uploaded>]}
 * @param cb Function callback
 */
UploadTask.prototype.handleCompletionError = function(err, res, cb) {
    log.d("handleCompletionError Called");
    var errorMessage = err;
    if (res.status === 'pending') {
        //The submission is not yet complete, there are files waiting to upload. This is an unexpected state as all of the files should have been uploaded.
        errorMessage = 'Submission Still Pending.';
    } else if (res.status === 'error') {
        //There was an error completing the submission.
        errorMessage = 'Error completing submission';
    } else {
        errorMessage = 'Invalid return type from complete submission';
    }
    cb(errorMessage);
};

/**
 * Handles the case where the current submission status is required from the server.
 * Based on the files waiting to be uploaded, the upload task is re-built with pendingFiles from the server.
 *
 * @param cb
 */
UploadTask.prototype.handleIncompleteSubmission = function(cb) {
    var self = this;

    function processUploadIncompleteSubmission() {

        var remoteStore = self.getRemoteStore();
        var submissionStatus = new FormSubmissionStatus(self);

        remoteStore.submissionStatus(submissionStatus, function(err, res) {
            var errMessage = "";
            if (err) {
                cb(err);
            } else if (res.status === 'error') {
                //The server had an error submitting the form, finish with an error
                errMessage = 'Error submitting form.';
                cb(errMessage);
            } else if (res.status === 'complete') {
                //Submission is complete, make uploading progress further
                self.increProgress();
                cb();
            } else if (res.status === 'pending') {
                //Submission is still pending, check for files not uploaded yet.
                var pendingFiles = res.pendingFiles || [];
                if (pendingFiles.length > 0) {
                    self.resetUploadTask(pendingFiles, function() {
                        cb();
                    });
                } else {
                    //No files pending on the server, make the progress further
                    self.increProgress();
                    cb();
                }
            } else {
                //Should not get to this point. Only valid status responses are error, pending and complete.
                errMessage = 'Invalid submission status response.';
                cb(errMessage);
            }
        });
    }

    function processDownloadIncompleteSubmission() {
        //No need to go the the server to get submission details -- The current progress status is valid locally
        cb();
    }

    if (self.isDownloadTask()) {
        processDownloadIncompleteSubmission();
    } else {
        processUploadIncompleteSubmission();
    }
};

/**
 * Resetting the upload task based on the response from getSubmissionStatus
 * @param pendingFiles -- Array of files still waiting to upload
 * @param cb
 */
UploadTask.prototype.resetUploadTask = function(pendingFiles, cb) {
    var filesToUpload = this.get('fileTasks');
    var resetFilesToUpload = [];
    var fileIndex;
    //Adding the already completed files to the reset array.
    for (fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++) {
        if (pendingFiles.indexOf(filesToUpload[fileIndex].hashName) < 0) {
            resetFilesToUpload.push(filesToUpload[fileIndex]);
        }
    }
    //Adding the pending files to the end of the array.
    for (fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++) {
        if (pendingFiles.indexOf(filesToUpload[fileIndex].hashName) > -1) {
            resetFilesToUpload.push(filesToUpload[fileIndex]);
        }
    }
    var resetFileIndex = filesToUpload.length - pendingFiles.length - 1;
    var resetCurrentTask = 0;
    if (resetFileIndex > 0) {
        resetCurrentTask = resetFileIndex;
    }
    //Reset current task
    this.set('currentTask', resetCurrentTask);
    this.set('fileTasks', resetFilesToUpload);
    this.saveLocal(cb); //Saving the reset files list to local
};
UploadTask.prototype.uploadFile = function(cb) {
    var self = this;
    var progress = self.getCurrentTask();

    if (progress === null) {
        progress = 0;
        self.set('currentTask', progress);
    }
    var fileTask = self.get('fileTasks', [])[progress];
    var submissionId = self.get('submissionId');
    var fileSubmissionModel;
    if (!fileTask) {
        log.e("No file task found when trying to transfer a file.");
        return cb('cannot find file task');
    }

    if (!submissionId) {
        log.e("No submission id found when trying to transfer a file.");
        return cb("No submission Id found");
    }

    function processUploadFile() {
        log.d("processUploadFile for submissionId: ");
        if (fileTask.contentType === 'base64') {
            fileSubmissionModel = new Base64FileSubmission(fileTask);
        } else {
            fileSubmissionModel = new FileSubmission(fileTask);
        }
        fileSubmissionModel.setSubmissionId(submissionId);
        fileSubmissionModel.loadFile(function(err) {
            if (err) {
                log.e("Error loading file for upload: " + err);
                return cb(err);
            } else {
                self.getRemoteStore().create(fileSubmissionModel, function(err, res) {
                    if (err) {
                        cb(err);
                    } else {
                        if (res.status === 'ok' || res.status === 200 || res.status === '200') {
                            fileTask.updateDate = utils.getTime();
                            self.increProgress();
                            self.saveLocal(function(err) {
                                //save current status.
                                if (err) {
                                    log.e("Error saving upload task" + err);
                                }
                            });
                            self.emit('progress', self.getProgress());
                            cb(null);
                        } else {
                            var errorMessage = 'File upload failed for file: ' + fileTask.fileName;
                            cb(errorMessage);
                        }
                    }
                });
            }
        });
    }

    function processDownloadFile() {
        log.d("processDownloadFile called");
        fileSubmissionModel = new FileSubmissionDownload(fileTask);
        fileSubmissionModel.setSubmissionId(submissionId);
        self.getRemoteStore().read(fileSubmissionModel, function(err, localFilePath) {
            if (err) {
                log.e("Error downloading a file from remote: " + err);
                return cb(err);
            }

            log.d("processDownloadFile called. Local File Path: " + localFilePath);

            //Update the submission model to add local file uri to a file submission object
            self.submissionModel(function(err, submissionModel) {
                if (err) {
                    log.e("Error Loading submission model for processDownloadFile " + err);
                    return cb(err);
                }

                submissionModel.updateFileLocalURI(fileTask, localFilePath, function(err) {
                    if (err) {
                        log.e("Error updating file local url for fileTask " + JSON.stringify(fileTask));
                        return cb(err);
                    }

                    self.increProgress();
                    self.saveLocal(function(err) {
                        //save current status.
                        if (err) {
                            log.e("Error saving download task");
                        }
                    });
                    self.emit('progress', self.getProgress());
                    return cb();
                });
            });
        });
    }

    if (self.isDownloadTask()) {
        processDownloadFile();
    } else {
        processUploadFile();
    }
};
UploadTask.prototype.isDownloadTask = function() {
    return this.get("submissionTransferType") === "download";
};
//The upload task needs to be retried
UploadTask.prototype.setRetryNeeded = function(retryNeeded) {
    //If there is a submissionId, then a retry is needed. If not, then the current task should be set to null to retry the submission.
    if (this.get('submissionId', null) !== null) {
        this.set('retryNeeded', retryNeeded);
    } else {
        this.set('retryNeeded', false);
        this.set('currentTask', null);
    }
};
UploadTask.prototype.retryNeeded = function() {
    return this.get('retryNeeded');
};
UploadTask.prototype.uploadTick = function(cb) {
    var self = this;

    function _handler(err) {
        if (err) {
            log.d('Err, retrying transfer: ' + self.getLocalId());
            //If the upload has encountered an error -- flag the submission as needing a retry on the next tick -- User should be insulated from an error until the retries are finished.
            self.increRetryAttempts();
            if (self.getRetryAttempts() <= config.get('max_retries')) {
                self.setRetryNeeded(true);
                self.saveLocal(function(err) {
                    if (err) {
                        log.e("Error saving upload taskL " + err);
                    }

                    cb();
                });
            } else {
                //The number of retry attempts exceeds the maximum number of retry attempts allowed, flag the upload as an error.
                self.setRetryNeeded(true);
                self.resetRetryAttempts();
                self.error(err, function() {
                    cb(err);
                });
            }
        } else {
            //no error.
            self.setRetryNeeded(false);
            self.saveLocal(function(_err) {
                if (_err) {
                    log.e("Error saving upload task to local memory" + _err);
                }
            });
            self.submissionModel(function(err, submission) {
                if (err) {
                    cb(err);
                } else {
                    var status = submission.get('status');
                    if (status !== 'inprogress' && status !== 'submitted' && status !== 'downloaded' && status !== 'queued') {
                        log.e('Submission status is incorrect. Upload task should be started by submission object\'s upload method.' + status);
                        cb('Submission status is incorrect. Upload task should be started by submission object\'s upload method.');
                    } else {
                        cb();
                    }
                }
            });
        }
    }
    if (!this.isFormCompleted()) {
        // No current task, send the form json
        this.uploadForm(_handler);
    } else if (this.retryNeeded()) {
        //If a retry is needed, this tick gets the current status of the submission from the server and resets the submission.
        this.handleIncompleteSubmission(_handler);
    } else if (!this.isFileCompleted()) {
        //files to be uploaded
        this.uploadFile(_handler);
    } else if (!this.isMBaaSCompleted()) {
        //call mbaas to complete upload
        this.uploadComplete(_handler);
    } else if (!this.isCompleted()) {
        //complete the upload task
        this.success(_handler);
    } else {
        //task is already completed.
        _handler(null, null);
    }
};
UploadTask.prototype.increProgress = function() {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
        curTask = 0;
    } else {
        curTask++;
    }
    this.set('currentTask', curTask);
};
UploadTask.prototype.uploadComplete = function(cb) {
    log.d("UploadComplete Called");
    var self = this;
    var submissionId = self.get('submissionId', null);

    if (submissionId === null) {
        return cb('Failed to complete submission. Submission Id not found.');
    }

    function processDownloadComplete() {
        log.d("processDownloadComplete Called");
        self.increProgress();
        cb(null);
    }

    function processUploadComplete() {
        log.d("processUploadComplete Called");
        var remoteStore = self.getRemoteStore();
        var completeSubmission = new FormSubmissionComplete(self);
        remoteStore.create(completeSubmission, function(err, res) {
            //if status is not "completed", then handle the completion err
            res = res || {};
            if (res.status !== 'complete') {
                return self.handleCompletionError(err, res, cb);
            }
            //Completion is now completed sucessfully.. we can make the progress further.
            self.increProgress();
            cb(null);
        });
    }

    if (self.isDownloadTask()) {
        processDownloadComplete();
    } else {
        processUploadComplete();
    }
};
/**
 * the upload task is successfully completed. This will be called when all uploading process finished successfully.
 * @return {[type]} [description]
 */
UploadTask.prototype.success = function(cb) {
    log.d("Transfer Sucessful. Success Called.");
    var self = this;
    var submissionId = self.get('submissionId', null);
    self.set('completed', true);


    function processUploadSuccess(cb) {
        log.d("processUploadSuccess Called");
        self.submissionModel(function(_err, model) {
            if (_err) {
                return cb(_err);
            }
            model.set('submissionId', submissionId);
            model.submitted(cb);
        });
    }

    function processDownloadSuccess(cb) {
        log.d("processDownloadSuccess Called");
        self.submissionModel(function(_err, model) {
            if (_err) {
                return cb(_err);
            } else {
                model.populateFilesInSubmission();
                model.downloaded(cb);
            }
        });
    }

    self.saveLocal(function(err) {
        if (err) {
            log.e("Error Clearing Upload Task");
        }

        if (self.isDownloadTask()) {
            processDownloadSuccess(function(err) {
                self.clearLocal(cb);
            });
        } else {
            processUploadSuccess(function(err) {
                self.clearLocal(cb);
            });
        }
    });
};
/**
 * the upload task is failed. It will not complete the task but will set error with error returned.
 * @param  {[type]}   err [description]
 * @param  {Function} cb  [description]
 * @return {[type]}       [description]
 */
UploadTask.prototype.error = function(uploadErrorMessage, cb) {
    var self = this;
    log.e("Error uploading submission: ", uploadErrorMessage);
    self.set('error', uploadErrorMessage);
    self.saveLocal(function(err) {
        if (err) {
            log.e('Upload task save failed: ' + err);
        }

        self.submissionModel(function(_err, model) {
            if (_err) {
                cb(_err);
            } else {
                model.setUploadTaskId(null);
                model.error(uploadErrorMessage, function(err) {
                    if (err) {
                        log.e("Error updating submission model to error status ", err);
                    }
                    self.clearLocal(function(err) {
                        if (err) {
                            log.e("Error clearing upload task local storage: ", err);
                        }
                        cb(err);
                    });
                });
            }
        });
    });
};
UploadTask.prototype.isFormCompleted = function() {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
        return false;
    } else {
        return true;
    }
};
UploadTask.prototype.isFileCompleted = function() {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
        return false;
    } else if (curTask < this.get('fileTasks', []).length) {
        return false;
    } else {
        return true;
    }
};
UploadTask.prototype.isError = function() {
    var error = this.get('error', null);
    if (error) {
        return true;
    } else {
        return false;
    }
};
UploadTask.prototype.isCompleted = function() {
    return this.get('completed', false);
};
UploadTask.prototype.isMBaaSCompleted = function() {
    var self = this;
    if (!self.isFileCompleted()) {
        return false;
    } else {
        var curTask = self.getCurrentTask();
        if (curTask > self.get('fileTasks', []).length) {
            //change offset if completion bit is changed
            self.set("mbaasCompleted", true);
            self.saveLocal(function(err) {
                if (err) {
                    log.e("Error saving upload task: ", err);
                }
            });
            return true;
        } else {
            return false;
        }
    }
};
UploadTask.prototype.getProgress = function() {
    var self = this;
    var rtn = {
        'formJSON': false,
        'currentFileIndex': 0,
        'totalFiles': self.get('fileTasks').length,
        'totalSize': self.getTotalSize(),
        'uploaded': self.getUploadedSize(),
        'retryAttempts': self.getRetryAttempts(),
        'submissionTransferType': self.get('submissionTransferType')
    };
    var progress = self.getCurrentTask();
    if (progress === null) {
        return rtn;
    } else {
        rtn.formJSON = true;
        rtn.currentFileIndex = progress;
    }
    return rtn;
};
/**
 * Refresh related form definition.
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
UploadTask.prototype.refreshForm = function(updatedForm, cb) {
    var formId = this.get('formId');
    new Form({
        'formId': formId,
        'rawMode': true,
        'rawData': updatedForm
    }, function(err, form) {
        if (err) {
            log.e(err);
        }

        log.l('successfully updated form the form with id ' + updatedForm._id);
        cb();
    });
};
UploadTask.prototype.submissionModel = function(cb) {
    require("./submission").fromLocal(this.get('submissionLocalId'), function(err, submission) {
        if (err) {
            log.e("Error getting submission model from local memory " + err);
        }
        cb(err, submission);
    });
};

module.exports = {
    'newInstance': newInstance,
    'fromLocal': fromLocal
};
},{"./config":48,"./dataAgent":49,"./fileSubmission":57,"./fileSubmissionBase64":58,"./fileSubmissionDownload":59,"./form":61,"./formSubmission":62,"./formSubmissionComplete":63,"./formSubmissionDownload":64,"./formSubmissionStatus":65,"./log":68,"./model":69,"./submission":74,"./utils":78}],78:[function(require,module,exports){
var md5Node = require("md5-node");
var _ = require('underscore');

function isPhoneGap() {
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
}

function extend(child, parent) {
    return _.extend(child.prototype, parent.prototype);
}

function getTime(timezoneOffset) {
    var now = new Date();
    if (timezoneOffset) {
        return now.getTimezoneOffset();
    } else {
        return now;
    }
}

function localId(model) {
    var ts = getTime().getTime();
    var _id = model.getRemoteId() || "";
    var _type = model.getType();

    return '' + _type + '_' + (_id.length > 0 ? _id + "_" : "") + ts;
}

/**
 * md5 hash a string
 * @param  {[type]}   str [description]
 * @param  {Function} cb  (err,md5str)
 * @return {[type]}       [description]
 */
function md5(str, cb) {
    if(typeof(str) !== 'string'){
        return cb("No String To Hash");
    }

    return cb(null, md5Node(str));
}

function send(params, cb) {
    log.d("Sending mail: ", params);
    if (isPhoneGap() && window.plugin.email) {
        window.plugin.email.isServiceAvailable(function(emailAvailable) {
            if (emailAvailable) {
                window.plugin.email.open(params);
                return cb();
            } else {
                return cb("Email Not Available");
            }
        });
    } else {
        return cb("Email Not Supported.");
    }
}

module.exports = {
    extend: extend,
    localId: localId,
    md5: md5,
    getTime: getTime,
    send: send,
    isPhoneGap: isPhoneGap
};

},{"md5-node":45,"underscore":47}],79:[function(require,module,exports){
var log = require("./log");
var utils = require("./utils");
var _ajax = require("../libs/ajax");
var fileSystem = require("./fileSystem");

function get(url, cb) {
    log.d("Ajax get ", url);
    _ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        timeout: require("./config").get("timeout"),
        success: function(data, text) {
            log.d("Ajax get", url, "Success");
            cb(null, data);
        },
        error: function(xhr, status, err) {
            log.e("Ajax get", url, "Fail", xhr, status, err);
            cb(err);
        }
    });
}

function post(url, body, cb) {
    log.d("Ajax post ", url, body);
    var file = false;
    var formData;
    if (typeof body === 'object') {
        if (body instanceof File) {
            file = true;
            formData = new FormData();
            var name = body.name;
            formData.append(name, body);
            body = formData;
        } else {
            body = JSON.stringify(body);
        }
    }
    var param = {
        url: url,
        type: 'POST',
        data: body,
        dataType: 'json',
        timeout: require("./config").get("timeout"),
        success: function(data, text) {
            log.d("Ajax post ", url, " Success");
            cb(null, data);
        },
        error: function(xhr, status, err) {
            log.e("Ajax post ", url, " Fail ", xhr, status, err);
            cb(xhr);
        }
    };
    if (file === false) {
        param.contentType = 'application/json';
    } else {
        param.contentType = 'multipart/form-data';
    }
    _ajax(param);
}

function uploadFile(url, fileProps, cb) {
    log.d("Phonegap uploadFile ", url, fileProps);
    var filePath = fileProps.fullPath;

    if (!require("./config").isOnline()) {
        log.e("Phonegap uploadFile. Not Online.", url, fileProps);
        return cb("No Internet Connection Available.");
    }

    var success = function(r) {
        log.d("upload to url ", url, " sucessful");
        r.response = r.response || {};
        if (typeof r.response === "string") {
            r.response = JSON.parse(r.response);
        }
        cb(null, r.response);
    };

    var fail = function(error) {
        log.e("An error uploading a file has occurred: Code = " + error.code);
        log.d("upload error source " + error.source);
        log.d("upload error target " + error.target);
        cb(error);
    };

    var options = new FileUploadOptions();
    //important - empty fileName will cause file upload fail on WP!!
    options.fileName = (null === fileProps.name || "" === fileProps.name) ? "image.png" : fileProps.name;
    options.mimeType = fileProps.contentType ? fileProps.contentType : "application/octet-stream";
    options.httpMethod = "https";
    options.chunkedMode = true;
    options.fileKey = "file";

    //http://grandiz.com/phonegap-development/phonegap-file-transfer-error-code-3-solved/
    options.headers = {
        "Connection": "close"
    };

    log.d("Beginning file upload ", url, options);
    var ft = new FileTransfer();
    ft.upload(filePath, encodeURI(url), success, fail, options);
}

function downloadFile(url, fileMetaData, cb) {
    log.d("Phonegap downloadFile ", url, fileMetaData);
    var ft = new FileTransfer();

    if (!require("./config").isOnline()) {
        log.e("Phonegap downloadFile. Not Online.", url, fileMetaData);
        return cb("No Internet Connection Available.");
    }

    fileSystem.getBasePath(function(err, basePath) {
        if (err) {
            log.e("Error getting base path for file download: " + url);
            return cb(err);
        }

        function success(fileEntry) {
            log.d("File Download Completed Successfully. FilePath: " + fileEntry.fullPath);
            return cb(null, fileEntry.toURL());
        }

        function fail(error) {
            log.e("Error downloading file " + fileMetaData.fileName + " code: " + error.code);
            return cb("Error downloading file " + fileMetaData.fileName + " code: " + error.code);
        }

        if (fileMetaData.fileName) {
            log.d("File name for file " + fileMetaData.fileName + " found. Starting download");
            var fullPath = basePath + fileMetaData.fileName;
            ft.download(encodeURI(url), fullPath, success, fail, false, {
                headers: {
                    "Connection": "close"
                }
            });
        } else {
            log.e("No file name associated with the file to download");
            return cb("No file name associated with the file to download");
        }
    });
}

module.exports = {
    get: get,
    post: post,
    uploadFile: uploadFile,
    downloadFile: downloadFile
};

},{"../libs/ajax":1,"./config":48,"./fileSystem":60,"./log":68,"./utils":78}],80:[function(require,module,exports){
module.exports={
  "sent_save_min": 5,
  "sent_save_max": 1000,
  "targetWidth": 100,
  "targetHeight": 100,
  "quality": 75,
  "debug_mode": false,
  "logger" : true,
  "max_retries" : 2,
  "timeout" : 7,
  "log_line_limit": 300,
  "log_level": 3,
  "log_levels": ["error", "warning", "log", "debug"],
  "log_email": "test@feedhenry.com",
  "config_admin_user": true
}
},{}],81:[function(require,module,exports){
module.exports={
    "_id": "54d4cd220a9b02c67e9c3f0c",
    "createdBy": "test@example.com",
    "description": "Testing all field types",
    "name": "Test All Form Things",
    "updatedBy": "test@example.com",
    "lastUpdatedTimestamp": 1423233067566,
    "lastUpdated": "2015-02-06T14:31:07.566Z",
    "dateCreated": "2015-02-06T14:18:10.798Z",
    "pageRules": [],
    "fieldRules": [],
    "pages": [{
        "_id": "54d4cd220a9b02c67e9c3efd",
        "fields": [{
            "fieldOptions": {
                "validation": {
                    "min": "5"
                }
            },
            "helpText": "Input Some Text",
            "name": "Text",
            "required": false,
            "type": "text",
            "_id": "54d4cd220a9b02c67e9c3ef9",
            "adminOnly": false,
            "repeating": false
        }, {
            "_id": "54d4cd220a9b02c67e9c3efa",
            "fieldOptions": {
                "definition": {
                    "defaultValue": "3"
                },
                "validation": {
                    "min": 0,
                    "max": 99
                }
            },
            "helpText": "Enter A Number",
            "name": "Number",
            "required": false,
            "type": "number",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "validation": {
                    "validateImmediately": true
                }
            },
            "required": false,
            "type": "barcode",
            "name": "Barcode",
            "fieldCode": null,
            "_id": "54d4cd7e0a9b02c67e9c3f0d",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "validation": {
                    "validateImmediately": true
                }
            },
            "required": false,
            "type": "sectionBreak",
            "name": "Section Break",
            "fieldCode": null,
            "helpText": "This is a section break",
            "_id": "54d4ce6b4e6821c12b30ac39",
            "adminOnly": false,
            "repeating": false
        }, {
            "name": "Web URL",
            "required": false,
            "type": "url",
            "_id": "54d4cd220a9b02c67e9c3efb",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "options": [{
                        "checked": false,
                        "label": "Radio 1"
                    }, {
                        "checked": true,
                        "label": "Radio 2"
                    }]
                }
            },
            "helpText": "Radio Buttons",
            "name": "Radio",
            "required": false,
            "type": "radio",
            "_id": "54d4cd220a9b02c67e9c3efc",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "locationUnit": "latlong"
                }
            },
            "helpText": "Location Lat Long",
            "name": "Location",
            "required": false,
            "type": "location",
            "_id": "54d4cd220a9b02c67e9c3eff",
            "adminOnly": false,
            "repeating": false
        }, {
            "helpText": "Write A Signature",
            "name": "Signature",
            "required": false,
            "type": "signature",
            "_id": "54d4cd220a9b02c67e9c3f00",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "defaultValue": "Paragraph"
                },
                "validation": {
                    "min": "4"
                }
            },
            "helpText": "Paragraph",
            "name": "Paragraph",
            "required": false,
            "type": "textarea",
            "_id": "54d4cd220a9b02c67e9c3f01",
            "adminOnly": false,
            "repeating": false
        }, {
            "helpText": "Enter Email Address",
            "name": "E-Mail",
            "required": false,
            "type": "emailAddress",
            "_id": "54d4cd220a9b02c67e9c3f02",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "include_blank_option": true,
                    "options": [{
                        "checked": true,
                        "label": "Value 1"
                    }, {
                        "checked": false,
                        "label": "Value 2"
                    }]
                }
            },
            "helpText": "Dropdown Menu",
            "name": "Dropdown",
            "required": false,
            "type": "dropdown",
            "_id": "54d4cd220a9b02c67e9c3f04",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "options": [{
                        "checked": false,
                        "label": "Checkbox 1"
                    }, {
                        "checked": false,
                        "label": "Checkbox 2"
                    }]
                }
            },
            "helpText": "Checkboxes",
            "name": "Checkboxes",
            "required": false,
            "type": "checkboxes",
            "_id": "54d4cd220a9b02c67e9c3f05",
            "adminOnly": false,
            "repeating": false
        }, {
            "helpText": "Map Location",
            "name": "Map",
            "required": false,
            "type": "locationMap",
            "_id": "54d4cd220a9b02c67e9c3f06",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "photoHeight": "1000",
                    "photoQuality": "50",
                    "photoWidth": "1000"
                }
            },
            "helpText": "Photo Capture",
            "name": "Photo Capture",
            "required": false,
            "type": "photo",
            "_id": "54d4cd220a9b02c67e9c3f07",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "datetimeUnit": "time"
                }
            },
            "helpText": "Time Only",
            "name": "Date Stamp",
            "required": false,
            "type": "dateTime",
            "_id": "54d4cd220a9b02c67e9c3f08",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "datetimeUnit": "date"
                }
            },
            "helpText": "Date Only",
            "name": "Date Stamp",
            "required": false,
            "type": "dateTime",
            "_id": "54d4cd220a9b02c67e9c3f09",
            "adminOnly": false,
            "repeating": false
        }, {
            "fieldOptions": {
                "definition": {
                    "datetimeUnit": "datetime"
                }
            },
            "helpText": "Date And Time",
            "name": "Date Stamp",
            "required": false,
            "type": "dateTime",
            "_id": "54d4cd220a9b02c67e9c3f0a",
            "adminOnly": false,
            "repeating": false
        },
        {
            "fieldOptions": {
                
            },
            "helpText": "File",
            "name": "File",
            "required": false,
            "type": "file",
            "_id": "54d4cd220a9b02c67e9c1245",
            "adminOnly": false,
            "repeating": false
        }]
    }],
    "pageRef": {
        "54d4cd220a9b02c67e9c3efd": 0
    },
    "fieldRef": {
        "54d4cd220a9b02c67e9c3ef9": {
            "page": 0,
            "field": 0
        },
        "54d4cd220a9b02c67e9c3efa": {
            "page": 0,
            "field": 1
        },
        "54d4cd7e0a9b02c67e9c3f0d": {
            "page": 0,
            "field": 2
        },
        "54d4ce6b4e6821c12b30ac39": {
            "page": 0,
            "field": 3
        },
        "54d4cd220a9b02c67e9c3efb": {
            "page": 0,
            "field": 4
        },
        "54d4cd220a9b02c67e9c3efc": {
            "page": 0,
            "field": 5
        },
        "54d4cd220a9b02c67e9c3eff": {
            "page": 0,
            "field": 6
        },
        "54d4cd220a9b02c67e9c3f00": {
            "page": 0,
            "field": 7
        },
        "54d4cd220a9b02c67e9c3f01": {
            "page": 0,
            "field": 8
        },
        "54d4cd220a9b02c67e9c3f02": {
            "page": 0,
            "field": 9
        },
        "54d4cd220a9b02c67e9c3f04": {
            "page": 0,
            "field": 10
        },
        "54d4cd220a9b02c67e9c3f05": {
            "page": 0,
            "field": 11
        },
        "54d4cd220a9b02c67e9c3f06": {
            "page": 0,
            "field": 12
        },
        "54d4cd220a9b02c67e9c3f07": {
            "page": 0,
            "field": 13
        },
        "54d4cd220a9b02c67e9c3f08": {
            "page": 0,
            "field": 14
        },
        "54d4cd220a9b02c67e9c3f09": {
            "page": 0,
            "field": 15
        },
        "54d4cd220a9b02c67e9c3f0a": {
            "page": 0,
            "field": 16
        },
        "54d4cd220a9b02c67e9c1245": {
            "page": 0,
            "field": 17  
        }
    }
}
},{}],82:[function(require,module,exports){
module.exports={
  "forms": [{
    "_id": "54d4cd220a9b02c67e9c3f0c",
    "name": "Test All Form Things",
    "description": "Testing all field types",
    "lastUpdated" : "2015-02-06T14:31:07.566Z",
    "lastUpdatedTimestamp" : 1423233067566
  }
  ]
}
},{}],83:[function(require,module,exports){
module.exports={
  "_id":"52e12c7d2e311daf1b000003",
  "name":"appFormsPhase2",
  "updatedBy":"testing-admin@example.com",
  "borders":{
    "progress_steps_number_container_active":{
      "thickness":"thin",
      "style":"dotted",
      "colour":"#0e0e0f"
    },
    "progress_steps_number_container":{
      "thickness":"thin",
      "style":"dotted",
      "colour":"#0b0b0b"
    },
    "progress_steps":{
      "thickness":"none",
      "style":"dotted",
      "colour":"#f05444"
    },
    "error":{
      "thickness":"medium",
      "style":"solid",
      "colour":"#f00a0a"
    },
    "instructions":{
      "thickness":"none",
      "style":"dotted",
      "colour":"#59089e"
    },
    "fieldInput":{
      "thickness":"thin",
      "style":"solid",
      "colour":"#000000"
    },
    "fieldArea":{
      "thickness":"thin",
      "style":"dotted",
      "colour":"#000000"
    },
    "forms":{
      "thickness":"none",
      "style":"solid",
      "colour":"#08fc2c"
    }
  },
  "typography":{
    "progress_steps_number_container_active":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#f9f1f5"
    },
    "progress_steps_number_container":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#070707"
    },
    "section_break_description":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#070707"
    },
    "section_break_title":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#050605"
    },
    "error":{
      "fontSize":"14pt",
      "fontFamily":"times",
      "fontStyle":"normal",
      "fontColour":"#fb0000"
    },
    "buttons_active":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#040404"
    },
    "buttons":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#f7f3f3"
    },
    "instructions":{
      "fontSize":"14pt",
      "fontFamily":"times",
      "fontStyle":"normal",
      "fontColour":"#060606"
    },
    "fieldInput":{
      "fontSize":"18pt",
      "fontFamily":"times",
      "fontStyle":"normal",
      "fontColour":"#060506"
    },
    "fieldTitle":{
      "fontSize":"18pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#090909"
    },
    "page_description":{
      "fontSize":"11pt",
      "fontFamily":"times",
      "fontStyle":"italic",
      "fontColour":"#070707"
    },
    "page_title":{
      "fontSize":"12pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#0b0b0b"
    },
    "description":{
      "fontSize":"14pt",
      "fontFamily":"times",
      "fontStyle":"normal",
      "fontColour":"#000000"
    },
    "title":{
      "fontSize":"18pt",
      "fontFamily":"times",
      "fontStyle":"bold",
      "fontColour":"#000000"
    }
  },
  "colours":{
    "backgrounds":{
      "headerBar":"#42beea",
      "navigationBar":"#6b739f",
      "body":"#ece6ea",
      "form":"#ffffff",
      "fieldArea":"#fbf9f6",
      "fieldInput":"#f6eff3",
      "fieldInstructions":"#f6f7f6",
      "error":"#f7f4f4",
      "progress_steps":"#ffffff",
      "progress_steps_number_container":"#f7f7f7",
      "progress_steps_number_container_active":"#000000",
      "field_required":"#f40021",
      "section_area":"#f2f3f6"
    },
    "buttons":{
      "navigation":"#29c5e7",
      "navigation_active":"#249ec1",
      "action":"#14f4ea",
      "action_active":"#1eecec",
      "cancel":"#49abce",
      "cancel_active":"#2190b8"
    }
  },
  "logo":{
    "base64String":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAAjCAYAAABII5xqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxQjdBOTE5RjA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxQjdBOTFBMDA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFCN0E5MTlEMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFCN0E5MTlFMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+EXbGxwAADd1JREFUeNrsHQl0VNX1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",
    "height":"37",
    "width":"237"
  },
  "css":".fh_appform_button_navigation{background-color:#29c5e7;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_navigation:active{background-color:#249ec1;font-size:11pt;font-family:times;color:#040404;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_action{background-color:#14f4ea;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_action.special_button{width:100%;margin-top:10px;line-height:28px;}.fh_appform_button_action.special_button.fh_appform_removeInputBtn{width:50%;margin-top:10px;line-height:28px;}.fh_appform_button_action.special_button.fh_appform_addInputBtn{width:50%;margin-top:10px;line-height:28px;}.fh_appform_button_action:active{background-color:#1eecec;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_cancel{background-color:#49abce;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_cancel:active{background-color:#2190b8;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_navigation{background-color:#6b739f;}.fh_appform_header{background-color:#42beea;}.fh_appform_body{background-color:#ece6ea;}.fh_appform_form{background-color:#ffffff;border:none;padding:5px;}.fh_appform_field_title{font-size:18pt;font-family:times;color:#090909;font-weight:bold;font-style:normal;display:block;}.fh_appform_field_title.fh_appform_field_numbering{display:inline-block;}.fh_appform_field_area{background-color:#fbf9f6;border-width:thin;border-style:dotted;border-color:#000000;padding:5px;border-bottom:none;border-radius:5px;}.fh_appform_field_area:last-child{border-width:thin;border-style:dotted;border-color:#000000;}.fh_appform_field_area.fh_appform_field_section_break{border:none;background:transparent;}.fh_appform_field_input{background-color:#f6eff3;font-size:18pt;font-family:times;color:#060506;font-weight:normal;font-style:normal;border-width:thin;border-style:solid;border-color:#000000;width:100%;border-radius:5px;line-height:1.4em;padding:5px 0px 5px 5px;}.fh_appform_field_instructions{background-color:#f6f7f6;font-size:14pt;font-family:times;color:#060606;font-weight:normal;font-style:normal;border:none;margin-bottom:10px;border-radius:5px;}.fh_appform_title{font-size:18pt;font-family:times;color:#000000;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_description{font-size:14pt;font-family:times;color:#000000;font-weight:normal;font-style:normal;text-align:center;}.fh_appform_error{font-size:14pt;font-family:times;color:#fb0000;font-weight:normal;font-style:normal;background-color:#f7f4f4;border-width:medium;border-style:solid;border-color:#f00a0a;}.fh_appform_field_section_break_title{font-size:11pt;font-family:times;color:#050605;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_field_section_break_description{font-size:11pt;font-family:times;color:#070707;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_page_title{font-size:12pt;font-family:times;color:#0b0b0b;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_page_description{font-size:11pt;font-family:times;color:#070707;font-style:italic;font-weight:normal;text-align:center;}.fh_appform_progress_wrapper{padding-top:20px;padding-bottom:10px;}.fh_appform_progress_steps{background-color:#ffffff;border:none;width:100%;}.fh_appform_progress_steps td{text-align:center;}.fh_appform_progress_steps td.active .fh_appform_page_title{text-align:center;display:inline;}.fh_appform_progress_steps .fh_appform_page_title{padding-left:10px;display:none;}.fh_appform_progress_steps .number{padding-top:4px;}.fh_appform_progress_steps .number_container{background-color:#f7f7f7;border-width:thin;border-style:dotted;border-color:#0b0b0b;font-size:11pt;font-family:times;color:#070707;font-weight:bold;font-style:normal;display:inline-block;border-radius:13px;padding-left:10px;padding-right:10px;margin-top:5px;margin-bottom:5px;}.fh_appform_progress_steps td.active .number_container{background-color:#000000;border-width:thin;border-style:dotted;border-color:#0e0e0f;font-size:11pt;font-family:times;color:#f9f1f5;font-weight:bold;font-style:normal;}.fh_appform_field_required:first-child:after{color: #f40021;content:' *';display:inline;}.fh_appform_action_bar{padding:18px 20px 18px 20px;}.fh_appform_action_bar button.fh_appform_two_button{width:50%;}.fh_appform_action_bar button.fh_appform_three_button{width:33.3%;}.fh_appform_section_area{background-color:#f2f3f6;padding:5px;border-radius:5px;margin-top:5px;}.fh_appform_hidden{display:none;}.fh_appform_logo{background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAAjCAYAAABII5xqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxQjdBOTE5RjA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxQjdBOTFBMDA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFCN0E5MTlEMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFCN0E5MTlFMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+EXbGxwAADd1JREFUeNrsHQl0VNX1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\");height: 37px;width:237px;background-position:center;background-repeat:no-repeat;width:100%;}",
  "lastUpdated":"2014-01-23T14:51:43.975Z"
}
},{}],84:[function(require,module,exports){
module.exports={
  "_id": "submissionData",
  "appClientId": "iKfLUbYOx_PEkTRzrwE4z_5o",
  "appCloudName": "testing-ikflu0bt6ylkvrb93dte1zsc-dev",
  "appEnvironment": "dev", "appId": "iKfLUVriLnH49pTCPkhgN-9-",
  "deviceFormTimestamp": "2014-04-07T15:22:42.262Z",
  "deviceIPAddress": "217.114.169.246,10.25.2.39,10.25.2.12",
  "deviceId": "666c991129b82259",
  "formId": "5335a02fbfe537474a91325b",
  "masterFormTimestamp": "2014-04-07T15:22:42.262Z",
  "timezoneOffset": -60,
  "userId": null,
  "formFields": [
    {
      "fieldId": {
        "fieldOptions": {
          "validation": {
            "validateImmediately": true
          }
        },
        "required": true,
        "type": "text",
        "name": "text field",
        "_id": "5335b83b0b4ee17a4f4c096d",
        "repeating": false
      },
      "fieldValues": ["text1", null]
    }
  ],
  "comments": [],
  "status": "complete",
  "submissionStartedTimestamp": "2014-04-09T17:11:22.832Z",
  "updatedTimestamp": "2014-04-09T17:11:24.689Z",
  "submissionCompletedTimestamp": "2014-04-09T17:11:24.688Z"
}

},{}],85:[function(require,module,exports){
module.exports={
  "_id": "submissionFile",
  "appClientId": "iKfLUbYOx_PEkTRzrwE4z_5o",
  "appCloudName": "testing-ikflu0bt6ylkvrb93dte1zsc-dev",
  "appEnvironment": "dev", "appId": "iKfLUVriLnH49pTCPkhgN-9-",
  "deviceFormTimestamp": "2014-04-07T15:22:42.262Z",
  "deviceIPAddress": "217.114.169.246,10.25.2.39,10.25.2.12",
  "deviceId": "666c991129b82259",
  "formId": "5335a02fbfe537474a91325b",
  "masterFormTimestamp": "2014-04-07T15:22:42.262Z",
  "timezoneOffset": -60,
  "userId": null,
  "formFields": [
    {
      "fieldId": {
        "fieldOptions": {
          "validation": {
            "validateImmediately": true
          }
        },
        "required": true,
        "type": "photo",
        "name": "PHOTO",
        "helpText": "Smile for the birdyyy.",
        "_id": "5335b546bfe537474a9132ad",
        "repeating": false
      },
      "fieldValues": [
        {
          "url": "/mbaas/forms/appid/submission/submissionId/files/filegroupid",
          "fieldId": "5335b546bfe537474a9132ad",
          "fileUpdateTime": 1397063480651,
          "imgHeader": "data:image/png;base64,",
          "fileType": "image/png",
          "fileSize": 41350,
          "contentType": "base64",
          "hashName": "filePlaceHolder0ccab58f76e51dd5994c82284db8c825",
          "fileName": "filePlaceHolder0ccab58f76e51dd5994c82284db8c825.png",
          "groupId": "53457f3c6f81402d48000003",
          "mbaasUrl" : "/mbaas/forms/:appid/submission/submissionId/files/filegroupid"
        }
      ]
    },
    {
      "fieldId": {
        "fieldOptions": {
          "validation": {
            "validateImmediately": true
          }
        },
        "required": true,
        "type": "text",
        "name": "text field",
        "_id": "5335b83b0b4ee17a4f4c096d",
        "repeating": false
      },
      "fieldValues": ["jgff", null]
    }
  ],
  "comments": [],
  "status": "complete",
  "submissionStartedTimestamp": "2014-04-09T17:11:22.832Z",
  "updatedTimestamp": "2014-04-09T17:11:24.689Z",
  "submissionCompletedTimestamp": "2014-04-09T17:11:24.688Z"
}

},{}],86:[function(require,module,exports){
/*jshint expr: true*/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var config = require('../../src/config.js');

describe("Config module", function() {

    beforeEach(function(){
        this.config = config;
    });

    it("config should be init before usage. config should get data from mbaas.", function(done) {
        this.config.init({}, function(err, returnedConfig) {
            assert(!err, "Unexpected Error When Returning Config Data.");
            assert.equal(config.get("log_email"), "test@feedhenry.com");
            done();
        });
    });

    it("how to get config properties", function() {
        assert(this.config.getAppId(), "Expected appId To Be set");
        assert(this.config.get("mbaasBaseUrl"), "Expected mbaasBaseUrl To Be set");
        assert(this.config.get("formUrls"), "Expected formUrls To Be set");
        assert(this.config.get("env"), "Expected env To Be set");
        assert(this.config.get("userConfigValues"), "Expected userConfigValues To Be set");
        assert.ok(this.config.get("sent_save_min") === 5, "Expected defaultConfigValues To Be set");
    });

    it("Should Only Be One Config Module", function() {
        var sameConfig = require('../../src/config.js');

        assert.ok(sameConfig.get("sent_save_min") === config.get("sent_save_min"));
    });
});

},{"../../src/config.js":48,"chai":12,"underscore":47}],87:[function(require,module,exports){
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var Field = require('../../src/field.js');

//TODO, need to do all field typess.

var testField = {
    "fieldOptions": {
        "definition": {
            "defaultValue": "def"
        }
    },
    "required": true,
    "type": "text",
    "name": "Text Field",
    "helpText": "Text",
    "adminOnly": false,
    "_id": "52dfd93ee02b762d3f000001",
    "repeating": false
};


describe("Field Module", function() {
	it("Creating A New Field Model", function() {
		var field = new Field(testField);

		assert.equal(field.isRequired(), true, "Expected the field to not be required.");
		assert.equal(field.getType(), 'text');
		assert.equal(field.getDefaultValue(), 'def');
		assert.equal(field.isAdminField(), false);
		assert.equal(field.getFieldId(), "52dfd93ee02b762d3f000001");
		assert.equal(field.getName(), "Text Field");
	});
});
},{"../../src/field.js":50,"chai":12,"underscore":47}],88:[function(require,module,exports){
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var Form = require('../../src/form.js');

var testForm = {
    "_id": "52dfd909a926eb2e3f123456",
    "description": "Small Form",
    "name": "Small Form",
    "updatedBy": "testingform@example.com",
    "lastUpdatedTimestamp": 1390409513725,
    "pageRules": [

    ],
    "fieldRules": [

    ],
    "pages": [{
        "_id": "52dfd909a926eb2e3f000001",
        "name": "A Page",
        "fields": [{
            "fieldOptions": {
                "definition": {
                    "defaultValue": ""
                }
            },
            "required": false,
            "type": "text",
            "name": "Text",
            "helpText": "Text",
            "_id": "52dfd93ee02b762d3f000001",
            "repeating": false
        }, {
            "required": false,
            "type": "file",
            "name": "File",
            "helpText": "File",
            "_id": "52dfd93ee02b762d3f000002",
            "repeating": false
        }]
    }, {
        "name": "Page 2",
        "_id": "52dff729e02b762d3f000004",
        "fields": [{
            "required": false,
            "type": "text",
            "name": "Page 2 Text",
            "helpText": "Page 2 Text",
            "_id": "52dff729e02b762d3f000003",
            "repeating": false
        }]
    }],
    "lastUpdated": "2014-01-22T16:51:53.725Z",
    "dateCreated": "2014-01-22T14:43:21.806Z"
};

describe("Form model", function() {
    it("how to initialise a form with a JSON object representing a form", function(done) {
        //load from local then from remote.
        new Form({
            rawMode: true,
            rawData: testForm,
            formId: "52dfd909a926eb2e3f123456"
        }, function(err, form) {
            assert(!err, "Expected no error when creating a form from JSON. " + err);
            assert(form, "Expected a form object");
            assert(form.getType() === "form");
            assert.equal(Date(form.getLastUpdate()), Date(1390409513725));

            var fieldRef = form.getFieldRef();
            var pageRef = form.getPageRef();

            assert.equal(pageRef["52dfd909a926eb2e3f000001"], 0);
            assert.equal(pageRef["52dff729e02b762d3f000004"], 1);

            assert.equal(fieldRef["52dfd93ee02b762d3f000002"].page, 0);
            assert.equal(fieldRef["52dfd93ee02b762d3f000002"].field, 1);

            assert.equal(fieldRef["52dff729e02b762d3f000003"].page, 1);
            assert.equal(fieldRef["52dff729e02b762d3f000003"].field, 0);

            done();
        });
    });
    it("Form Should Provide Fields And Page Models", function(done) {
        //load from local then from remote.
        new Form({
            rawMode: true,
            rawData: testForm,
            formId: "52dfd909a926eb2e3f123456"
        }, function(err, form) {
            assert(!err, "Expected no error when creating a form from JSON." + err);

            var pages = form.getPageModelList();

            assert.equal(pages.length, 2);

            //Should be able to load Field Models from the Page Models
            var page = pages[0];
            var fields = page.getFieldModelList();

            assert.equal(fields.length, 2);

            assert.equal(page.getFieldModelById("52dfd93ee02b762d3f000002"), fields[1]);

            done();
        });
    });
    it("form initialisation is singleton for a single formid. only 1 instance of form model will be returned for same form id", function(done) {
        new Form({
            rawMode: true,
            rawData: testForm,
            formId: "52dfd909a926eb2e3f123456"
        }, function(err, form1) {
            new Form({
                rawMode: true,
                rawData: testForm,
                formId: "52dfd909a926eb2e3f123456"
            }, function(err, form2) {
                assert(!err);
                assert(form1 === form2);
                done();
            });
        });
    });
    it("if form id is not found when trying to pop data, it will return error ", function(done) {
        var form = new Form({
            formId: "somerandomformid"
        }, function(err, form) {
            assert(err, "Expected an error when getting a bad form.");
            assert(form, "Expected a form when getting a bad form.");

            done();
        });
    });

    it("Loading A Form From A Remote Server", function(done) {
        var form = new Form({
            formId: "54d4cd220a9b02c67e9c3f0c"
        }, function(err, form) {
            assert(!err, "Expected no error when getting a bad form. " + err);
            assert(form);

            done();
        });
    });
});
},{"../../src/form.js":61,"chai":12,"underscore":47}],89:[function(require,module,exports){
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');

var testData = {
    formId: "54d4cd220a9b02c67e9c3f0c"
};

describe("forms model",function(){
    it ("How to load form list from local storage-> mBaaS / can load forms and refresh the model ",function(done){
        var timeStamp1=forms.getLocalUpdateTimeStamp();
        forms.refresh(function(err,model){
            assert(!err);
            var timeStamp2=model.getLocalUpdateTimeStamp();
            assert(timeStamp1!=timeStamp2);
            done();
        });
    });
    it ("how to forcely load form list from mBaaS and store it locally / can load forms and refresh the model forcely from remote",function(done){
        var timeStamp1=forms.getLocalUpdateTimeStamp();
        forms.refresh(true, function(err,model){
            assert(!err);
            var timeStamp2=model.getLocalUpdateTimeStamp();
            assert(timeStamp1!=timeStamp2);
            done();
        });
    });

    it (" how to find a form's meta info from form list / can load a formMeta data by its form id",function(){
        var form=forms.getFormMetaById(testData.formId);
        assert(form);
        assert(form._id==testData.formId);
        assert(form.lastUpdated);
    });

    it ("how to test if a form model object is up to date / should check if a form is up to date",function(done){
        new Form({formId:testData.formId,fromRemote:true},function(err, form){
            assert(!err);

            assert (!forms.isFormUpdated(form));
            done();
        });
    });
    it ("how to return the full list of forms",function(done){
        var formMetaList=forms.getFormsList();
        assert(formMetaList);
        assert(formMetaList.length>0);
        done();
    });
});
},{"../../src/form.js":61,"../../src/forms.js":66,"chai":12,"underscore":47}],90:[function(require,module,exports){
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var Page = require('../../src/page.js');

var testPage = {
    "_id": "52dfd909a926eb2e3f000001",
    "name": "A Page",
    "description": "This Is A Page",
    "fields": [{
        "fieldOptions": {
            "definition": {
                "defaultValue": "first thing"
            }
        },
        "required": false,
        "type": "text",
        "name": "Text",
        "helpText": "Text",
        "_id": "52dfd93ee02b762d3f000001",
        "repeating": false
    }, {
        "required": false,
        "type": "file",
        "name": "File",
        "helpText": "File",
        "_id": "52dfd93ee02b762d3f000002",
        "repeating": false
    }]
};


describe("Page Module", function() {
    it("Creating A New Page Model", function() {
        var page = new Page(testPage, {});

        assert.equal(page.getName(), "A Page");
        assert.equal(page.getDescription(), "This Is A Page");
        assert.equal(page.getPageId(), "52dfd909a926eb2e3f000001");
        assert.ok(page.getFieldIds().indexOf("52dfd93ee02b762d3f000001") === 0, "Expected pages to be in order.");
        assert.ok(page.getFieldIds().indexOf("52dfd93ee02b762d3f000002") === 1, "Expected pages to be in order.");
    });
});
},{"../../src/page.js":70,"chai":12,"underscore":47}],91:[function(require,module,exports){
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');
var submission = require('../../src/submission.js');
var submissions = require('../../src/submissions.js');
var config = require('../../src/config.js');
var uploadManager = require('../../src/uploadManager.js');
var testData = {
    formId: "54d4cd220a9b02c67e9c3f0c",
    fieldId: "54d4cd220a9b02c67e9c3efa"
};

describe("Submission model", function() {
    beforeEach(function(done) {
        config.init({}, function(err) {
            assert(!err);
            done();
        });
    });
    it("how to create new submission from a form", function(done) {
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var newSub = submission.newInstance(form);
            var localId = newSub.getLocalId();
            assert(newSub.getStatus() == "new");
            assert(newSub);
            assert(localId);
            done();
        });
    });

    it("how to load a submission from local storage without a form", function(done) {
        //load form
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var newSub = submission.newInstance(form);
            var localId = newSub.getLocalId();
            newSub.saveDraft(function(err) {
                assert(!err);
                submission.fromLocal(localId, function(err, submission1) {
                    assert(!err);
                    assert(submission1.get("formId") == newSub.get("formId"));
                    assert(submission1.getStatus() == "draft");
                    done();
                });
            });
        });
    });

    it("will throw error if status is in wrong order", function(done) {
        var error = false;
        //load form
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var newSub = submission.newInstance(form);
            var localId = newSub.getLocalId();
            newSub.saveDraft(function(err) {
                assert(!err);

                newSub.submitted(function(err) {
                    assert(err);
                    done();
                });
            });
        });
    });

    it("how to store a draft,and find it from submissions list", function(done) {
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var newSub = submission.newInstance(form);
            var localId = newSub.getLocalId();

            newSub.saveDraft(function(err) {
                assert(!err);
                var localId = newSub.getLocalId();
                var meta = submissions.findMetaByLocalId(localId);
                assert(meta._ludid == localId);
                assert(meta.formId == newSub.get("formId"));
                submissions.getSubmissionByMeta(meta, function(err, sub1) {
                    assert(newSub === sub1);
                    done();
                });
            });

        });
    });
    it("submission model loaded from local should have only 1 reference", function(done) {
        var meta = submissions.findByFormId(testData.formId)[0];
        var localId = meta._ludid;
        submission.fromLocal(localId, function(err, submission1) {
            submission.fromLocal(localId, function(err, submission2) {
                assert(submission1 === submission2);
                done();
            });
        });
    });
    describe("comment", function() {
        beforeEach(function(done) {
            config.init({}, function(err) {
                assert(!err);
                done();
            });
        });
        it("how to add a comment to a submission with or without a user", function(done) {
            var meta = submissions.findByFormId(testData.formId)[0];
            var localId = meta._ludid;
            submission.fromLocal(localId, function(err, submission) {
                assert(!err);
                var ts1 = submission.addComment("hello world");
                var ts2 = submission.addComment("test", "testerName");
                var comments = submission.getComments();
                assert(comments.length > 0);
                var str = JSON.stringify(comments);
                assert(str.indexOf("hello world") > -1);
                assert(str.indexOf("testerName") > -1);
                done();
            });
        });

        it("how to remove a comment from submission", function(done) {
            var meta = submissions.findByFormId(testData.formId)[0];
            var localId = meta._ludid;
            submission.fromLocal(localId, function(err, submission) {
                assert(!err, "unexpected error: " + err);
                var ts1 = submission.addComment("hello world2");
                submission.removeComment(ts1);
                var comments = submission.getComments();

                var str = JSON.stringify(comments);
                assert(str.indexOf(ts1.toString()) == -1, "comment still in submission: " + str);
                done();
            });
        });

    });

    describe("User input", function() {
        var newSub = null;
        beforeEach(function(done) {
            config.init({}, function(err) {
                assert(!err);
                var form = new Form({
                    formId: testData.formId
                }, function(err, form) {
                    assert(!err);
                    newSub = submission.newInstance(form);
                    var localId = newSub.getLocalId();
                    assert(newSub.getStatus() == "new");
                    assert(newSub);
                    assert(localId);
                    done();
                });
            });

        });
        it("how to add user input value to submission model", function() {
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[0] == 40);
            });
        });
        it("how to reset a submission to clear all user input", function() {
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err);
            });
            newSub.reset();
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(!err);
                assert(res.length === 0);
            });
        });

        it("how to handle a null user input", function() {
            newSub.reset();
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: null
            }, function(err) {
                assert(!err);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(!err);
                assert(res.length === 0);
            });
        });

        it("how to use transaction to input a series of user values to submission model", function() {
            newSub.reset();
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err);
            });
            newSub.startInputTransaction();
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 50
            }, function(err) {
                assert(!err);
            });
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 60
            }, function(err) {
                assert(!err);
            });
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 35
            }, function(err) {
                assert(!err);
            });
            newSub.endInputTransaction(true);
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[0] == 40);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[1] == 50);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[2] == 60);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[3] == 35);
            });
        });
        it("how to use transaction for user input and roll back", function() {
            newSub.reset();
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err);
            });
            newSub.startInputTransaction();
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 50
            }, function(err) {
                assert(!err);
            });
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 60
            }, function(err) {
                assert(!err);
            });
            newSub.addInputValue({
                fieldId: testData.fieldId,
                value: 35
            }, function(err) {
                assert(!err);
            });
            newSub.endInputTransaction(false);
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[0] === 40);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[1] === undefined);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[2] === undefined);
            });
            newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[3] === undefined);
            });
        });
    });

    describe("upload submission with upload manager", function() {
        var form = null;
        beforeEach(function(done) {
            new Form({
                formId: testData.formId,
                fromRemote: true
            }, function(err, _form) {
                form = _form;
                done();
            });
        });
        it("how to queue a submission", function(done) {
            var newSub1 = form.newSubmission();
            newSub1.on("submit", function(err) {
                assert(!err);

                newSub1.upload(function(err, uploadTask) {
                    assert(!err);
                    assert(uploadTask);
                    assert(uploadManager.timer);
                    assert(uploadManager.hasTask());

                    newSub1.getUploadTask(function(err, task) {
                        assert(!err);
                        assert(task);
                        done();
                    });
                });
            });

            newSub1.submit(function(err) {
                if (err) console.log(err);
                assert(!err);
            });
        });
        it("how to monitor if a submission is submitted", function(done) {
            var newSub1 = form.newSubmission();

            newSub1.on("submit", function() {
                newSub1.upload(function(err, uploadTask) {
                    assert(!err);
                    assert(uploadTask);
                });
            });
            newSub1.on("progress", function(progress) {
                console.log("PROGRESS: ", progress);
            });
            newSub1.on("error", function(err, progress) {
                assert.ok(!err);
                console.log("ERROR: ", err, progress);
            });
            newSub1.on("submitted", function(submissionId) {
                assert.ok(submissionId);
                assert.ok(newSub1.getLocalId());
                assert.ok(newSub1.getRemoteSubmissionId());
                done();
            });
            newSub1.submit(function(err) {
                assert(!err);
            });
        });
    });

    describe("download a submission using a submission Id", function() {
        beforeEach(function(done) {
            config.init({}, function(err) {
                assert(!err);
                done();
            });
        });
        it("how to queue a submission for download", function(done) {
            var submissionToDownload = null;
            submissionToDownload = submission.newInstance(null, {
                "submissionId": "testSubmissionId"
            });

            submissionToDownload.on("progress", function(progress) {
                
                console.log("DOWNLOAD PROGRESS: ", progress);
                assert.ok(progress);
            });

            submissionToDownload.on("downloaded", function() {
                
                console.log("downloaded event called");
                done();
            });

            submissionToDownload.on("error", function(err, progress) {
                
                console.error("error event called");
                assert.ok(!err);
                assert.ok(progress);
                done();
            });

            submissionToDownload.download(function(err, downloadTask) {
                
                console.log(err, downloadTask);
                assert.ok(!err);
                assert.ok(downloadTask);

                submissionToDownload.getDownloadTask(function(err, downloadTask) {
                    
                    console.log(err, downloadTask);
                    assert.ok(!err);
                    assert.ok(downloadTask);
                });
            });
        });
    });
});
},{"../../src/config.js":48,"../../src/form.js":61,"../../src/forms.js":66,"../../src/submission.js":74,"../../src/submissions.js":75,"../../src/uploadManager.js":76,"chai":12,"underscore":47}],92:[function(require,module,exports){
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');
var submission = require('../../src/submission.js');
var submissions = require('../../src/submissions.js');
var config = require('../../src/config.js');
var uploadManager = require('../../src/uploadManager.js');
var uploadTask = require('../../src/uploadTask.js');
var fileSystem = require('../../src/fileSystem.js');
var testData = {
    formId: "54d4cd220a9b02c67e9c3f0c",
    fieldId: "54d4cd220a9b02c67e9c3efa",
    fieldIdFile: "54d4cd220a9b02c67e9c1245",
    fieldIdPhoto: "54d4cd220a9b02c67e9c3f07"
};

describe("UploadTask model", function() {
    var form;
    beforeEach(function(done) {
        config.init({}, function(err) {
            assert(!err);
            new Form({
                formId: testData.formId,
                fromRemote: true
            }, function(err, _form) {
                form = _form;
                done();
            });
        });
    });

    it("how to upload submission form", function(done) {
        var sub = form.newSubmission();
        var ut = uploadTask.newInstance(sub);
        ut.uploadForm(function(err) {
            assert(!err);
            var progress = ut.getProgress();
            assert(progress.formJSON);
            done();
        });
    });

    it("how to deal with out of date submission", function(done) {
      var sub = form.newSubmission();
      sub.set("outOfDate", true);
      sub.changeStatus("pending", function(err) {
        assert(!err);

        sub.changeStatus("inprogress", function(err) {
          assert(!err);
          var ut = uploadTask.newInstance(sub);
          ut.uploadForm(function(err) {
            assert(!err);
            var progress = ut.getProgress();
            assert(progress.formJSON);
            assert(!ut.isCompleted());
            done();
          });
        });
      });
    });

    it("how to upload a file ", function(done) {
      var sub = form.newSubmission();
      sub.changeStatus("pending", function(err) {
        assert(!err);

        sub.changeStatus("inprogress", function(err) {
          assert(!err);

          fileSystem.save("testfile.txt", "content of the file", function(err) {
            assert(!err);
            fileSystem.readAsFile("testfile.txt", function(err, file) {
              sub.addInputValue({
                fieldId: testData.fieldIdFile,
                value: file
              }, function(err) {
                assert(!err);
                var ut = uploadTask.newInstance(sub);
                ut.uploadForm(function(err) {
                  assert(!err);

                  ut.uploadFile(function(err) {
                    assert(!err);
                    assert(ut.get("currentTask") == 1);
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });

    // it("how to upload by tick", function(done) {
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       fileSystem.save("testfile.txt", "content of the file", function(err) {
    //         assert(!err);
    //         fileSystem.readAsFile("testfile.txt", function(err, file) {
    //           sub.addInputValue({
    //             fieldId: testData.fieldIdFile,
    //             value: file
    //           }, function(err) {
    //             assert(!err);
    //             var ut = uploadTask.newInstance(sub);
    //             var sending = false;
    //             var timer = setInterval(function() {
    //               if (ut.isCompleted()) {
    //                 clearInterval(timer);
    //                 assert(ut.isFormCompleted());
    //                 assert(ut.isFileCompleted());
    //                 assert(ut.isMBaaSCompleted());
    //                 assert(!ut.isError());
    //                 done();
    //               }

    //               if (!sending) {
    //                 sending = true;
    //                 ut.uploadTick(function(err) {
    //                   if (err) {
    //                     console.error(err);
    //                     clearInterval(timer);
    //                   }
    //                   sending = false;
    //                   assert(!err);
    //                 });
    //               }
    //             }, 500);
    //           });
    //         });
    //       });
    //     });
    //   });
    // });
    // it("how to check for failed file upload", function(done) {
    //   config.set("max_retries", 2);
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       fileSystem.save("testfile.txt", "content of the file", function(err) {
    //         assert(!err);
    //         fileSystem.readAsFile("testfile.txt", function(err, file) {
    //           sub.addInputValue({
    //             fieldId: testData.fieldIdFile,
    //             value: file
    //           }, function(err) {
    //             assert(!err);
    //             sub.set("testText", "failedFileUpload");
    //             var ut = uploadTask.newInstance(sub);
    //             ut.uploadTick(function(err) { //form upload
    //               assert(!err);

    //               ut.uploadTick(function(err) { //First upload fails -- upload task should be set to try again.
    //                 assert(!err);
    //                 assert(ut.getCurrentTask() === 0);
    //                 assert(sub.getStatus() === "queued");
    //                 assert.ok(sub.getRemoteSubmissionId());
    //                 assert(ut.get("retryNeeded") === true);
    //                 assert(ut.get("retryAttempts") === 1);

    //                 ut.uploadTick(function(err){// Next upload tick should reset the uploadTask
    //                   assert(!err);
    //                   assert(sub.getStatus() === "queued");
    //                   assert(ut.get("retryNeeded") === false);
    //                   assert(ut.get("retryAttempts") === 1);

    //                   ut.uploadTick(function(err){ //Next upload fails again
    //                     assert(!err);
    //                     assert(ut.getCurrentTask() === 0);
    //                     assert(sub.getStatus() === "queued");
    //                     assert(ut.get("retryNeeded") === true);
    //                     assert(ut.get("retryAttempts") === 2);

    //                     ut.uploadTick(function(err){// Next upload tick should reset the uploadTask again
    //                       assert(!err);
    //                       assert(ut.getCurrentTask() === 0);
    //                       assert(sub.getStatus() === "queued");
    //                       assert(ut.get("retryNeeded") === false);
    //                       assert(ut.get("retryAttempts") === 2);

    //                       ut.uploadTick(function(err){// Upload fails again. Exceeded max number of retry attempts. Upload task is now in error state
    //                         assert(err);
    //                         assert(sub.getStatus() === "error");
    //                         assert(ut.isError() === true);

    //                         done();
    //                       });
    //                     });
    //                   });
    //                 });
    //               });
    //             });
    //           });
    //         });
    //       });
    //     });
    //   });
    // });

    // it("how to check for failed submissionCompletion", function(done) {
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       fileSystem.save("testfile.txt", "content of the file", function(err) {
    //         assert(!err);
    //         fileSystem.readAsFile("testfile.txt", function(err, file) {
    //           sub.addInputValue({
    //             fieldId: testData.fieldIdFile,
    //             value: file
    //           }, function(err) {
    //             assert(!err);
    //             sub.set("testText", "submissionError");
    //             var ut = uploadTask.newInstance(sub);

    //             ut.uploadTick(function(err) {
    //               assert(!err);

    //               ut.uploadTick(function(err) {
    //                 assert(!err);
    //                 assert(ut.getCurrentTask() === 0);
    //                 assert(ut.get("retryNeeded") === true);
    //                 assert(ut.get("retryAttempts") === 1);
    //                 assert(sub.getStatus() === "queued");
    //                 done();
    //               });
    //             });
    //           });
    //         });
    //       });
    //     });
    //   });
    // });


    // it("how to check for file status", function(done) {
    //   config.set("max_retries", 2);
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       fileSystem.save("testfile.txt", "content of the file", function(err) {
    //         assert(!err);
    //         fileSystem.readAsFile("testfile.txt", function(err, file) {
    //           sub.addInputValue({
    //             fieldId: testData.fieldIdFile,
    //             value: file
    //           }, function(err) {
    //             assert(!err);
    //             sub.set("testText", "submissionStatus");
    //             var ut = uploadTask.newInstance(sub);

    //             ut.uploadTick(function(err) { //upload form successfully
    //               assert(!err);

    //               ut.uploadTick(function(err) { // upload file failed 1st time
    //                 assert(!err);
    //                 assert(ut.getCurrentTask() === 0);
    //                 assert(ut.get("retryNeeded") === true);
    //                 assert(ut.get("retryAttempts") === 1);
    //                 assert(sub.getStatus() === "queued");

    //                 ut.uploadTick(function(err) { //rebuilds the upload task
    //                   assert(!err);
    //                   assert(ut.get("retryNeeded") === false);
    //                   assert(ut.get("retryAttempts") === 1);
    //                   assert(sub.getStatus() === "queued");

    //                   ut.uploadTick(function(err) { //Next file uploaded sucessfully to mbaas.
    //                     assert(!err);
    //                     assert(sub.getStatus() === "queued");
    //                     ut.uploadTick(function(err) { //call completeSubmission
    //                       assert(!err);
    //                       assert(sub.getStatus() === "queued");

    //                       ut.uploadTick(function(err) { //Submission is now complete
    //                         assert(!err);
    //                         assert(sub.getStatus() === "submitted");
    //                         assert(ut.isCompleted() === true);

    //                         done();
    //                       });
    //                     });
    //                   });
    //                 });
    //               });
    //             });
    //           });
    //         });
    //       });
    //     });
    //   });
    // });

    // it("how to get total upload size", function() {
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       var ut = uploadTask.newInstance(sub);
    //       assert(ut.getTotalSize());
    //     });
    //   });
    // });

    // it("how to get uploaded size", function(done) {
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       var ut = uploadTask.newInstance(sub);
    //       assert(ut.getTotalSize());
    //       assert(ut.getUploadedSize() == 0);
    //       ut.uploadTick(function() {
    //         assert(ut.getTotalSize() == ut.getUploadedSize());
    //         done();
    //       });
    //     });
    //   });
    // });

    // it("how to upload photo/signature", function(done) {
    //   var sub = form.newSubmission();
    //   sub.changeStatus("pending", function(err) {
    //     assert(!err);

    //     sub.changeStatus("inprogress", function(err) {
    //       assert(!err);

    //       sub.addInputValue({
    //         fieldId: testData.fieldIdPhoto,
    //         value: "data:image/png;base64,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"
    //       }, function(err) {
    //         assert(!err);
    //         var ut = uploadTask.newInstance(sub);
    //         ut.uploadForm(function(err) {
    //           assert(!err);

    //           ut.uploadFile(function(err) {
    //             assert(!err);
    //             assert(ut.get("currentTask") == 1);
    //             done();
    //           });
    //         });
    //       });
    //     });
    //   });
    // });

    // it("how to download a submission definition", function(done){
    //   var sub = submission.newInstance(null ,{submissionId: "submissionData"});

    //   sub.changeStatus("pending", function(err){
    //     assert.ok(!err);

    //     sub.changeStatus("inprogress", function(err){
    //       assert.ok(!err);

    //       var downloadTask = uploadTask.newInstance(sub);
    //       //First download tick will download the json definition of the submission
    //       downloadTask.uploadTick(function(err){
    //         assert.ok(!err);

    //         console.log(downloadTask.getProgress());
    //         assert.ok(downloadTask.getProgress());
    //         assert.ok(sub.getStatus() === "inprogress");

    //         //Second download tick will download the file from the server
    //         downloadTask.uploadTick(function(err){
    //           assert.ok(!err);
    //           assert.ok(sub.getStatus() === "inprogress");

    //           //Third download tick will mark the submission as downloaded
    //           downloadTask.uploadTick(function(err){
    //             assert.ok(!err);

    //             assert.ok(sub.getStatus() === "downloaded");
    //             //It should have downloaded a file
    //             done();
    //           });
    //         });
    //       });
    //     });
    //   });
    // });
});
},{"../../src/config.js":48,"../../src/fileSystem.js":60,"../../src/form.js":61,"../../src/forms.js":66,"../../src/submission.js":74,"../../src/submissions.js":75,"../../src/uploadManager.js":76,"../../src/uploadTask.js":77,"chai":12,"underscore":47}],93:[function(require,module,exports){
/*jshint expr: true*/
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var Model = require("../../src/model.js");
var utils = require("../../src/utils");

describe("Form Utils", function() {
    it("should extend a function", function() {
        var func1 = function() {};
        func1.prototype.function1 = function() {};

        var func2 = function() {};
        func2.prototype.function2 = function() {};

        utils.extend(func1, func2);

        expect(func1.prototype).to.have.property("function2");
    });

    it("how to generate a local id from a model", function() {
        var model = new Model();
        var localId = utils.localId(model);
        assert(localId.indexOf('model') > -1, "Expected model based local id");
        assert.ok(model.getLocalId().indexOf('model') > -1, "Expected model based local id");
        assert.ok(model.getLocalId() === model.getLocalId(), "Expected local model id to be constant");
    });

    it("how to generate a local id from a custom model", function() {
        var model = new Model({
            "_type": "someNewModel"
        });
        var localId = utils.localId(model);
        assert(localId.indexOf('someNewModel') > -1, "Expected custom model based local id");
        assert.ok(model.getLocalId().indexOf('someNewModel') > -1, "Expected model based local id");
    });

    it("how to generate a local id from a custom model and a Remote Id", function() {
        var model = new Model({
            "_type": "someRNewModel",
            "_id": "someRemoteID"
        });
        var localId = utils.localId(model);
        assert(localId.indexOf('someRNewModel') > -1, "Expected custom model based local id");
        assert.ok(model.getLocalId().indexOf('someRNewModel') > -1, "Expected model based local id");
        assert.ok(model.getLocalId().indexOf('someRemoteID') > -1, "Expected model based local id to contain remote id");
    });
});

},{"../../src/model.js":69,"../../src/utils":78,"chai":12}]},{},[86,87,88,89,90,91,92,93]);
