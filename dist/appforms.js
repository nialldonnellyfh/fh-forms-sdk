//Drag & Drop Apps Javascript SDK
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//Should be moved to a test fixture..

var getFormsData = require("../test/fixtures/getForms.json");
var allForms = require("../test/fixtures/getForm.json");
var theme = require("../test/fixtures/getTheme.json");
var sampleConfig = require("../test/fixtures/getConfig.json");
var submissionFile = require("../test/fixtures/submissionFile.json");
var submissionData = require("../test/fixtures/submissionData.json");
var sampleConfig = require("../test/fixtures/getConfig.json");
var responseDelay = 10;
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
        console.log("FAKE POST: ", url, body);

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
            console.log(resJSON);
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

        function _submitFormData() {
            setTimeout(function() {
                console.log("Returning: ", body.testText);
                console.log("submissionId: ", submissionId);
                cb(null, {
                    status: "200"
                });
            }, responseDelay);
        }

        var urlMap = {
            hostmbaasformSubmission: _postFormSubmission,
            hostmbaascompleteSubmission: _completeSubmission,
            hostmbaassubmitFormData: _submitFormData
        };

        setTimeout(function() {
            urlMap[url](body, cb);
        }, responseDelay);
    }
};

module.exports = function(params) {
    console.log("Fake Ajax ", params);

    web[params.type](params.url, params, function(err, res) {
        console.log("FAKE AJAX ", err, res);
        if (err) {
            return params.error(null, null, err);
        }
        return params.success(res);
    });
}
},{"../test/fixtures/getConfig.json":47,"../test/fixtures/getForm.json":48,"../test/fixtures/getForms.json":49,"../test/fixtures/getTheme.json":50,"../test/fixtures/submissionData.json":51,"../test/fixtures/submissionFile.json":52}],2:[function(require,module,exports){

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
},{"_process":10}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
var Model = require("./model");
var formConfig = require("./config");
var forms = require("./forms");
var Form = require("./form");
var theme = require("./theme");
var submissions = require("./submissions");
var submission = require("./submission");
var log = require("./log");
var init = require("./init");
var waitOnSubmission = {};
var defaultFunction = function(err) {
    err = err ? err : "";
    log.w("Default Function Called " + err);
};

/**
 * Get and set config values. Can only set a config value if you are an config_admin_user
 */
var configInterface = {
    editAllowed: function() {
        var defaultConfigValues = formConfig.get("defaultConfigValues", {});
        return defaultConfigValues.config_admin_user === true;
    },
    "get": function(key) {
        var self = this;
        if (key) {
            var userConfigValues = formConfig.get("userConfigValues", {});
            var defaultConfigValues = formConfig.get("defaultConfigValues", {});


            if (userConfigValues[key]) {
                return userConfigValues[key];
            } else {
                return defaultConfigValues[key];
            }

        }
    },
    "getDeviceId": function() {
        return formConfig.get("deviceId", "Not Set");
    },
    "set": function(key, val) {
        var self = this;
        if (typeof(key) !== "string" || typeof(val) === "undefined" || val === null) {
            return;
        }

        if (self.editAllowed() || key === "max_sent_saved") {
            var userConfig = formConfig.get("userConfigValues", {});
            userConfig[key] = val;
            formConfig.set("userConfigValues", userConfig);
        }

    },
    "getConfig": function() {
        var self = this;
        var defaultValues = formConfig.get("defaultConfigValues", {});
        var userConfigValues = formConfig.get("userConfigValues", {});
        var returnObj = {};

        if (self.editAllowed()) {
            for (var defKey in defaultValues) {
                if (userConfigValues[defKey]) {
                    returnObj[defKey] = userConfigValues[defKey];
                } else {
                    returnObj[defKey] = defaultValues[defKey];
                }
            }
            return returnObj;
        } else {
            return defaultValues;
        }
    },
    "saveConfig": function(cb) {
        var self = this;
        formConfig.saveLocal(function(err, configModel) {
            if (err) {
                log.e("Error saving a form config: ", err);
            } else {
                log.l("Form config saved sucessfully.");
            }

            if (typeof(cb) === 'function') {
                cb();
            }
        });
    },
    "offline": function() {
        formConfig.setOffline();
    },
    "online": function() {
        formConfig.setOnline();
    },
    "mbaasOnline": function(cb) {
        if (typeof(cb) === "function") {
            formConfig.on('online', cb);
        }
    },
    "mbaasOffline": function(cb) {
        if (typeof(cb) === "function") {
            formConfig.on('offline', cb);
        }
    },
    "isOnline": function() {
        return formConfig.isOnline();
    },
    "isStudioMode": function() {
        return formConfig.isStudioMode();
    },
    refresh: function(cb) {
        formConfig.refresh(true, cb);
    }
};


/**
 * Retrieve forms model. It contains forms list. check forms model usage
 * @param  {[type]}   params {fromRemote:boolean}
 * @param  {Function} cb    (err, formsModel)
 * @return {[type]}          [description]
 */
var getForms = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    var fromRemote = params.fromRemote;
    if (fromRemote === undefined) {
        fromRemote = false;
    }
    forms.refresh(fromRemote, cb);
};
/**
 * Retrieve form model with specified form id.
 * @param  {[type]}   params {formId: string, fromRemote:boolean}
 * @param  {Function} cb     (err, formModel)
 * @return {[type]}          [description]
 */
var getForm = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    Form(params, cb);
};

/**
 * Find a theme definition for this app.
 * @param params {fromRemote:boolean(false)}
 * @param {Function} cb {err, themeData} . themeData = {"json" : {<theme json definition>}, "css" : "css" : "<css style definition for this app>"}
 */
var getTheme = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    if (!params.fromRemote) {
        params.fromRemote = false;
    }
    theme.refresh(params.fromRemote, function(err, updatedTheme) {
        if (err) {
            return cb(err);
        }
        if (updatedTheme === null) {
            return cb(new Error('No theme defined for this app'));
        }
        if (params.css === true) {
            return cb(null, theme.getCSS());
        } else {
            return cb(null, theme);
        }
    });
};

/**
 * Get submissions that are submitted. I.e. submitted and complete.
 * @param params {}
 * @param {Function} cb     (err, submittedArray)
 */
var getSubmissions = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;

    //Getting submissions that have been completed.
    submissions.loadLocal(function(err) {
        if (err) {
            log.e(err);
            cb(err);
        } else {
            cb(null, _submissions);
        }
    });
};

var submitForm = function(submission, cb) {
    if (submission) {
        submission.submit(function(err) {
            if (err) {
                return cb(err);
            }

            //Submission finished and validated. Now upload the form
            submission.upload(cb);
        });
    } else {
        return cb('Invalid submission object.');
    }
};

/*
 * Function for downloading a submission stored on the remote server.
 *
 * @param params {}
 * @param {function} cb (err, downloadTask)
 * */
var downloadSubmission = function(params, cb) {
    params = params ? params : {};
    //cb = cb ? cb : defaultFunction;
    var submissionToDownload = null;

    if (typeof(cb) !== 'function') {
        return null;
    }

    function finishSubmissionDownload(err) {
        err = typeof(err) === "string" && err.length === 24 ? null : err;
        log.d("finishSubmissionDownload ", err, submissionToDownload);
        var subCBId = submissionToDownload.getRemoteSubmissionId();
        var subsCbsWatiting = waitOnSubmission[subCBId];
        if (subsCbsWatiting) {
            var subCB = subsCbsWatiting.pop();
            while (typeof(subCB) === 'function') {
                subCB(err, submissionToDownload);
                subCB = subsCbsWatiting.pop();
            }

            if (submissionToDownload.clearEvents) {
                submissionToDownload.clearEvents();
            }
        } else {
            submissionToDownload.clearEvents();
            return cb(err, submissionToDownload);
        }
    }

    log.d("downloadSubmission called", params);

    if (params.submissionId) {
        log.d("downloadSubmission SubmissionId exists" + params.submissionId);
        var submissionAlreadySaved = submissions.findMetaByRemoteId(params.submissionId);

        if (submissionAlreadySaved === null) {

            log.d("downloadSubmission submission does not exist, downloading", params);
            submissionToDownload = new submission.newInstance(null, {
                submissionId: params.submissionId
            });

            submissionToDownload.on('error', finishSubmissionDownload);

            submissionToDownload.on('downloaded', finishSubmissionDownload);

            if (typeof(params.updateFunction) === 'function') {
                submissionToDownload.on('progress', params.updateFunction);
            }


            if (typeof(cb) === "function") {
                if (waitOnSubmission[params.submissionId]) {
                    waitOnSubmission[params.submissionId].push(cb);
                } else {
                    waitOnSubmission[params.submissionId] = [];
                    waitOnSubmission[params.submissionId].push(cb);
                }
            }

            submissionToDownload.download(function(err) {
                if (err) {
                    log.e("Error queueing submission for download " + err);
                    return cb(err);
                }
            });
        } else {
            log.d("downloadSubmission submission exists", params);

            //Submission was created, but not finished downloading
            if (submissionAlreadySaved.status !== "downloaded" && submissionAlreadySaved.status !== "submitted") {
                if (typeof(cb) === "function") {
                    if (waitOnSubmission[params.submissionId]) {
                        waitOnSubmission[params.submissionId].push(cb);
                    } else {
                        waitOnSubmission[params.submissionId] = [];
                        waitOnSubmission[params.submissionId].push(cb);
                    }
                }
            } else {
                submissions.getSubmissionByMeta(submissionAlreadySaved, cb);
            }

        }
    } else {
        log.e("No submissionId passed to download a submission");
        return cb("No submissionId passed to download a submission");
    }
};

module.exports = {
    getForms: getForms,
    getForm: getForm,
    getTheme: getTheme,
    getSubmissions: getSubmissions,
    downloadSubmission: downloadSubmission,
    submitForm: submitForm,
    config: configInterface,
    log: log,
    init: init
};
},{"./config":13,"./form":26,"./forms":31,"./init":32,"./log":34,"./model":35,"./submission":40,"./submissions":41,"./theme":42}],13:[function(require,module,exports){
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



},{"../libs/appProps":2,"../libs/constants.js":3,"../libs/device":4,"../libs/waitForCloud":6,"./dataAgent":14,"./log":34,"./model":35,"./utils":45,"underscore":11}],14:[function(require,module,exports){
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

},{"./config":13,"./localStorage":33,"./log":34,"./store":38,"./storeMbaas":39,"./utils":45}],15:[function(require,module,exports){
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
utils.extend(fieldCheckboxes, Field);
utils.extend(fieldFile, Field);
utils.extend(fieldLocation, Field);
utils.extend(fieldMatrix, Field);
utils.extend(fieldRadio, Field);

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

},{"./config":13,"./fieldCheckboxes":16,"./fieldFile":17,"./fieldImage":18,"./fieldLocation":19,"./fieldMatrix":20,"./fieldRadio":21,"./log":34,"./model":35,"./utils":45}],16:[function(require,module,exports){
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
    getCheckBoxOptions: getCheckBoxOptions,
    process_checkboxes: process_checkboxes,
    convert_checkboxes: convert_checkboxes
};

},{}],17:[function(require,module,exports){
/**
 * extension of Field class to support file field
 */
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var localStorage = require("./localStorage");

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
    checkFileObj: checkFileObj,
    process_file: process_file
};

},{"./config":13,"./localStorage":33,"./log":34,"./model":35}],18:[function(require,module,exports){
/**
 * extension of Field class to support file field
 */

var localStorage = require("./localStorage");
var fileSystem = require("./fileSystem");
var log = require("./log");
var config = require("./config");
var async = require("async");

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
    async.map(value || [], function(meta, cb){
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
    process_signature: imageProcess,
    convert_signature: convertImage,
    process_photo: imageProcess,
    convert_photo: convertImage
};

},{"./config":13,"./fileSystem":25,"./localStorage":33,"./log":34,"async":7}],19:[function(require,module,exports){
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
    process_location: process_location
};

},{"./config":13,"./log":34,"./model":35}],20:[function(require,module,exports){
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
    getMatrixRows: getMatrixRows,
    getMatrixCols: getMatrixCols
};

},{"./config":13,"./log":34,"./model":35}],21:[function(require,module,exports){
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
    getRadioOption: getRadioOption
};

},{"./config":13,"./log":34,"./model":35}],22:[function(require,module,exports){
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

},{"./config":13,"./localStorage":33,"./log":34,"./model":35,"./utils":45}],23:[function(require,module,exports){
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

},{"./config":13,"./fileSubmission":22,"./localStorage":33,"./log":34,"./model":35,"./utils":45}],24:[function(require,module,exports){
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

},{"./config":13,"./fileSubmission":22,"./localStorage":33,"./log":34,"./model":35,"./utils":45}],25:[function(require,module,exports){
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
},{"./utils":45,"async":7}],26:[function(require,module,exports){
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
},{"./field":15,"./forms":31,"./log":34,"./model":35,"./page":36,"./rulesEngine":37,"./submission":40,"./utils":45,"underscore":11}],27:[function(require,module,exports){
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
},{"./config":13,"./log":34,"./model":35,"./utils":45}],28:[function(require,module,exports){
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
},{"./config":13,"./log":34,"./model":35,"./utils":45}],29:[function(require,module,exports){
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
},{"./config":13,"./log":34,"./model":35,"./utils":45}],30:[function(require,module,exports){
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
},{"./config":13,"./log":34,"./model":35,"./utils":45}],31:[function(require,module,exports){
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

},{"./log":34,"./model":35,"./utils":45}],32:[function(require,module,exports){
var log = require("./log");
var config = require("./config");
var submissions = require("./submissions");
var uploadManager = require("./uploadManager");
var theme = require("./theme");
var forms = require("./forms");
var async = require('async');

var init = function(params, cb) {
    var def = {
        'updateForms': true
    };
    if (typeof cb === 'undefined') {
        cb = params;
    } else {
        for (var key in params) {
            def[key] = params[key];
        }
    }

    //init config module
    var config = def.config || {};

    async.series([
        function(cb) {
            log.loadLocal(cb);
        },
        function(cb) {
            log.l("Loading Config");
            config.init(config, cb);
        },
        function(cb) {
            log.l("Loading Submissions");
            submissions.loadLocal(cb);
        },
        function(cb) {
            log.l("Loading Upload Tasks");
            uploadManager.loadLocal(cb);
        }
    ], function(err) {
        if(err){
            log.e("Error Initialising Forms: " + err);
            return cb(err);
        }

        log.l("Initialisation Complete. Starting Upload Manager");
        //Starting any uploads that are queued
        uploadManager.start();
        //init forms module

        return cb();
    });
};

module.exports = init;
},{"./config":13,"./forms":31,"./log":34,"./submissions":41,"./theme":42,"./uploadManager":43,"async":7}],33:[function(require,module,exports){
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
},{"../libs/lawnchair.js":5,"./config.js":13,"./fileSystem.js":25,"./store.js":38,"./utils.js":45}],34:[function(require,module,exports){
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

},{"./config":13,"./localStorage":33,"./utils":45}],35:[function(require,module,exports){
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
    if (key && val) {
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

},{"./dataAgent":14,"./localStorage":33,"./utils":45,"eventemitter2":8,"underscore":11}],36:[function(require,module,exports){
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

},{"./config":13,"./log":34,"./model":35,"./utils":45,"underscore":11}],37:[function(require,module,exports){
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
},{"async":7,"underscore":11}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"./config":13,"./log":34,"./store":38,"./utils":45,"./web":46}],40:[function(require,module,exports){
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
                });
                self.emit("inprogress", ut);
                ut.on("progress", function(progress) {
                    log.d("Emitting upload progress for submission: " + self.getLocalId() + JSON.stringify(progress));
                    self.emit("progress", progress);
                });
                cb(null, ut);
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
                });
                that.emit("inprogress", downloadTask);
                downloadTask.on("progress", function(progress) {
                    log.d("Emitting download progress for submission: " + that.getLocalId() + JSON.stringify(progress));
                    that.emit("progress", progress);
                });
                return cb(null, downloadTask);
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
                Model.clearLocal.call(self, function(err) {
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
},{"./config":13,"./form":26,"./localStorage":33,"./log":34,"./model":35,"./rulesEngine.js":37,"./submissions":41,"./uploadManager":43,"./utils":45,"async":7,"underscore":11}],41:[function(require,module,exports){
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
},{"./config":13,"./log":34,"./model":35,"./submission":40,"./utils":45,"async":7,"underscore":11}],42:[function(require,module,exports){
var Model = require("./model");
var utils = require("./utils");

function Theme() {
    Model.call(this, {
        '_type': 'theme',
        '_ludid': 'theme_object'
    });
}

utils.extend(Theme, Model);

Theme.prototype.getCSS = function() {
    return this.get('css', '');
};

module.exports = new Theme();
},{"./model":35,"./utils":45}],43:[function(require,module,exports){
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
},{"./config.js":13,"./dataAgent":14,"./log":34,"./model":35,"./uploadTask":44,"./utils":45}],44:[function(require,module,exports){
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
},{"./config":13,"./dataAgent":14,"./fileSubmission":22,"./fileSubmissionBase64":23,"./fileSubmissionDownload":24,"./form":26,"./formSubmission":27,"./formSubmissionComplete":28,"./formSubmissionDownload":29,"./formSubmissionStatus":30,"./log":34,"./model":35,"./submission":40,"./utils":45}],45:[function(require,module,exports){
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

},{"md5-node":9,"underscore":11}],46:[function(require,module,exports){
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

},{"../libs/ajax":1,"./config":13,"./fileSystem":25,"./log":34,"./utils":45}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
        }
    }
}
},{}],49:[function(require,module,exports){
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
},{}],50:[function(require,module,exports){
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
    "base64String":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAAjCAYAAABII5xqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxQjdBOTE5RjA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxQjdBOTFBMDA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFCN0E5MTlEMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFCN0E5MTlFMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+EXbGxwAADd1JREFUeNrsHQl0VNX1/j+TTDLZSCCGpWCAWilrFVFr3YqyFLVQFQGBSgXX9kgrdTnanuqxHltLtVVsoWArUKxCLYiUIpYKiNijoCwip1U2ASWREJYkM1nmv947/w6ZzPzl/Zk/k1j/Peee+ZP/5v7373t3ffe9KPsHKeAAeiOOQfwW4vmIBYgt4A4UI65AvA5Rs2ssGgQEhp4LFQvfADUvCEII8MADD1rBL9luCOJMxMmIuRnsTymiz1a4sUXLJwDlzzzsCbYHHqQo3GSZf454Z4aFOgYk1NaSqqJg7xFQNOE7UDDqam8EPfAgBeE+G/FFttodBkRYgHoGap1x39a/e1bbAw8cCfdwxOcRKwzvYpguWlComvE6gl/ziBLH7vh30ai3aWODhe5OR9uCaZxvmwDQagEC5w+DwrHTPMH2wANdZm5DPBNxHuK5iNWI/YyEeyjoia0iM7dYqxVRkr6KAsg9ewhoR6uhad9HoKDwqsVF4OvSDRuhh60opx+vqH7QwiGMlffjF2Emx4qlgGsiGhyUPfArb0g98KDVbFIyGoUOULjgGZahokThRocXlhgKtqJb6ZYDAgIDukPxnbOgcDyG4pEWODL5QhD1+BQUvNwBZ8EZc9eghS4A0RQ+LapqURk0vrsRqu8cA9qJelBSiOC1EEDw8osgb+iFMs1Jk5XqvbbUeqiu4CPEOot2ZYiVoPsqNhkBOIx41MW+7UE8ZUOvkvvYbECjCbEKsTaNCURJzh78bhEH7T8BudWUXohdbPirMi3iR9iiXS5P9MPgfCWH+nGEeWYHPRHLE/pM/G5kIWuUfGYnngv7wS7f1BaKeczpd3uZP8BWuw+NQaJwP8mxdrIb3qS72yV3TIGSW+6HnL4DdEp33ACh9bvAf6YCok5ELbaCZNX8IABh/OgUliApJeUZpuEUL7n1QVQMATuXnF5uLWJfSdJ/RJxucq+IPZlLJGm9hXiRTd9eRfyyJL2FiNMs7n+D3zVoodlJyLYhLkVchhhyyPqbEBcg3oz4nET7GxEXId7OrqIVkKf4L56sMvBbxB9a3L8G8a+I9yE+7uAdxyG+hHgP4hM2bQchbmChTJqmiB8gzkecK6EoyA2dgXgF80EWnuJx+SriasSz+O+/5zGviBfuiTwoBoKN6roG1cR9d0PprF+fvhXesgHqli8Df0+ldfFKaFFr3jbZpegeOv1dSV24FfkEWh8WbGr8ITNcNSFJwrvPghblHYbx9V4eLDNaNEH/K2Fl+/D1h2wJrejts6H3FRbsBsSDBmFNCWJ3tqRXIf4E8VbE9Q5YP4DpDpRs3z/ud3bQm9+TFM7HFmEZeQOFiAds6PXjz18yf5c76LMq+Y49WbDD3GcRN2YVTIOUENWEXMtjYwaH+XMx4gWIhySefy8L9kn2HIj+dr73tlFC7UeGZCK6xS6eci2UznysjTmoW75QpxBLnunSB6byR4JNmPk8WExbvs4aMV1agplOVua4C/RoEr2BeKkL7xpzUV+w8D5owlHh0Q/4HdaBvrw5T/IZoYRPO6h30D42VisMjUvq/ACOP0nZ7nL5HWMu9z9YeI28h9mIo5jHUy1oPcTe8kT2IEfZuOcjWHERjOcwxTSOIZgEesVZsmxj9BgYOBjKn0BPx5972nJqR49AeNMqUIOQnBW3sr1pWO4Ukw0diU579a2K3enzEB/gcZ9rM+mMniEy0DeRIX40cexN752XoX6YtX2FhRT9XZiCONKGzh2IWxME18xjWMzX93A4BnbCbfhwWu5S0GntdNfDUcFs4xLnBUFrMsh/RNsIc78asircSgellXVGxMFj7JYT/IHjx44AbvNjDsfe5/F1tvu8n+NpkPBIjnM+I8RCa5RjyUF8lr2whewZgJ1wUyw23FC40cEpGH01BK8cZ+BhYxytyrrY3EhRs225PTCG+ZyQIYt29//pO1Ku4nvstUznkCTbsJM/ZRK7OzixBuzKn2OQeBvB7WbKPFzlhEYvI52k1QEUTborITnWaqG1BhFto9XhZ0jY615SBtYKQUA2InIPCH7BFmMaGK2QfP6BltZoefMW/v60C/kXpxBbwWiWbP88u+W57H6X8N9vZoGmfMJ3EU/ICrfhkoxoFuArQ3kNmqywoHD7u5ZC3pBKKJ46HYonz0BhJ8m0kE+hZNsbbXDR/WpxWfE0tPPk/xTxL3z9dUn3U3bdOJJCfxpdfj8lLv59iK//BPrKQbYgFu7+28Fv7kdcBfpKw6OIF7NiAg6ntssSolx3pZlLHujXFwW4l6F5VQIB6LroTVA7V6C3rcLJ52brZad0V3SYKJMG8mugL4UFDHryH0ktSJOVNtHQUgUVCeQn0KJ4iLKWhxz27TxmZ65B33ZDeoUnMrCFP88B6/Xr2EIneXlnsVU0g2pu5zQ5ReHhUJ6TaoIBIjofQOorFQ9zbuE6DkmuysLcm8xeAynEJQ5/S+WkmxG/D3pCLshu+WInRIiRhmWmJKi+HpXgK+9uaLUhJ4D3ukW/1s6+D2oeeRz85TbDaR9vu2naKVtKdbbvWbShoo4JErTCPKFftWhDg/FNkKtuCvNke8eiDSWDxmd4AsYU2xmSlngaWBfUpGPBRzCaARWWzErjXW9jxTSGQ5L7XeJhnzj+kRKkirOJHO8T0Jr0Loc0P2E+r2XXfHUq/fWD2VZOCqFz8JbPZ0kgtHkNHH/qcfB1BuNSjEThVi0buen65jC93QZ+g8LacKckrVint3P8pCbQKmUr2OSgbzTxt/H7qgZ925YF6+KTjAljvPsM9EKeHBulSpa7wqGiJkXzkcFYEW+KUxCQRKjhxBpVEFL12vuIf06T5jDuV6zKI3HJjWpHfpMi7fWIGzlP8CxIHGBiJNzCbDhFRNM3gBgIpMJW+NSLC0GrR0JfUqKnoxhXsPBYNTVylZq5rkgxXjObkFTON8oFWjRoVP11OaRfxBITqvVs6dsTYm7Zx5JKgEobfyZB90HQzwHwOejLKnZBMx2GUNxKxSLzWFnvTIMeVZcdQxzM33cwL0lJLXBBIWnp5CNUa0tpfXZCePtbUL/8BfB3j2smjGJuwXF8CCI1taCY7yKvcjlp5XeRluryRPO1s2CrcYpvs8MklVvtMslfM6Ck2pPsHS0C+Zp2IyDrf2mcgtiPeANb7F0u9FVJZ65YM1SYJMfYaoc3rAERdVIVQ2FOUhWN4ejmD/CZjv1u8CBbQJtbRnN8t+UL9u6x6i5Ktj6dQn4gBmUcToxkAacTRKiWPdARXtLacptUm0X3gJyogYZ1S0EtkLC1rAwaVi+xstoxTehB5oGy/bEyR6q/rv6CvX+E3XPyFGndeALH5KkCbROlDPzb7A0tT9MjcE24NVOHQJjF0HRbhUjVkWTbLyJJvyFSWt1JCL2+EhTzVMwBT7izApRAfYEtN1nsJ76gfKD5dhNfz4m7TjUsPMieELnjtEmHNsJ0am/hBqeWW/+lAkqiex016ZG2S16xxNviJ6H5YI3VIQ2vQev2t2RlghY/Uou9OdUufPo8FLHIZOrpPLyN7D7uZasV7iDC1tgOz6SlTcqcd4HWgpN0juquZTrvgp4spQKavPZiqB+sUuy0N9ts/6bBnwWyxd+jN6glpW2kovG9TVA75zFdlfgNy0/JTVpq6UfVCgheUQmBoYNTSUikK9jEI6oHuAz05aB8k7Y+Fpo9EnRph88lkFzEEv9corfNxm2OvWNvtsaBhPem773YXRzH97ayK7pHkgeqQ34qDtrH2lAfL4bkIpb4PtA8oQz3MRf7Sgc6UM3BlBT6bNSWchh0LO9L/D4rQV/3Ppbi3Et5HlsuhUWXwTQzYyXa7s2my5MAwdFT0PUO6At/eD9SdQCqb70etBON4OuimKmSlWy5zYUbWRMccT34u/aUObDBzW2ExIlmTp68LNH+fbDfaUXWsj9bUTsgF3qSxGQeBfbLfifYDZ/t0HNQpTy9tvNKtn2s7XAw2cCUAPOhdVeb1dg7WRemTSWDGXMk2vtshO5Tds3pPIER7PbfmKJ8ZkC4o+wxj7nbTH0cwki1gNwhZ0P+lWNaJWLf+1A1Yyw0H6oCX1fFLB9JE/1RKRUmf9rpLo55XnNBuCmW+h0PUrNNFwslnklZ1SWsAFps6JG3YFeXvJkTOD3YsokEoaTNE3QiCR0OsTbFxBEdSjCQP2XdXSolXS3R9h22cj1t+OFjj8mOH+t5DJwcWURKjwpcHkL8u0T7Hexyr7ChORb02oBUC5KoyKYK4k5XcWSV9g9SKGt6b5KlPI5u8CUXQMWCf4KSX5isHkP1cHjkmdBypOY06yvmrYT8y67RJXbrBqi+fTzG2Z+Bv8JyJxg92/Y4UzqYseyns6D0x7O9I4098CAdyy1C6J/07R8VbC2EHlxLU+u27NxcjIGPni5NjR7DNHVqVLBPLZsH4U2vQMPaN6IZcn83xWoFcaGMYHvggQcuCrevHIOydS9D6E2McRsbkjPgGI9rdSei/2SAsGHjamgY3hUih6pBnNJPcFE7Wwr232xiJw888CBN4TZMPCg5Cmi1tSCajpmG80oen4lGsl5TE61Wo3VspZxDRvOUBhXCz/DY74EH7WC5o3/10/qyRKIu2laxqz4joAwtbdub67HeAw8yCzYbR1wDKrCgI2SGeILtgQfZs9yZ3J1EJ53Q8slz4OB4GA888MAd4aZ1Q1p3jS/sjN/rmbjvU8TF6cLgHq1VUpUWrefS0TgnPTZ74EH24X8CDABUzdrPa7FHPAAAAABJRU5ErkJggg==",
    "height":"37",
    "width":"237"
  },
  "css":".fh_appform_button_navigation{background-color:#29c5e7;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_navigation:active{background-color:#249ec1;font-size:11pt;font-family:times;color:#040404;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_action{background-color:#14f4ea;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_action.special_button{width:100%;margin-top:10px;line-height:28px;}.fh_appform_button_action.special_button.fh_appform_removeInputBtn{width:50%;margin-top:10px;line-height:28px;}.fh_appform_button_action.special_button.fh_appform_addInputBtn{width:50%;margin-top:10px;line-height:28px;}.fh_appform_button_action:active{background-color:#1eecec;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_cancel{background-color:#49abce;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_button_cancel:active{background-color:#2190b8;font-size:11pt;font-family:times;color:#f7f3f3;font-weight:bold;font-style:normal;border-radius:5px;}.fh_appform_navigation{background-color:#6b739f;}.fh_appform_header{background-color:#42beea;}.fh_appform_body{background-color:#ece6ea;}.fh_appform_form{background-color:#ffffff;border:none;padding:5px;}.fh_appform_field_title{font-size:18pt;font-family:times;color:#090909;font-weight:bold;font-style:normal;display:block;}.fh_appform_field_title.fh_appform_field_numbering{display:inline-block;}.fh_appform_field_area{background-color:#fbf9f6;border-width:thin;border-style:dotted;border-color:#000000;padding:5px;border-bottom:none;border-radius:5px;}.fh_appform_field_area:last-child{border-width:thin;border-style:dotted;border-color:#000000;}.fh_appform_field_area.fh_appform_field_section_break{border:none;background:transparent;}.fh_appform_field_input{background-color:#f6eff3;font-size:18pt;font-family:times;color:#060506;font-weight:normal;font-style:normal;border-width:thin;border-style:solid;border-color:#000000;width:100%;border-radius:5px;line-height:1.4em;padding:5px 0px 5px 5px;}.fh_appform_field_instructions{background-color:#f6f7f6;font-size:14pt;font-family:times;color:#060606;font-weight:normal;font-style:normal;border:none;margin-bottom:10px;border-radius:5px;}.fh_appform_title{font-size:18pt;font-family:times;color:#000000;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_description{font-size:14pt;font-family:times;color:#000000;font-weight:normal;font-style:normal;text-align:center;}.fh_appform_error{font-size:14pt;font-family:times;color:#fb0000;font-weight:normal;font-style:normal;background-color:#f7f4f4;border-width:medium;border-style:solid;border-color:#f00a0a;}.fh_appform_field_section_break_title{font-size:11pt;font-family:times;color:#050605;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_field_section_break_description{font-size:11pt;font-family:times;color:#070707;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_page_title{font-size:12pt;font-family:times;color:#0b0b0b;font-weight:bold;font-style:normal;text-align:center;}.fh_appform_page_description{font-size:11pt;font-family:times;color:#070707;font-style:italic;font-weight:normal;text-align:center;}.fh_appform_progress_wrapper{padding-top:20px;padding-bottom:10px;}.fh_appform_progress_steps{background-color:#ffffff;border:none;width:100%;}.fh_appform_progress_steps td{text-align:center;}.fh_appform_progress_steps td.active .fh_appform_page_title{text-align:center;display:inline;}.fh_appform_progress_steps .fh_appform_page_title{padding-left:10px;display:none;}.fh_appform_progress_steps .number{padding-top:4px;}.fh_appform_progress_steps .number_container{background-color:#f7f7f7;border-width:thin;border-style:dotted;border-color:#0b0b0b;font-size:11pt;font-family:times;color:#070707;font-weight:bold;font-style:normal;display:inline-block;border-radius:13px;padding-left:10px;padding-right:10px;margin-top:5px;margin-bottom:5px;}.fh_appform_progress_steps td.active .number_container{background-color:#000000;border-width:thin;border-style:dotted;border-color:#0e0e0f;font-size:11pt;font-family:times;color:#f9f1f5;font-weight:bold;font-style:normal;}.fh_appform_field_required:first-child:after{color: #f40021;content:' *';display:inline;}.fh_appform_action_bar{padding:18px 20px 18px 20px;}.fh_appform_action_bar button.fh_appform_two_button{width:50%;}.fh_appform_action_bar button.fh_appform_three_button{width:33.3%;}.fh_appform_section_area{background-color:#f2f3f6;padding:5px;border-radius:5px;margin-top:5px;}.fh_appform_hidden{display:none;}.fh_appform_logo{background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAAjCAYAAABII5xqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxQjdBOTE5RjA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxQjdBOTFBMDA3RTQxMUUzQTkzNENDQ0NCMzY5MjIxNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFCN0E5MTlEMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFCN0E5MTlFMDdFNDExRTNBOTM0Q0NDQ0IzNjkyMjE3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+EXbGxwAADd1JREFUeNrsHQl0VNX1/j+TTDLZSCCGpWCAWilrFVFr3YqyFLVQFQGBSgXX9kgrdTnanuqxHltLtVVsoWArUKxCLYiUIpYKiNijoCwip1U2ASWREJYkM1nmv947/w6ZzPzl/Zk/k1j/Peee+ZP/5v7373t3ffe9KPsHKeAAeiOOQfwW4vmIBYgt4A4UI65AvA5Rs2ssGgQEhp4LFQvfADUvCEII8MADD1rBL9luCOJMxMmIuRnsTymiz1a4sUXLJwDlzzzsCbYHHqQo3GSZf454Z4aFOgYk1NaSqqJg7xFQNOE7UDDqam8EPfAgBeE+G/FFttodBkRYgHoGap1x39a/e1bbAw8cCfdwxOcRKwzvYpguWlComvE6gl/ziBLH7vh30ai3aWODhe5OR9uCaZxvmwDQagEC5w+DwrHTPMH2wANdZm5DPBNxHuK5iNWI/YyEeyjoia0iM7dYqxVRkr6KAsg9ewhoR6uhad9HoKDwqsVF4OvSDRuhh60opx+vqH7QwiGMlffjF2Emx4qlgGsiGhyUPfArb0g98KDVbFIyGoUOULjgGZahokThRocXlhgKtqJb6ZYDAgIDukPxnbOgcDyG4pEWODL5QhD1+BQUvNwBZ8EZc9eghS4A0RQ+LapqURk0vrsRqu8cA9qJelBSiOC1EEDw8osgb+iFMs1Jk5XqvbbUeqiu4CPEOot2ZYiVoPsqNhkBOIx41MW+7UE8ZUOvkvvYbECjCbEKsTaNCURJzh78bhEH7T8BudWUXohdbPirMi3iR9iiXS5P9MPgfCWH+nGEeWYHPRHLE/pM/G5kIWuUfGYnngv7wS7f1BaKeczpd3uZP8BWuw+NQaJwP8mxdrIb3qS72yV3TIGSW+6HnL4DdEp33ACh9bvAf6YCok5ELbaCZNX8IABh/OgUliApJeUZpuEUL7n1QVQMATuXnF5uLWJfSdJ/RJxucq+IPZlLJGm9hXiRTd9eRfyyJL2FiNMs7n+D3zVoodlJyLYhLkVchhhyyPqbEBcg3oz4nET7GxEXId7OrqIVkKf4L56sMvBbxB9a3L8G8a+I9yE+7uAdxyG+hHgP4hM2bQchbmChTJqmiB8gzkecK6EoyA2dgXgF80EWnuJx+SriasSz+O+/5zGviBfuiTwoBoKN6roG1cR9d0PprF+fvhXesgHqli8Df0+ldfFKaFFr3jbZpegeOv1dSV24FfkEWh8WbGr8ITNcNSFJwrvPghblHYbx9V4eLDNaNEH/K2Fl+/D1h2wJrejts6H3FRbsBsSDBmFNCWJ3tqRXIf4E8VbE9Q5YP4DpDpRs3z/ud3bQm9+TFM7HFmEZeQOFiAds6PXjz18yf5c76LMq+Y49WbDD3GcRN2YVTIOUENWEXMtjYwaH+XMx4gWIhySefy8L9kn2HIj+dr73tlFC7UeGZCK6xS6eci2UznysjTmoW75QpxBLnunSB6byR4JNmPk8WExbvs4aMV1agplOVua4C/RoEr2BeKkL7xpzUV+w8D5owlHh0Q/4HdaBvrw5T/IZoYRPO6h30D42VisMjUvq/ACOP0nZ7nL5HWMu9z9YeI28h9mIo5jHUy1oPcTe8kT2IEfZuOcjWHERjOcwxTSOIZgEesVZsmxj9BgYOBjKn0BPx5972nJqR49AeNMqUIOQnBW3sr1pWO4Ukw0diU579a2K3enzEB/gcZ9rM+mMniEy0DeRIX40cexN752XoX6YtX2FhRT9XZiCONKGzh2IWxME18xjWMzX93A4BnbCbfhwWu5S0GntdNfDUcFs4xLnBUFrMsh/RNsIc78asircSgellXVGxMFj7JYT/IHjx44AbvNjDsfe5/F1tvu8n+NpkPBIjnM+I8RCa5RjyUF8lr2whewZgJ1wUyw23FC40cEpGH01BK8cZ+BhYxytyrrY3EhRs225PTCG+ZyQIYt29//pO1Ku4nvstUznkCTbsJM/ZRK7OzixBuzKn2OQeBvB7WbKPFzlhEYvI52k1QEUTborITnWaqG1BhFto9XhZ0jY615SBtYKQUA2InIPCH7BFmMaGK2QfP6BltZoefMW/v60C/kXpxBbwWiWbP88u+W57H6X8N9vZoGmfMJ3EU/ICrfhkoxoFuArQ3kNmqywoHD7u5ZC3pBKKJ46HYonz0BhJ8m0kE+hZNsbbXDR/WpxWfE0tPPk/xTxL3z9dUn3U3bdOJJCfxpdfj8lLv59iK//BPrKQbYgFu7+28Fv7kdcBfpKw6OIF7NiAg6ntssSolx3pZlLHujXFwW4l6F5VQIB6LroTVA7V6C3rcLJ52brZad0V3SYKJMG8mugL4UFDHryH0ktSJOVNtHQUgUVCeQn0KJ4iLKWhxz27TxmZ65B33ZDeoUnMrCFP88B6/Xr2EIneXlnsVU0g2pu5zQ5ReHhUJ6TaoIBIjofQOorFQ9zbuE6DkmuysLcm8xeAynEJQ5/S+WkmxG/D3pCLshu+WInRIiRhmWmJKi+HpXgK+9uaLUhJ4D3ukW/1s6+D2oeeRz85TbDaR9vu2naKVtKdbbvWbShoo4JErTCPKFftWhDg/FNkKtuCvNke8eiDSWDxmd4AsYU2xmSlngaWBfUpGPBRzCaARWWzErjXW9jxTSGQ5L7XeJhnzj+kRKkirOJHO8T0Jr0Loc0P2E+r2XXfHUq/fWD2VZOCqFz8JbPZ0kgtHkNHH/qcfB1BuNSjEThVi0buen65jC93QZ+g8LacKckrVint3P8pCbQKmUr2OSgbzTxt/H7qgZ925YF6+KTjAljvPsM9EKeHBulSpa7wqGiJkXzkcFYEW+KUxCQRKjhxBpVEFL12vuIf06T5jDuV6zKI3HJjWpHfpMi7fWIGzlP8CxIHGBiJNzCbDhFRNM3gBgIpMJW+NSLC0GrR0JfUqKnoxhXsPBYNTVylZq5rkgxXjObkFTON8oFWjRoVP11OaRfxBITqvVs6dsTYm7Zx5JKgEobfyZB90HQzwHwOejLKnZBMx2GUNxKxSLzWFnvTIMeVZcdQxzM33cwL0lJLXBBIWnp5CNUa0tpfXZCePtbUL/8BfB3j2smjGJuwXF8CCI1taCY7yKvcjlp5XeRluryRPO1s2CrcYpvs8MklVvtMslfM6Ck2pPsHS0C+Zp2IyDrf2mcgtiPeANb7F0u9FVJZ65YM1SYJMfYaoc3rAERdVIVQ2FOUhWN4ejmD/CZjv1u8CBbQJtbRnN8t+UL9u6x6i5Ktj6dQn4gBmUcToxkAacTRKiWPdARXtLacptUm0X3gJyogYZ1S0EtkLC1rAwaVi+xstoxTehB5oGy/bEyR6q/rv6CvX+E3XPyFGndeALH5KkCbROlDPzb7A0tT9MjcE24NVOHQJjF0HRbhUjVkWTbLyJJvyFSWt1JCL2+EhTzVMwBT7izApRAfYEtN1nsJ76gfKD5dhNfz4m7TjUsPMieELnjtEmHNsJ0am/hBqeWW/+lAkqiex016ZG2S16xxNviJ6H5YI3VIQ2vQev2t2RlghY/Uou9OdUufPo8FLHIZOrpPLyN7D7uZasV7iDC1tgOz6SlTcqcd4HWgpN0juquZTrvgp4spQKavPZiqB+sUuy0N9ts/6bBnwWyxd+jN6glpW2kovG9TVA75zFdlfgNy0/JTVpq6UfVCgheUQmBoYNTSUikK9jEI6oHuAz05aB8k7Y+Fpo9EnRph88lkFzEEv9corfNxm2OvWNvtsaBhPem773YXRzH97ayK7pHkgeqQ34qDtrH2lAfL4bkIpb4PtA8oQz3MRf7Sgc6UM3BlBT6bNSWchh0LO9L/D4rQV/3Ppbi3Et5HlsuhUWXwTQzYyXa7s2my5MAwdFT0PUO6At/eD9SdQCqb70etBON4OuimKmSlWy5zYUbWRMccT34u/aUObDBzW2ExIlmTp68LNH+fbDfaUXWsj9bUTsgF3qSxGQeBfbLfifYDZ/t0HNQpTy9tvNKtn2s7XAw2cCUAPOhdVeb1dg7WRemTSWDGXMk2vtshO5Tds3pPIER7PbfmKJ8ZkC4o+wxj7nbTH0cwki1gNwhZ0P+lWNaJWLf+1A1Yyw0H6oCX1fFLB9JE/1RKRUmf9rpLo55XnNBuCmW+h0PUrNNFwslnklZ1SWsAFps6JG3YFeXvJkTOD3YsokEoaTNE3QiCR0OsTbFxBEdSjCQP2XdXSolXS3R9h22cj1t+OFjj8mOH+t5DJwcWURKjwpcHkL8u0T7Hexyr7ChORb02oBUC5KoyKYK4k5XcWSV9g9SKGt6b5KlPI5u8CUXQMWCf4KSX5isHkP1cHjkmdBypOY06yvmrYT8y67RJXbrBqi+fTzG2Z+Bv8JyJxg92/Y4UzqYseyns6D0x7O9I4098CAdyy1C6J/07R8VbC2EHlxLU+u27NxcjIGPni5NjR7DNHVqVLBPLZsH4U2vQMPaN6IZcn83xWoFcaGMYHvggQcuCrevHIOydS9D6E2McRsbkjPgGI9rdSei/2SAsGHjamgY3hUih6pBnNJPcFE7Wwr232xiJw888CBN4TZMPCg5Cmi1tSCajpmG80oen4lGsl5TE61Wo3VspZxDRvOUBhXCz/DY74EH7WC5o3/10/qyRKIu2laxqz4joAwtbdub67HeAw8yCzYbR1wDKrCgI2SGeILtgQfZs9yZ3J1EJ53Q8slz4OB4GA888MAd4aZ1Q1p3jS/sjN/rmbjvU8TF6cLgHq1VUpUWrefS0TgnPTZ74EH24X8CDABUzdrPa7FHPAAAAABJRU5ErkJggg==\");height: 37px;width:237px;background-position:center;background-repeat:no-repeat;width:100%;}",
  "lastUpdated":"2014-01-23T14:51:43.975Z"
}
},{}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{}]},{},[12]);
