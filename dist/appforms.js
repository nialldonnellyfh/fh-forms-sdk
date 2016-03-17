//Drag & Drop Apps Javascript SDK
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//Should be moved to a test fixture..

var $ = require('jquery');

module.exports = $.ajax;
},{"jquery":6}],2:[function(require,module,exports){
module.exports = {
    "appId": "appId1234",
    "mode": "dev",
    "env": "dev",
    "deviceId": "dev1234",
    "cloudHost": "host",
    "mbaasBaseUrl": "/mbaas",
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
    "statusUrl": "/sys/info/ping",
    "userConfigValues": {

    },
    'formUrls': {
      'forms': '/forms/:appId',
      'form': '/forms/:appId/:formId',
      'theme': '/forms/:appId/theme',
      'formSubmission': '/forms/:appId/:formId/submitFormData',
      'fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFile',
      'base64fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFileBase64',
      'submissionStatus': '/forms/:appId/:submissionId/status',
      'formSubmissionDownload': '/forms/:appId/submission/:submissionId',
      'fileSubmissionDownload': '/forms/:appId/submission/:submissionId/file/:fileGroupId',
      'completeSubmission': '/forms/:appId/:submissionId/completeSubmission',
      'config': '/forms/:appid/config/:deviceId'
    }

};
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{"_process":8}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v1.11.2
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-17T15:27Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper window is present,
		// execute the factory and get jQuery
		// For environments that do not inherently posses a window with a document
		// (such as Node.js), expose a jQuery-making factory as module.exports
		// This accentuates the need for the creation of a real window
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//

var deletedIds = [];

var slice = deletedIds.slice;

var concat = deletedIds.concat;

var push = deletedIds.push;

var indexOf = deletedIds.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var support = {};



var
	version = "1.11.2",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android<4.1, IE<9
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: deletedIds.sort,
	splice: deletedIds.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		/* jshint eqeqeq: false */
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		// adding 1 corrects loss of precision from parseFloat (#15100)
		return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	isPlainObject: function( obj ) {
		var key;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!hasOwn.call(obj, "constructor") &&
				!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		if ( support.ownLast ) {
			for ( key in obj ) {
				return hasOwn.call( obj, key );
			}
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Support: Android<4.1, IE<9
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( indexOf ) {
				return indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		while ( j < len ) {
			first[ i++ ] = second[ j++ ];
		}

		// Support: IE<9
		// Workaround casting of .length to NaN on otherwise arraylike objects (e.g., NodeLists)
		if ( len !== len ) {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: function() {
		return +( new Date() );
	},

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// http://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + characterEncoding + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];
	nodeType = context.nodeType;

	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	if ( !seed && documentIsHTML ) {

		// Try to shortcut find operations when possible (e.g., not under DocumentFragment)
		if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType !== 1 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, parent,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;
	parent = doc.defaultView;

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", unloadHandler, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Support tests
	---------------------------------------------------------------------- */
	documentIsHTML = !isXML( doc );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\f]' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
			if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibing-combinator selector` fails
			if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) !== not;
	});
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		}));
};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
});


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof rootjQuery.ready !== "undefined" ?
				rootjQuery.ready( selector ) :
				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.extend({
	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

jQuery.fn.extend({
	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.unique(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				ret = jQuery.unique( ret );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				ret = ret.reverse();
			}
		}

		return this.pushStack( ret );
	};
});
var rnotwhite = (/\S+/g);



// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ tuple[ 0 ] + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );

					} else if ( !(--remaining) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {
	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend({
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.triggerHandler ) {
			jQuery( document ).triggerHandler( "ready" );
			jQuery( document ).off( "ready" );
		}
	}
});

/**
 * Clean-up method for dom ready events
 */
function detach() {
	if ( document.addEventListener ) {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );

	} else {
		document.detachEvent( "onreadystatechange", completed );
		window.detachEvent( "onload", completed );
	}
}

/**
 * The ready event handler and self cleanup method
 */
function completed() {
	// readyState === "complete" is good enough for us to call the dom ready in oldIE
	if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
		detach();
		jQuery.ready();
	}
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};


var strundefined = typeof undefined;



// Support: IE<9
// Iteration over object's inherited properties before its own
var i;
for ( i in jQuery( support ) ) {
	break;
}
support.ownLast = i !== "0";

// Note: most support tests are defined in their respective modules.
// false until the test is run
support.inlineBlockNeedsLayout = false;

// Execute ASAP in case we need to set body.style.zoom
jQuery(function() {
	// Minified: var a,b,c,d
	var val, div, body, container;

	body = document.getElementsByTagName( "body" )[ 0 ];
	if ( !body || !body.style ) {
		// Return for frameset docs that don't have a body
		return;
	}

	// Setup
	div = document.createElement( "div" );
	container = document.createElement( "div" );
	container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
	body.appendChild( container ).appendChild( div );

	if ( typeof div.style.zoom !== strundefined ) {
		// Support: IE<8
		// Check if natively block-level elements act like inline-block
		// elements when setting their display to 'inline' and giving
		// them layout
		div.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1";

		support.inlineBlockNeedsLayout = val = div.offsetWidth === 3;
		if ( val ) {
			// Prevent IE 6 from affecting layout for positioned elements #11048
			// Prevent IE from shrinking the body in IE 7 mode #12869
			// Support: IE<8
			body.style.zoom = 1;
		}
	}

	body.removeChild( container );
});




(function() {
	var div = document.createElement( "div" );

	// Execute the test only if not already executed in another module.
	if (support.deleteExpando == null) {
		// Support: IE<9
		support.deleteExpando = true;
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
})();


/**
 * Determines whether an object can have data
 */
jQuery.acceptData = function( elem ) {
	var noData = jQuery.noData[ (elem.nodeName + " ").toLowerCase() ],
		nodeType = +elem.nodeType || 1;

	// Do not set data on non-element DOM nodes because it will not be cleared (#8335).
	return nodeType !== 1 && nodeType !== 9 ?
		false :

		// Nodes accept data unless otherwise specified; rejection can be conditional
		!noData || noData !== true && elem.getAttribute("classid") === noData;
};


var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}

function internalData( elem, name, data, pvt /* Internal Use Only */ ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var ret, thisCache,
		internalKey = jQuery.expando,

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && data === undefined && typeof name === "string" ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			id = elem[ internalKey ] = deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {
		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		cache[ id ] = isNode ? {} : { toJSON: jQuery.noop };
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( typeof name === "string" ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, i,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	} else if ( support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	cache: {},

	// The following elements (space-suffixed to avoid Object.prototype collisions)
	// throw uncatchable exceptions if you attempt to set expando properties
	noData: {
		"applet ": true,
		"embed ": true,
		// ...but Flash objects (which have this classid) *can* handle expandos
		"object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[0],
			attrs = elem && elem.attributes;

		// Special expections of .data basically thwart jQuery.access,
		// so implement the relevant behavior ourselves

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE11+
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice(5) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return arguments.length > 1 ?

			// Sets one value
			this.each(function() {
				jQuery.data( this, key, value );
			}) :

			// Gets one value
			// Try to fetch any internally stored data first
			elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : undefined;
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});


jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;

var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {
		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
	};



// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = jQuery.access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		length = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {
			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < length; i++ ) {
				fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			length ? fn( elems[0], key ) : emptyGet;
};
var rcheckableType = (/^(?:checkbox|radio)$/i);



(function() {
	// Minified: var a,b,c
	var input = document.createElement( "input" ),
		div = document.createElement( "div" ),
		fragment = document.createDocumentFragment();

	// Setup
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// IE strips leading whitespace when .innerHTML is used
	support.leadingWhitespace = div.firstChild.nodeType === 3;

	// Make sure that tbody elements aren't automatically inserted
	// IE will insert them into empty tables
	support.tbody = !div.getElementsByTagName( "tbody" ).length;

	// Make sure that link elements get serialized correctly by innerHTML
	// This requires a wrapper element in IE
	support.htmlSerialize = !!div.getElementsByTagName( "link" ).length;

	// Makes sure cloning an html5 element does not cause problems
	// Where outerHTML is undefined, this still works
	support.html5Clone =
		document.createElement( "nav" ).cloneNode( true ).outerHTML !== "<:nav></:nav>";

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	input.type = "checkbox";
	input.checked = true;
	fragment.appendChild( input );
	support.appendChecked = input.checked;

	// Make sure textarea (and checkbox) defaultValue is properly cloned
	// Support: IE6-IE11+
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

	// #11217 - WebKit loses check when the name is after the checked attribute
	fragment.appendChild( div );
	div.innerHTML = "<input type='radio' checked='checked' name='t'/>";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	support.noCloneEvent = true;
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});

		div.cloneNode( true ).click();
	}

	// Execute the test only if not already executed in another module.
	if (support.deleteExpando == null) {
		// Support: IE<9
		support.deleteExpando = true;
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}
	}
})();


(function() {
	var i, eventName,
		div = document.createElement( "div" );

	// Support: IE<9 (lack submit/change bubble), Firefox 23+ (lack focusin event)
	for ( i in { submit: true, change: true, focusin: true }) {
		eventName = "on" + i;

		if ( !(support[ i + "Bubbles" ] = eventName in window) ) {
			// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
			div.setAttribute( eventName, "t" );
			support[ i + "Bubbles" ] = div.attributes[ eventName ].expando === false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
})();


var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			/* jshint eqeqeq: false */
			for ( ; cur != this; cur = cur.parentNode || this ) {
				/* jshint eqeqeq: true */

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&
				// Support: IE < 9, Android < 4.0
				src.returnValue === false ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && e.stopImmediatePropagation ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				jQuery._data( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					jQuery._removeData( doc, fix );
				} else {
					jQuery._data( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});


function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		area: [ 1, "<map>", "</map>" ],
		param: [ 1, "<object>", "</object>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
		// unless wrapped in a div with non-breaking characters in front of it.
		_default: support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>"  ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

// Used in buildFragment, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

// Support: IE<8
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (jQuery.find.attr( elem, "type" ) !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}
	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; (elem = elems[i]) != null; i++ ) {
		jQuery._data( elem, "globalEval", !refElements || jQuery._data( refElements[i], "globalEval" ) );
	}
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( support.html5Clone && ( src.innerHTML && !jQuery.trim(dest.innerHTML) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!support.noCloneEvent || !support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; (node = srcElements[i]) != null; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					fixCloneNodeIssues( node, destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; (node = srcElements[i]) != null; i++ ) {
					cloneCopyEvent( node, destElements[i] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var j, elem, contains,
			tmp, tag, tbody, wrap,
			l = elems.length,

			// Ensure a safe fragment
			safe = createSafeFragment( context ),

			nodes = [],
			i = 0;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || safe.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = (rtagName.exec( elem ) || [ "", "" ])[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;

					tmp.innerHTML = wrap[1] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[2];

					// Descend through wrappers to the right content
					j = wrap[0];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Manually add leading whitespace removed by IE
					if ( !support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[0] ) );
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						elem = tag === "table" && !rtbody.test( elem ) ?
							tmp.firstChild :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !rtbody.test( elem ) ?
								tmp :
								0;

						j = elem && elem.childNodes.length;
						while ( j-- ) {
							if ( jQuery.nodeName( (tbody = elem.childNodes[j]), "tbody" ) && !tbody.childNodes.length ) {
								elem.removeChild( tbody );
							}
						}
					}

					jQuery.merge( nodes, tmp.childNodes );

					// Fix #12392 for WebKit and IE > 9
					tmp.textContent = "";

					// Fix #12392 for oldIE
					while ( tmp.firstChild ) {
						tmp.removeChild( tmp.firstChild );
					}

					// Remember the top-level container for proper cleanup
					tmp = safe.lastChild;
				}
			}
		}

		// Fix #11356: Clear elements from fragment
		if ( tmp ) {
			safe.removeChild( tmp );
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !support.appendChecked ) {
			jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
		}

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( safe.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		tmp = null;

		return safe;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( typeof elem.removeAttribute !== strundefined ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						deletedIds.push( id );
					}
				}
			}
		}
	}
});

jQuery.fn.extend({
	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	remove: function( selector, keepData /* Internal Use Only */ ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ (rtagName.exec( value ) || [ "", "" ])[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var arg = arguments[ 0 ];

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			arg = this.parentNode;

			jQuery.cleanData( getAll( this ) );

			if ( arg ) {
				arg.replaceChild( elem, this );
			}
		});

		// Force removal if there was no new content (e.g., from empty arguments)
		return arg && (arg.length || arg.nodeType) ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var first, node, hasScripts,
			scripts, doc, fragment,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[0] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[i], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!jQuery._data( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( ( node.text || node.textContent || node.innerHTML || "" ).replace( rcleanScript, "" ) );
							}
						}
					}
				}

				// Fix #11809: Avoid leaking memory
				fragment = first = null;
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone(true);
			jQuery( insert[i] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});


var iframe,
	elemdisplay = {};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */
// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var style,
		elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		// getDefaultComputedStyle might be reliably used only on attached element
		display = window.getDefaultComputedStyle && ( style = window.getDefaultComputedStyle( elem[ 0 ] ) ) ?

			// Use of this method is a temporary fix (more like optmization) until something better comes along,
			// since it was removed from specification and supported only in FF
			style.display : jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = (iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[ 0 ].contentWindow || iframe[ 0 ].contentDocument ).document;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}


(function() {
	var shrinkWrapBlocksVal;

	support.shrinkWrapBlocks = function() {
		if ( shrinkWrapBlocksVal != null ) {
			return shrinkWrapBlocksVal;
		}

		// Will be changed later if needed.
		shrinkWrapBlocksVal = false;

		// Minified: var b,c,d
		var div, body, container;

		body = document.getElementsByTagName( "body" )[ 0 ];
		if ( !body || !body.style ) {
			// Test fired too early or in an unsupported environment, exit.
			return;
		}

		// Setup
		div = document.createElement( "div" );
		container = document.createElement( "div" );
		container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
		body.appendChild( container ).appendChild( div );

		// Support: IE6
		// Check if elements with layout shrink-wrap their children
		if ( typeof div.style.zoom !== strundefined ) {
			// Reset CSS: box-sizing; display; margin; border
			div.style.cssText =
				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
				"box-sizing:content-box;display:block;margin:0;border:0;" +
				"padding:1px;width:1px;zoom:1";
			div.appendChild( document.createElement( "div" ) ).style.width = "5px";
			shrinkWrapBlocksVal = div.offsetWidth !== 3;
		}

		body.removeChild( container );

		return shrinkWrapBlocksVal;
	};

})();
var rmargin = (/^margin/);

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );



var getStyles, curCSS,
	rposition = /^(top|right|bottom|left)$/;

if ( window.getComputedStyle ) {
	getStyles = function( elem ) {
		// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		if ( elem.ownerDocument.defaultView.opener ) {
			return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
		}

		return window.getComputedStyle( elem, null );
	};

	curCSS = function( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;

		computed = computed || getStyles( elem );

		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;

		if ( computed ) {

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "";
	};
} else if ( document.documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, computed ) {
		var left, rs, rsLeft, ret,
			style = elem.style;

		computed = computed || getStyles( elem );
		ret = computed ? computed[ name ] : undefined;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "" || "auto";
	};
}




function addGetHookIf( conditionFn, hookFn ) {
	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			var condition = conditionFn();

			if ( condition == null ) {
				// The test was not ready at this point; screw the hook this time
				// but check again when needed next time.
				return;
			}

			if ( condition ) {
				// Hook not needed (or it's not possible to use it due to missing dependency),
				// remove it.
				// Since there are no other hooks for marginRight, remove the whole object.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.

			return (this.get = hookFn).apply( this, arguments );
		}
	};
}


(function() {
	// Minified: var b,c,d,e,f,g, h,i
	var div, style, a, pixelPositionVal, boxSizingReliableVal,
		reliableHiddenOffsetsVal, reliableMarginRightVal;

	// Setup
	div = document.createElement( "div" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName( "a" )[ 0 ];
	style = a && a.style;

	// Finish early in limited (non-browser) environments
	if ( !style ) {
		return;
	}

	style.cssText = "float:left;opacity:.5";

	// Support: IE<9
	// Make sure that element opacity exists (as opposed to filter)
	support.opacity = style.opacity === "0.5";

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	support.cssFloat = !!style.cssFloat;

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Support: Firefox<29, Android 2.3
	// Vendor-prefix box-sizing
	support.boxSizing = style.boxSizing === "" || style.MozBoxSizing === "" ||
		style.WebkitBoxSizing === "";

	jQuery.extend(support, {
		reliableHiddenOffsets: function() {
			if ( reliableHiddenOffsetsVal == null ) {
				computeStyleTests();
			}
			return reliableHiddenOffsetsVal;
		},

		boxSizingReliable: function() {
			if ( boxSizingReliableVal == null ) {
				computeStyleTests();
			}
			return boxSizingReliableVal;
		},

		pixelPosition: function() {
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return pixelPositionVal;
		},

		// Support: Android 2.3
		reliableMarginRight: function() {
			if ( reliableMarginRightVal == null ) {
				computeStyleTests();
			}
			return reliableMarginRightVal;
		}
	});

	function computeStyleTests() {
		// Minified: var b,c,d,j
		var div, body, container, contents;

		body = document.getElementsByTagName( "body" )[ 0 ];
		if ( !body || !body.style ) {
			// Test fired too early or in an unsupported environment, exit.
			return;
		}

		// Setup
		div = document.createElement( "div" );
		container = document.createElement( "div" );
		container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
		body.appendChild( container ).appendChild( div );

		div.style.cssText =
			// Support: Firefox<29, Android 2.3
			// Vendor-prefix box-sizing
			"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" +
			"box-sizing:border-box;display:block;margin-top:1%;top:1%;" +
			"border:1px;padding:1px;width:4px;position:absolute";

		// Support: IE<9
		// Assume reasonable values in the absence of getComputedStyle
		pixelPositionVal = boxSizingReliableVal = false;
		reliableMarginRightVal = true;

		// Check for getComputedStyle so that this code is not run in IE<9.
		if ( window.getComputedStyle ) {
			pixelPositionVal = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			boxSizingReliableVal =
				( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Support: Android 2.3
			// Div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container (#3333)
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			contents = div.appendChild( document.createElement( "div" ) );

			// Reset CSS: box-sizing; display; margin; border; padding
			contents.style.cssText = div.style.cssText =
				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
				"box-sizing:content-box;display:block;margin:0;border:0;padding:0";
			contents.style.marginRight = contents.style.width = "0";
			div.style.width = "1px";

			reliableMarginRightVal =
				!parseFloat( ( window.getComputedStyle( contents, null ) || {} ).marginRight );

			div.removeChild( contents );
		}

		// Support: IE8
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		contents = div.getElementsByTagName( "td" );
		contents[ 0 ].style.cssText = "margin:0;border:0;padding:0;display:none";
		reliableHiddenOffsetsVal = contents[ 0 ].offsetHeight === 0;
		if ( reliableHiddenOffsetsVal ) {
			contents[ 0 ].style.display = "";
			contents[ 1 ].style.display = "none";
			reliableHiddenOffsetsVal = contents[ 0 ].offsetHeight === 0;
		}

		body.removeChild( container );
	}

})();


// A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var
		ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/,

	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];


// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", defaultDisplay(elem.nodeName) );
			}
		} else {
			hidden = isHidden( elem );

			if ( display && display !== "none" || !hidden ) {
				jQuery._data( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set. See: #7116
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {

				// Support: IE
				// Swallow errors from 'invalid' CSS values (#5509)
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) && elem.offsetWidth === 0 ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

if ( !support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			// Work around by temporarily setting element display to inline-block
			return jQuery.swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	}
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		} ]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = jQuery._data( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );

		// Test default display if display is currently "none"
		checkDisplay = display === "none" ?
			jQuery._data( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

		if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !support.inlineBlockNeedsLayout || defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";
			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !support.shrinkWrapBlocks() ) {
			anim.always(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

		// Any non-fx value stops us from restoring the original display value
		} else {
			display = undefined;
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = jQuery._data( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}

	// If this is a noop like .hide().hide(), restore an overwritten display value
	} else if ( (display === "none" ? defaultDisplay( elem.nodeName ) : display) === "inline" ) {
		style.display = display;
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {
	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = setTimeout( next, time );
		hooks.stop = function() {
			clearTimeout( timeout );
		};
	});
};


(function() {
	// Minified: var a,b,c,d,e
	var input, div, select, a, opt;

	// Setup
	div = document.createElement( "div" );
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName("a")[ 0 ];

	// First batch of tests.
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px";

	// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
	support.getSetAttribute = div.className !== "t";

	// Get the style information from getAttribute
	// (IE uses .cssText instead)
	support.style = /top/.test( a.getAttribute("style") );

	// Make sure that URLs aren't manipulated
	// (IE normalizes it by default)
	support.hrefNormalized = a.getAttribute("href") === "/a";

	// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
	support.checkOn = !!input.value;

	// Make sure that a selected-by-default option has a working selected property.
	// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
	support.optSelected = opt.selected;

	// Tests for enctype support on a form (#6743)
	support.enctype = !!document.createElement("form").enctype;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE8 only
	// Check if we can trust getAttribute("value")
	input = document.createElement( "input" );
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";
})();


var rreturn = /\r/g;

jQuery.fn.extend({
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :
					// Support: IE10-11+
					// option.text throws exceptions (#14686, #14858)
					jQuery.trim( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					if ( jQuery.inArray( jQuery.valHooks.option.get( option ), values ) >= 0 ) {

						// Support: IE6
						// When new option element is added to select box we need to
						// force reflow of newly added node in order to workaround delay
						// of initialization properties
						try {
							option.selected = optionSet = true;

						} catch ( _ ) {

							// Will be executed only in IE6
							option.scrollHeight;
						}

					} else {
						option.selected = false;
					}
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}

				return options;
			}
		}
	}
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});




var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = support.getSetAttribute,
	getSetInput = support.input;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	}
});

jQuery.extend({
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
						elem[ propName ] = false;
					// Support: IE<9
					// Also clear defaultChecked/defaultSelected (if appropriate)
					} else {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	}
});

// Hook for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		// Use defaultChecked and defaultSelected for oldIE
		} else {
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}

		return name;
	}
};

// Retrieve booleans specially
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {

	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = getSetInput && getSetAttribute || !ruseDefault.test( name ) ?
		function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {
				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		} :
		function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem[ jQuery.camelCase( "default-" + name ) ] ?
					name.toLowerCase() :
					null;
			}
		};
});

// fix oldIE attroperties
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {
				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {
				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = {
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					(ret = elem.ownerDocument.createAttribute( name ))
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			if ( name === "value" || value === elem.getAttribute( name ) ) {
				return value;
			}
		}
	};

	// Some attributes are constructed with empty-string values when not defined
	attrHandle.id = attrHandle.name = attrHandle.coords =
		function( elem, name, isXML ) {
			var ret;
			if ( !isXML ) {
				return (ret = elem.getAttributeNode( name )) && ret.value !== "" ?
					ret.value :
					null;
			}
		};

	// Fixing value retrieval on a button requires this module
	jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			if ( ret && ret.specified ) {
				return ret.value;
			}
		},
		set: nodeHook.set
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		};
	});
}

if ( !support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case senstitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}




var rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend({
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	}
});

jQuery.extend({
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				return tabindex ?
					parseInt( tabindex, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						-1;
			}
		}
	}
});

// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !support.hrefNormalized ) {
	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each([ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	});
}

// Support: Safari, IE9+
// mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// IE6/7 call enctype encoding
if ( !support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}




var rclass = /[\t\r\n\f]/g;

jQuery.fn.extend({
	addClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = value ? jQuery.trim( cur ) : "";
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	}
});




// Return jQuery for attributes-only inclusion


jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});


var nonce = jQuery.now();

var rquery = (/\?/);



var rvalidtokens = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;

jQuery.parseJSON = function( data ) {
	// Attempt to parse using the native JSON parser first
	if ( window.JSON && window.JSON.parse ) {
		// Support: Android 2.3
		// Workaround failure to string-cast null input
		return window.JSON.parse( data + "" );
	}

	var requireNonComma,
		depth = null,
		str = jQuery.trim( data + "" );

	// Guard against invalid (and possibly dangerous) input by ensuring that nothing remains
	// after removing valid tokens
	return str && !jQuery.trim( str.replace( rvalidtokens, function( token, comma, open, close ) {

		// Force termination if we see a misplaced comma
		if ( requireNonComma && comma ) {
			depth = 0;
		}

		// Perform no more replacements after returning to outermost depth
		if ( depth === 0 ) {
			return token;
		}

		// Commas must not follow "[", "{", or ","
		requireNonComma = open || comma;

		// Determine new depth
		// array/object open ("[" or "{"): depth += true - false (increment)
		// array/object close ("]" or "}"): depth += false - true (decrement)
		// other cases ("," or primitive): depth += true - true (numeric cast)
		depth += !close - !open;

		// Remove this token
		return "";
	}) ) ?
		( Function( "return " + str ) )() :
		jQuery.error( "Invalid JSON: " + data );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	try {
		if ( window.DOMParser ) { // Standard
			tmp = new DOMParser();
			xml = tmp.parseFromString( data, "text/xml" );
		} else { // IE
			xml = new ActiveXObject( "Microsoft.XMLDOM" );
			xml.async = "false";
			xml.loadXML( data );
		}
	} catch( e ) {
		xml = undefined;
	}
	if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType.charAt( 0 ) === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Cross-domain detection vars
			parts,
			// Loop variable
			i,
			// URL without anti-cache param
			cacheURL,
			// Response headers as string
			responseHeadersString,
			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,
			// Response headers
			responseHeaders,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});


jQuery._evalUrl = function( url ) {
	return jQuery.ajax({
		url: url,
		type: "GET",
		dataType: "script",
		async: false,
		global: false,
		"throws": true
	});
};


jQuery.fn.extend({
	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});


jQuery.expr.filters.hidden = function( elem ) {
	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
		(!support.reliableHiddenOffsets() &&
			((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
};

jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function() {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function() {
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		})
		.map(function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});


// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject !== undefined ?
	// Support: IE6+
	function() {

		// XHR cannot access local files, always use ActiveX for that case
		return !this.isLocal &&

			// Support: IE7-8
			// oldIE XHR does not support non-RFC2616 methods (#13240)
			// See http://msdn.microsoft.com/en-us/library/ie/ms536648(v=vs.85).aspx
			// and http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9
			// Although this check for six methods instead of eight
			// since IE also does not support "trace" and "connect"
			/^(get|post|head|put|delete|options)$/i.test( this.type ) &&

			createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

var xhrId = 0,
	xhrCallbacks = {},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE<10
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if ( window.attachEvent ) {
	window.attachEvent( "onunload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	});
}

// Determine support properties
support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport(function( options ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !options.crossDomain || support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr(),
						id = ++xhrId;

					// Open the socket
					xhr.open( options.type, options.url, options.async, options.username, options.password );

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers["X-Requested-With"] ) {
						headers["X-Requested-With"] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						// Support: IE<9
						// IE's ActiveXObject throws a 'Type Mismatch' exception when setting
						// request header to a null-value.
						//
						// To keep consistent with other XHR implementations, cast the value
						// to string and ignore `undefined`.
						if ( headers[ i ] !== undefined ) {
							xhr.setRequestHeader( i, headers[ i ] + "" );
						}
					}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( options.hasContent && options.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, statusText, responses;

						// Was never called and is aborted or complete
						if ( callback && ( isAbort || xhr.readyState === 4 ) ) {
							// Clean up
							delete xhrCallbacks[ id ];
							callback = undefined;
							xhr.onreadystatechange = jQuery.noop;

							// Abort manually if needed
							if ( isAbort ) {
								if ( xhr.readyState !== 4 ) {
									xhr.abort();
								}
							} else {
								responses = {};
								status = xhr.status;

								// Support: IE<10
								// Accessing binary-data responseText throws an exception
								// (#11426)
								if ( typeof xhr.responseText === "string" ) {
									responses.text = xhr.responseText;
								}

								// Firefox throws an exception when accessing
								// statusText for faulty cross-domain requests
								try {
									statusText = xhr.statusText;
								} catch( e ) {
									// We normalize with Webkit giving an empty statusText
									statusText = "";
								}

								// Filter status for non standard behaviors

								// If the request is local and we have data: assume a success
								// (success with no data won't get notified, that's the best we
								// can do given current implementations)
								if ( !status && options.isLocal && !options.crossDomain ) {
									status = responses.text ? 200 : 404;
								// IE - #1450: sometimes returns 1223 when it should be 204
								} else if ( status === 1223 ) {
									status = 204;
								}
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, xhr.getAllResponseHeaders() );
						}
					};

					if ( !options.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback );
					} else {
						// Add to the list of active xhr callbacks
						xhr.onreadystatechange = xhrCallbacks[ id ] = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	});
}

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
	} catch( e ) {}
}




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery("head")[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement("script");

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
});




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});




// data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, response, type,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = jQuery.trim( url.slice( off, url.length ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep(jQuery.timers, function( fn ) {
		return elem === fn.elem;
	}).length;
};





var docElem = window.document.documentElement;

/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			jQuery.inArray("auto", [ curCSSTop, curCSSLeft ] ) > -1;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend({
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each(function( i ) {
					jQuery.offset.setOffset( this, options, i );
				});
		}

		var docElem, win,
			box = { top: 0, left: 0 },
			elem = this[ 0 ],
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// If we don't have gBCR, just use 0,0 rather than error
		// BlackBerry 5, iOS 3 (original iPhone)
		if ( typeof elem.getBoundingClientRect !== strundefined ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
			left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || docElem;
		});
	}
});

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// getComputedStyle returns percent when specified for top/left/bottom/right
// rather than make the css module depend on the offset module, we just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );
				// if curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
});


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});


// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	});
}




var
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in
// AMD (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === strundefined ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;

}));

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
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
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

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
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
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
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
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
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
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
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
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
    var set = isArrayLike(obj) ? obj : _.values(obj);
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
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
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
      iteratee = cb(iteratee, context);
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

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
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
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
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
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
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

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
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
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
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
  _.defer = _.partial(_.delay, _, 1);

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
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
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

      if (last < wait && last >= 0) {
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

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
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

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
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
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
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

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
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

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
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

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
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

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
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
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
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
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
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
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
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

},{}],10:[function(require,module,exports){
var Model = require("./model");
var formConfig = require("./config").getConfig();
var forms = require("./forms");
var Form = require("./form");
var theme = require("./theme");
var submissions = require("./submissions");
var submission = require("./submission");
var log = require("./log");
var init = require("./init");
var _ = require('underscore');
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
        log.d("Setting Offline Mode");
        formConfig.setOffline();
    },
    "online": function() {
        log.d("Setting Online Mode");
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
        log.d("Refreshing Config");
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

    if(_.isFunction(params)){
        return params("Invalid Parameters, Form Id Required");
    }

    params = params || {};

    if(!_.isString(params.formId)){
        if(_.isFunction(cb)){
            return cb("Invalid Parameters. Form ID Required");
        } else {
            return null;
        }
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;

    Form.fromLocal(params, function(err, form){
      if(err){
        return cb(err);
      }

      form.loadFromRemote(cb);
    });
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
            cb(null, submissions);
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
    init: init,
    photoUtils: require('./photoUtils'),
    fileSystem: require('./fileSystem')
};
},{"./config":11,"./fileSystem":23,"./form":24,"./forms":29,"./init":30,"./log":32,"./model":33,"./photoUtils":35,"./submission":39,"./submissions":40,"./theme":41,"underscore":9}],11:[function(require,module,exports){
//use strict

var Model = require("./model");
var utils = require("./utils");
var dataAgent = require('./dataAgent');
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
        //attempt to load config from local storage.
        self.refresh(false, cb);
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
    if (typeof cb === 'undefined' && typeof fromRemote === 'function') {
        cb = fromRemote;
        fromRemote = false;
    }

    self.loadLocal(function(err, localConfig) {
        if (err) {
            log.e("Config loadLocal ", err);
        }

        if(fromRemote){
             dataAgent.refreshRead(self, cb);
        } else {
            cb(err, self);
        }
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
    cloudHost = config.cloudHost || cloudHost;
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

module.exports = {
    init: function(params, cb){
        var config = getConfig();
        config.init(params, cb);
    },
    getConfig: getConfig
};



},{"../libs/constants.js":2,"./dataAgent":12,"./log":32,"./model":33,"./utils":44,"underscore":9}],12:[function(require,module,exports){
var storeMbaas = require("./storeMbaas");
var localStorage = require("./localStorage");
var utils = require("./utils");
var Store = require("./store");
var log = require("./log");
var _ = require('underscore');
var config;

_.defer(function(){
  config = require("./config").getConfig();
});


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

            log.d("Error reading model from localStore, Attempting Refresh ", model, err);

            // that.refreshRead(model, cb);
            return cb("Error reading model from localStore");
        } else {
            //local loading succeed
            return cb(null, locRes, false);
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
        if (config.isOnline()) {
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
                config.offline();
                return cb(false);
            }
        }
    }


    storeMbaas.isOnline(function(online) {
        if (online === false) {
            config.setOffline();
        } else {
            config.setOnline();
        }

        cb(null, online);
    });
};

module.exports = DataAgent;

},{"./config":11,"./localStorage":31,"./log":32,"./store":37,"./storeMbaas":38,"./utils":44,"underscore":9}],13:[function(require,module,exports){
/**
 * Field model for form
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
var Model = require("./model");
var log = require("./log");
var config = require("./config").getConfig();
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

},{"./config":11,"./fieldCheckboxes":14,"./fieldFile":15,"./fieldImage":16,"./fieldLocation":17,"./fieldMatrix":18,"./fieldRadio":19,"./log":32,"./model":33,"./utils":44}],14:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
/**
 * extension of Field class to support file field
 */
var Model = require("./model.js");
var log = require("./log.js");
var config = require("./config").getConfig();
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
},{"./config":11,"./localStorage.js":31,"./log.js":32,"./model.js":33,"./utils.js":44}],16:[function(require,module,exports){
/**
 * extension of Field class to support file field
 */

var localStorage = require("./localStorage.js");
var fileSystem = require("./fileSystem.js");
var log = require("./log.js");
var async = require("async");
var utils = require("./utils.js");
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
    genImageName(function (err, n) {
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
        localStorage.updateTextFile(imgName, dataArr[1], function (err, res) {
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
    fileSystem.readAsFile(inputValue, function (err, file) {
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
  async.map(value || [], function (meta, cb) {
    _loadImage(meta, function () {
      cb(null, meta);
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
      localStorage.readFileText(name, function (err, text) {
        if (err) {
          log.e(err);
        }
        meta.data = text;
        cb(err, meta);
      });
    } else if (meta.contentType === "binary") {
      localStorage.readFile(name, function (err, file) {
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
},{"./fileSystem.js":23,"./localStorage.js":31,"./log.js":32,"./utils.js":44,"async":4,"underscore":9}],17:[function(require,module,exports){
    /**
     * extension of Field class to support latitude longitude field
     */

    var Model = require("./model");
    var log = require("./log");

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
},{"./log":32,"./model":33}],18:[function(require,module,exports){
/**
 * extension of Field class to support matrix field
 */

var Model = require("./model");
var log = require("./log");

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
},{"./log":32,"./model":33}],19:[function(require,module,exports){
/**
 * extension of Field class to support radio field
 */

var Model = require("./model");
var log = require("./log");

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
},{"./log":32,"./model":33}],20:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
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

},{"./localStorage":31,"./log":32,"./model":33,"./utils":44}],21:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var localStorage = require("./localStorage");
var FileSubmission = require("./fileSubmission");
var utils = require("./utils");

function Base64FileSubmission(fileData) {
    FileSubmission.call(this, fileData);
    this.set('_type', 'base64fileSubmission');
}

utils.extend(Base64FileSubmission, FileSubmission);

module.exports = Base64FileSubmission;

},{"./fileSubmission":20,"./localStorage":31,"./log":32,"./model":33,"./utils":44}],22:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var config = require("./config").getConfig();
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

},{"./config":11,"./fileSubmission":20,"./localStorage":31,"./log":32,"./model":33,"./utils":44}],23:[function(require,module,exports){
var utils = require("./utils");
var async = require('async');
var _ = require('underscore');

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


function getBasePath(callback) {
  async.waterfall([

    function saveDummyFile(cb) {
      save("dummy.txt", "TestContnet", cb);
    },
    function getFileEntryPath(fileEntry, cb) {
      _getFileEntry("dummy.txt", 0, {}, function(err, fileEntry) {
        var sPath = fileEntry.fullPath.replace("dummy.txt", "");
        fileEntry.remove();
        return cb(null, sPath);
      });
    }
  ], callback);
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


function writePhonegapFile(fileEntry, saveObj, callback) {

  async.waterfall([

    function getFileParent(cb) {
      fileEntry.getParent(function(parentDir) {
        cb(undefined, parentDir);
      });
    },
    function resolveParentFile(parentDir, cb) {
      _resolveFile(saveObj.fullPath, function(err, fileToCopy) {
        cb(err, fileToCopy, parentDir);
      });
    },
    function removeDestinationFile(fileToCopy, parentDir, cb) {
      fileEntry.remove(function() {
        cb(undefined, fileToCopy, parentDir);
      });
    },
    function copyFileToDest(fileToCopy, parentDir, cb) {
      var fileName = fileEntry.name;
      fileToCopy.copyTo(parentDir, fileName, function(copiedFile) {
        return cb(null, copiedFile);
      }, function(err) {
        return cb(err);
      });
    }
  ], callback);
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
function save(fileName, content, callback) {
  var self = this;
  var saveObj = _getSaveObject(content);
  if (saveObj === null) {
    return cb("Invalid content type. Object was null");
  }
  var size = saveObj.size || saveObj.length;

  async.waterfall([

    function getFileEntry(cb) {
      _getFileEntry(fileName, size, {
        create: true
      }, cb);
    },
    function writeFile(fileEntry, cb) {
      if (utils.isPhoneGap() && saveObj instanceof File) {
        //Writing binary files is not possible in windows phone.
        //So if the thing to save is a file, and it is in phonegap, use the copyTo functions instead.
        writePhonegapFile(fileEntry, saveObj, cb);
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
          cb('Failed to create file write: ' + e);
        });
      }
    }
  ], callback);
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
},{"./utils":44,"async":4,"underscore":9}],24:[function(require,module,exports){
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
function Form(params) {
    params = params || {};
  var self = this;

  if(_.isString(params.formId)){
    self.setRemoteId(params.formId);
    self.setLocalId(params.formId);
  }

  var rawMode = params.rawMode || false;
  var rawData = params.rawData || undefined;
  self.setType('form');
  log.d("Form: ", rawMode, rawData);

  function processRawFormJSON() {
    self.fromJSON(rawData);
    self.getLocalId();
    self.initialise();
  }

  //Raw mode is for avoiding interaction with the mbaas
  if (rawMode === true && _.isObject(rawData)) {
    return processRawFormJSON();
  }
  return self;
}

utils.extend(Form, Model);

Form.prototype.loadFromRemote = function(cb) {
  var self = this;
  var id = self.getFormId();

  log.d("Form: loadFromRemote", id);

  self.refresh(true, function(err, refreshedForm) {
    self.initialise();

    _forms[id] = refreshedForm;
    return cb(err, refreshedForm);
  });
};

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

  pages = _.map(pages, function(page) {
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
    _.each(page.fields, function(field, fieldIndex) {
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
  var self = this;
  self.fields = {};
  for (var fieldId in fieldsRef) {
    var fieldRef = fieldsRef[fieldId];
    var pageIndex = fieldRef.page;
    var fieldIndex = fieldRef.field;

    var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
    self.fields[fieldId] = new Field(fieldDef, self);
  }
};
Form.prototype.initialisePage = function() {
  log.d("Form: initialisePage");
  var self = this;
  var pages = this.getPagesDef();
  self.pages = _.map(pages, function(pageDef){
    return new Page(pageDef, self);
  });
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

  return _.find(self.fields, function(field){
    return (field.getCode() !== null && field.getCode() === code);
  });
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

  var fileFields = _.filter(this.fields, function(field){
    return (field.getType() === 'file' || field.getType() === 'photo' || field.getType() === 'signature');
  });

  return _.map(fileFields, function(field){
    return field.getFieldId();
  });
};

Form.prototype.getRuleEngine = function() {
  log.d("Form: getRuleEngine");
  var formDefinition = this.getProps();
  return new RulesEngine(formDefinition);
};

//Getting An Already Saved Form
function fromLocal(params, cb) {
  params = params || {};
  var formId = params.formId;

  if (!formId) {
    log.e("No Form ID Passed: " + JSON.stringify(params));
    return cb("No Form ID Passed: " + JSON.stringify(params));
  }

  //Cached, just return the cached form.
  if (_forms[formId]) {
    return cb(undefined, _forms[formId]);
  }

  //No cached form, check local storage

  var form = newInstance({
    formId: formId
  });

  //Check local storage
  form.loadLocal(cb);
}

function newInstance(params) {
  var newForm = new Form(params);

  //Only one form with the same id is permitted to be loaded
  if(_forms[newForm.getRemoteId()]){
    //return _forms[newForm.getRemoteId()];
  }

  if (newForm.getRemoteId()) {
    newForm.setLocalId(newForm.getRemoteId());
    _forms[newForm.getRemoteId()] = newForm;
  }

  return newForm;
}


module.exports = {
  fromLocal: fromLocal,
  newInstance: newInstance
};
},{"./field":13,"./forms":29,"./log":32,"./model":33,"./page":34,"./rulesEngine":36,"./submission":39,"./utils":44,"underscore":9}],25:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
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
},{"./log":32,"./model":33,"./utils":44}],26:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
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
},{"./log":32,"./model":33,"./utils":44}],27:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
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
},{"./log":32,"./model":33,"./utils":44}],28:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
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
},{"./log":32,"./model":33,"./utils":44}],29:[function(require,module,exports){
var Model = require("./model");
var utils = require("./utils");
var log = require("./log");
var _ = require("underscore");
var async = require("async");

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
    return true;
  }
};

//Removes All Forms, Warnging: this will remove all forms from local storage.
Forms.prototype.clearAllForms = function(cb) {
  var self = this;

  var forms = self.getFormsList();

  async.eachSeries(forms, function(formMeta, cb) {
    var Form = require("./form");
    Form.fromLocal({
      formId: formMeta._id
    }, function(err, formModel) {
      if (err) {
        log.e("Forms: Error Loading Form ", err, formMeta);
        return cb();
      }

      formModel.clearLocal(cb);
    });
  }, function(err) {
    if (err) {
      log.e("Forms: Error clearing all forms ", err);
      return cb(err);
    }

    self.clearLocal(cb);
  });
};

Forms.prototype.setLocalId = function() {
  log.e("Forms setLocalId. Not Permitted for Forms.prototype.");
};
Forms.prototype.getFormMetaById = function(formId) {
  log.d("Forms getFormMetaById ", formId);
  var forms = this.getFormsList();

  return _.findWhere(forms, {
    _id: formId
  });
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

Forms.prototype.getForm = function(params, cb){
  params = params || {};

  if(!_.isString(params.formId)){
    return _.isFunction(cb) ? cb("Form Id Required") : null;
  }

  if(!this.getFormMetaById(params.formId)){
    return cb("No Form Exists With ID: " + params.formId);
  }

  Form.fromLocal(params, cb);
};


module.exports = new Forms();
},{"./form":24,"./log":32,"./model":33,"./utils":44,"async":4,"underscore":9}],30:[function(require,module,exports){
var log = require("./log");
var submissions = require("./submissions");
var uploadManager = require("./uploadManager");
var theme = require("./theme");
var forms = require("./forms");
var async = require('async');

var _ = require('underscore');
var config;

_.defer(function(){
    config = require("./config").getConfig();
});

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
    var passedConfig = def.config || {};

    async.series([
        function(cb) {
            log.loadLocal(cb);
        },
        function(cb) {
            log.l("Loading Config");
            config.init(passedConfig, cb);
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
},{"./config":11,"./forms":29,"./log":32,"./submissions":40,"./theme":41,"./uploadManager":42,"async":4,"underscore":9}],31:[function(require,module,exports){
/**
 * Local storage stores a model's json definition persistently.
 */
var utils = require("./utils.js");
var Store = require("./store.js");
var fileSystem = require("./fileSystem.js");
var Lawnchair = require("../libs/lawnchair.js");
var localStorage, localStorageLawnchair;
var _ = require('underscore');
var config = function(){
    return require("./config").getConfig();
};

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
        adapter: config().getStorageStrategy()
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
        var appid = config().get("appId", "");
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
},{"../libs/lawnchair.js":3,"./config":11,"./fileSystem.js":23,"./store.js":37,"./utils.js":44,"underscore":9}],32:[function(require,module,exports){
/**
 * Async log module
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */

var utils = require("./utils");
var localStorage = require('./localStorage');
var _ = require('underscore');
var config;

_.defer(function(){
    config = require("./config").getConfig();
});

var Log = {
    logs: [],
    isWriting: false,
    moreToWrite: false
};

Log.info = function(logLevel, msgs) {
    console.log(logLevel, msgs);
    var args = Array.prototype.slice.call(arguments, 0);

    var self = this;
    if (config.get("logger") === true) {
        var levelString = "";
        var curLevel = config.get("log_level");
        var log_levels = config.get("log_levels");

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
            if (logs.length > config.get("log_line_limit")) {
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
Log.loadLocal = function(cb){
    localStorage.read(this, cb);
};
Log.sendLogs = function(cb) {
    var email = config.get("log_email");
    var configJSON = config.getProps();
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

},{"./config":11,"./localStorage":31,"./utils":44,"underscore":9}],33:[function(require,module,exports){
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
    if (typeof cb === 'undefined' && typeof fromRemote === "function") {
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
    var self = this;
    localStorage.read(self, function(err, res) {
        if (err) {
            cb(err);
        } else {
            if (res) {
                self.fromJSON(res);
            }
            cb(err, self);
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

},{"./dataAgent":12,"./localStorage":31,"./utils":44,"eventemitter2":5,"underscore":9}],34:[function(require,module,exports){
/**
 * One form contains multiple pages
 */
var log = require("./log");
var config = require("./config").getConfig();
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

},{"./config":11,"./log":32,"./model":33,"./utils":44,"underscore":9}],35:[function(require,module,exports){
var log = require('./log');
var config;
var _ = require('underscore');
_.defer(function(){
  config = require("./config").getConfig();
});

var isPhoneGap = false;
var isHtml5 = false;
var video = null;
var canvas = null;
var ctx = null;
var localMediaStream = null;
function isHtml5CamAvailable() {
  checkEnv();
  return isHtml5;
}
function isPhoneGapAvailable() {
  checkEnv();
  return isPhoneGap;
}
function initHtml5Camera(params, cb) {
  checkEnv();
  _html5Camera(params, cb);
}
function cancelHtml5Camera() {
  if (localMediaStream) {
    localMediaStream.stop();
    localMediaStream = null;
  }
}
function takePhoto(params, cb) {
  params = params || {};
  log.d("Taking photo ", params, isPhoneGap);
  //use configuration
  var width = params.targetWidth ? params.targetWidth : config.get("targetWidth", 640);
  var height = params.targetHeight ? params.targetHeight : config.get("targetHeight", 480);
  var quality = params.quality ? params.quality : config.get("quality", 50);
  //For Safety, the default value of saving to photo album is true.
  var saveToPhotoAlbum = typeof(params.saveToPhotoAlbum) !== "undefined" ? params.saveToPhotoAlbum : config.get("saveToPhotoAlbum");
  var encodingType = params.encodingType ? params.encodingType : config.get("encodingType", 'jpeg');

  params.targetWidth = width;
  params.targetHeight = height;
  params.quality = quality;
  params.saveToPhotoAlbum = saveToPhotoAlbum;
  params.encodingType = encodingType;

  if ("undefined" === typeof(params.sourceType) && typeof(Camera) !== 'undefined') {
    params.sourceType = Camera.PictureSourceType.CAMERA;
  }

  if (isPhoneGap) {
    _phoneGapPhoto(params, cb);
  } else if (isHtml5) {
    snapshot(params, cb);
  } else {
    cb('Your device does not support camera.');
  }
}
function _phoneGapPhoto(params, cb) {
  params.encodingType = params.encodingType === 'jpeg' ? Camera.EncodingType.JPEG : Camera.EncodingType.PNG;
  navigator.camera.getPicture(_phoneGapPhotoSuccess(cb), cb, {
    quality: params.quality,
    targetWidth: params.targetWidth,
    targetHeight: params.targetHeight,
    sourceType: params.sourceType,
    saveToPhotoAlbum: params.saveToPhotoAlbum,
    destinationType: Camera.DestinationType.FILE_URI,
    encodingType: params.encodingType
  });
}
function _phoneGapPhotoSuccess(cb) {
  return function (imageData) {
    var imageURI = imageData;
    cb(null, imageURI);
  };
}
function _html5Camera(params, cb) {
  log.d("Taking photo _html5Camera", params, isPhoneGap);
  var width = params.targetWidth || config.get("targetWidth");
  var height = params.targetHeight || config.get("targetHeight");
  video.width = width;
  video.height = height;
  canvas.width = width;
  canvas.height = height;
  if (!localMediaStream) {
    navigator.getUserMedia({video: true, audio: false}, function (stream) {
      video.src = window.URL.createObjectURL(stream);
      localMediaStream = stream;
      cb(null, video);
    }, cb);
  } else {
    log.e('Media device was not released by browser.');
    cb('Media device occupied.');
  }
}

/**
 * Capturing a barcode using the PhoneGap barcode plugin
 */
function _phoneGapBarcode(params, cb) {
  //Checking for a cordova barcodeScanner plugin.
  if (window.cordova && window.cordova.plugins && window.cordova.plugins.barcodeScanner) {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        log.d("Barcode Found: " + JSON.stringify(result));
        return cb(null, result);
      },
      function (error) {
        log.e("Scanning failed: " + error);
        cb("Scanning failed: " + error);
      }
    );
  } else {
    return cb("Barcode plugin not installed");
  }
}

/**
 * Capturing a barcode using a webcam and image processors.
 * TODO Not complete yet.
 * @param params
 * @param cb
 * @private
 */
function _webBarcode(params, cb) {
  //TODO Web barcode decoding not supported yet.
  log.e("Web Barcode Decoding not supported yet.");
  return cb("Web Barcode Decoding not supported yet.");
}

function captureBarcode(params, cb) {
  if (isPhoneGapAvailable()) {
    _phoneGapBarcode(params, cb);
  } else {
    _webBarcode(params, cb);
  }
}
function checkEnv() {
  log.d("Checking env");
  if (navigator.camera && navigator.camera.getPicture) {
    // PhoneGap
    isPhoneGap = true;
  } else if (_browserWebSupport()) {
    isHtml5 = true;
    video = document.createElement('video');
    video.autoplay = 'autoplay';
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
  } else {
    console.error('Cannot detect usable media API. Camera will not run properly on this device.');
  }
}
function _browserWebSupport() {
  if (navigator.getUserMedia) {
    return true;
  }
  if (navigator.webkitGetUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia;
    return true;
  }
  if (navigator.mozGetUserMedia) {
    navigator.getUserMedia = navigator.mozGetUserMedia;
    return true;
  }
  if (navigator.msGetUserMedia) {
    navigator.getUserMedia = navigator.msGetUserMedia;
    return true;
  }
  return false;
}

function snapshot(params, cb) {
  log.d("Snapshot ", params);
  if (localMediaStream) {
    ctx.drawImage(video, 0, 0, params.targetWidth, params.targetHeight);
    // "image/webp" works in Chrome.
    // Other browsers will fall back to image/png.
    var base64 = canvas.toDataURL('image/png');
    var imageData = ctx.getImageData(0, 0, params.targetWidth, params.targetHeight);

    if (params.cancelHtml5Camera) {
      cancelHtml5Camera();
    }

    //Deciding whether to return raw image data or a base64 image.
    //rawData is mainly used for scanning for barcodes.
    if (params.rawData) {
      return cb(null, {imageData: imageData, width: params.targetWidth, height: params.targetHeight, base64: base64});
    } else {
      return cb(null, base64);
    }
  } else {
    log.e('Media resource is not available');
    cb('Resource not available');
  }
}

module.exports = {
  takePhoto: takePhoto,
  isPhoneGapCamAvailable: isPhoneGapAvailable,
  isHtml5CamAvailable: isHtml5CamAvailable,
  initHtml5Camera: initHtml5Camera,
  cancelHtml5Camera: cancelHtml5Camera,
  captureBarcode: captureBarcode
};

},{"./config":11,"./log":32,"underscore":9}],36:[function(require,module,exports){
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
},{"async":4,"underscore":9}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
var log = require("./log");
var utils = require("./utils");
var Store = require("./store");
var web = require("./web");
var _ = require('underscore');
var config;

_.defer(function(){
    config = require("./config").getConfig();
});

var mbaas;

function MBaaS() {
    this.name = 'MBaaS';
}

utils.extend(MBaaS, Store);

MBaaS.prototype.checkStudio = function() {
    return config.get("studioMode");
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
    var host = config.getCloudHost();
    var url = host + config.get('statusUrl', "/sys/info/ping");

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
    props.appId = config.get('appId');
    //Theme and forms do not require any parameters that are not in _fh
    switch (type) {
        case 'config':
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
    console.log("***** url ", url);
    return url;
}

function getMbaasStore(){
    if(!mbaas){
        mbaas = new MBaaS();
    }

    return mbaas;
}

module.exports = getMbaasStore();

},{"./config":11,"./log":32,"./store":37,"./utils":44,"./web":45,"underscore":9}],39:[function(require,module,exports){
//implmenetation
var _submissions = {};
//cache in mem for single reference usage.
var Model = require("./model.js");
var submissions = require("./submissions.js");
var log = require("./log.js");
var utils = require("./utils.js");
var config = require("./config.js").getConfig();
var uploadManager = require("./uploadManager.js");
var localStorage = require("./localStorage.js");
var Form = require("./form.js");
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
  this.setLocalId(localId);
  _submissions[localId] = this;
}

utils.extend(Submission, Model);

/**
 * save current submission as draft
 * @return {[type]} [description]
 */
Submission.prototype.saveDraft = function (cb) {
  log.d("Submission saveDraft: ");
  var targetStatus = 'draft';
  var that = this;
  this.set('timezoneOffset', utils.getTime(true));
  this.set('saveDate', utils.getTime());
  this.changeStatus(targetStatus, function (err) {
    if (err) {
      return cb(err);
    } else {
      that.emit('savedraft');
      cb(null, null);
    }
  });
};
Submission.prototype.validateField = function (fieldId, cb) {
  log.d("Submission validateField: ", fieldId);
  var that = this;
  this.getForm(function (err, form) {
    if (err) {
      cb(err);
    } else {
      var submissionData = that.getProps();
      var rE = form.getRuleEngine();
      rE.validateField(fieldId, submissionData, cb);
    }
  });
};
Submission.prototype.checkRules = function (cb) {
  log.d("Submission checkRules: ");
  var self = this;
  this.getForm(function (err, form) {
    if (err) {
      cb(err);
    } else {
      var submission = self.getProps();
      var rE = form.getRuleEngine();
      rE.checkRules(submission, cb);
    }
  });
};

Submission.prototype.performValidation = function (cb) {
  var self = this;
  self.getForm(function (err, form) {
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
Submission.prototype.validateSubmission = function (cb) {
  var self = this;

  self.performValidation(function (err, res) {
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
Submission.prototype.submit = function (cb) {
  var that = this;
  log.d("Submission submit: ");
  var targetStatus = 'pending';
  var validateResult = true;

  this.set('timezoneOffset', utils.getTime(true));
  that.performValidation(function (err, res) {
    if (err) {
      log.e("Submission submit validateForm: Error validating form ", err);
      cb(err);
    } else {
      log.d("Submission submit: validateForm. Completed result", res);
      var validation = res.validation;
      if (validation.valid) {
        log.d("Submission submit: validateForm. Completed Form Valid", res);
        that.set('submitDate', new Date());
        that.changeStatus(targetStatus, function (error) {
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
Submission.prototype.getUploadTask = function (cb) {
  var taskId = this.getUploadTaskId();
  if (taskId) {
    uploadManager.getTaskById(taskId, cb);
  } else {
    cb(null, null);
  }
};
Submission.prototype.getFormId = function () {
  return this.get("formId");
};
/**
 * If a submission is a download submission, the JSON definition of the form
 * that it was submitted against is contained in the submission.
 */
Submission.prototype.getFormSubmittedAgainst = function () {
  return this.get("formSubmittedAgainst");
};
Submission.prototype.getDownloadTask = function (cb) {
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
Submission.prototype.cancelUploadTask = function (cb) {
  var targetStatus = 'submit';
  var that = this;
  uploadManager.cancelSubmission(this, function (err) {
    if (err) {
      log.e(err);
    }
    that.changeStatus(targetStatus, cb);
  });
};
Submission.prototype.getUploadTaskId = function () {
  return this.get('uploadTaskId');
};
Submission.prototype.setUploadTaskId = function (utId) {
  this.set('uploadTaskId', utId);
};
Submission.prototype.isInProgress = function () {
  return this.get("status") === "inprogress";
};
Submission.prototype.isDownloaded = function () {
  return this.get("status") === "downloaded";
};
Submission.prototype.isSubmitted = function () {
  return this.get("status") === "submitted";
};
Submission.prototype.submitted = function (cb) {
  var self = this;
  if (self.isDownloadSubmission()) {
    var errMsg = "Downloaded submissions should not call submitted function.";
    log.e(errMsg);
    return cb(errMsg);
  }
  log.d("Submission submitted called");

  var targetStatus = 'submitted';

  self.set('submittedDate', utils.getTime());
  self.changeStatus(targetStatus, function (err) {
    if (err) {
      log.e("Error setting submitted status " + err);
      cb(err);
    } else {
      log.d("Submitted status set for submission " + self.get('submissionId') + " with localId " + self.getLocalId());
      self.emit('submitted', self.get('submissionId'));
      submissions.clearSentSubmission();
      cb(null, null);
    }
  });
};
Submission.prototype.queued = function (cb) {
  var self = this;
  if (self.isDownloadSubmission()) {
    var errMsg = "Downloaded submissions should not call queued function.";
    log.e(errMsg);
    return cb(errMsg);
  }

  var targetStatus = 'queued';
  self.set('queuedDate', utils.getTime());
  self.changeStatus(targetStatus, function (err) {
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
Submission.prototype.downloaded = function (cb) {
  log.d("Submission Downloaded called");
  var that = this;
  var targetStatus = 'downloaded';

  that.set('downloadedDate', utils.getTime());
  that.changeStatus(targetStatus, function (err) {
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
Submission.prototype.changeStatus = function (status, cb) {
  if (this.isStatusValid(status)) {
    var that = this;
    this.set('status', status);
    this.saveToList(function (err) {
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
Submission.prototype.upload = function (cb) {
  var targetStatus = "inprogress";
  var self = this;
  if (this.isStatusValid(targetStatus)) {
    this.set("status", targetStatus);
    this.set("uploadStartDate", utils.getTime());
    submissions.updateSubmissionWithoutSaving(this);
    uploadManager.queueSubmission(self, function (err, ut) {
      if (err) {
        cb(err);
      } else {
        ut.set("error", null);
        ut.saveLocal(function (err) {
          if (err) {
            log.e("Error saving upload task: " + err);
          }
          self.emit("inprogress", ut);
          ut.on("progress", function (progress) {
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
Submission.prototype.download = function (cb) {
  var that = this;
  log.d("Starting download for submission: " + that.getLocalId());
  var targetStatus = "pending";
  if (this.isStatusValid(targetStatus)) {
    this.set("status", targetStatus);
    targetStatus = "inprogress";
    if (this.isStatusValid(targetStatus)) {
      this.set("status", targetStatus);
      //Status is valid, add the submission to the
      uploadManager.queueSubmission(that, function (err, downloadTask) {
        if (err) {
          return cb(err);
        }
        downloadTask.set("error", null);
        downloadTask.saveLocal(function (err) {
          if (err) {
            log.e("Error saving download task: " + err);
          }
          that.emit("inprogress", downloadTask);
          downloadTask.on("progress", function (progress) {
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
Submission.prototype.saveToList = function (cb) {
  submissions.saveSubmission(this, cb);
};
Submission.prototype.error = function (errorMsg, cb) {
  this.set('errorMessage', errorMsg);
  var targetStatus = 'error';
  this.changeStatus(targetStatus, cb);
  this.emit('error', errorMsg);
};
Submission.prototype.getStatus = function () {
  return this.get('status');
};
/**
 * check if a target status is valid
 * @param  {[type]}  targetStatus [description]
 * @return {Boolean}              [description]
 */
Submission.prototype.isStatusValid = function (targetStatus) {
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
Submission.prototype.addComment = function (msg, user) {
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
Submission.prototype.getComments = function () {
  return this.get('comments', []);
};
Submission.prototype.removeComment = function (timeStamp) {
  var comments = this.getComments();

  comments = _.reject(comments, function (comment) {
    return _.isEqual(comment.timeStamp, timeStamp);
  });

  this.set('comments', comments);
};

Submission.prototype.populateFilesInSubmission = function () {
  var self = this;
  var tmpFileNames = _.map(self.getSubmissionFiles(), function (submissionFile) {
    return submissionFile.fileName || submissionFile.hashName;
  });

  tmpFileNames = _.compact(tmpFileNames);

  self.set("filesInSubmission", tmpFileNames);
};

Submission.prototype.getSubmissionFiles = function () {
  var self = this;
  log.d("In getSubmissionFiles: " + self.getLocalId());
  var submissionFiles = [];

  var formFields = _.map(self.getFormFields(), function (formField) {
    return _.filter(formField.fieldValues || [], function (fieldValue) {
      return fieldValue.fileName || fieldValue.hashName;
    });
  });
  submissionFiles = _.flatten(formFields);

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

Submission.prototype.addInputValue = function (params, cb) {
  log.d("Adding input value: ", JSON.stringify(params || {}));
  var that = this;
  var fieldId = params.fieldId;
  var inputValue = params.value;

  if (inputValue !== null && typeof(inputValue) !== 'undefined') {
    var index = params.index === undefined ? -1 : params.index;
    this.getForm(function (err, form) {
      var fieldModel = form.getFieldModelById(fieldId);
      if (that.transactionMode) {
        if (!that.tmpFields[fieldId]) {
          that.tmpFields[fieldId] = [];
        }

        params.isStore = false; //Don't store the files until the transaction is complete
        fieldModel.processInput(params, function (err, result) {
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


        fieldModel.processInput(params, function (err, result) {
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
Submission.prototype.pushFile = function (hashName) {
  var subFiles = this.get('filesInSubmission', []);
  if (typeof(hashName) === "string") {
    if (subFiles.indexOf(hashName) === -1) {
      subFiles.push(hashName);
      this.set('filesInSubmission', subFiles);
    }
  }
};
Submission.prototype.removeFileValue = function (hashName) {
  var subFiles = this.get('filesInSubmission', []);
  if (typeof(hashName) === "string" && subFiles.indexOf(hashName) > -1) {
    subFiles.splice(subFiles.indexOf(hashName), 1);
    this.set('filesInSubmission', subFiles);
  }
};
Submission.prototype.getInputValueByFieldId = function (fieldId, cb) {
  var self = this;
  var values = this.getInputValueObjectById(fieldId).fieldValues;
  this.getForm(function (err, form) {
    var fieldModel = form.getFieldModelById(fieldId);
    fieldModel.convertSubmission(values, cb);
  });
};
/**
 * Reset submission
 * @return {[type]} [description]
 */
Submission.prototype.reset = function () {
  var self = this;
  self.clearLocalSubmissionFiles(function (err) {
    self.set('formFields', []);
  });
};
Submission.prototype.isDownloadSubmission = function () {
  return this.get("downloadSubmission") === true;
};

Submission.prototype.getSubmissionFile = function (fileName, cb) {
  localStorage.readFile(fileName, cb);
};
Submission.prototype.clearLocalSubmissionFiles = function (cb) {
  log.d("In clearLocalSubmissionFiles");
  var self = this;
  var filesInSubmission = self.get("filesInSubmission", []);
  log.d("Files to clear ", filesInSubmission);
  var localFileName = "";

  //Should probably be emitting events..
  async.eachSeries(filesInSubmission, function (fileMetaObject, cb) {
    localStorage.removeEntry(fileMetaObject, function (err) {
      if (err) {
        log.e("Error removing files from " + err);
      }

      cb(err);
    });
  }, cb);
};
Submission.prototype.startInputTransaction = function () {
  this.transactionMode = true;
  this.tmpFields = {};
};
Submission.prototype.endInputTransaction = function (succeed) {
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

    var fileIds = _.map(tmpFields, function (valArr, fieldId) {
      var fileObjects = _.filter(valArr, function (val) {
        return typeof(val.hashName) === "string";
      });

      return _.map(fileObjects, function (fileObject) {
        return fileObject.hashName;
      });
    });

    //Flatten and remove junk
    fileIds = _.flatten(fileIds);
    fileIds = _.compact(fileIds);

    async.eachSeries(fileIds, function (fileId, cb) {
      log.d("Removing File From Transaction" + fileId);
      localStorage.removeEntry(fileId, cb);
    }, function (err) {
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
Submission.prototype.removeFieldValue = function (fieldId, index) {
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
    localStorage.removeEntry(valRemoved.hashName, function (err) {
      if (err) {
        log.e("Error removing file: ", err);
      } else {
        self.removeFileValue(valRemoved.hashName);
      }
    });
  }
};
Submission.prototype.getInputValueObjectById = function (fieldId) {
  var formFields = this.getFormFields();
  var newField = {
    'fieldId': fieldId,
    'fieldValues': []
  };

  var foundField = _.find(formFields, function(formField){
    if(_.isObject(formField.fieldId)){
      return _.isEqual(formField.fieldId._id, fieldId);
    } else {
      return _.isEqual(formField.fieldId, fieldId);
    }
  });

  if(!foundField){
    foundField = newField;
    formFields.push(foundField);
  }

  return foundField;
};
/**
 * get form model related to this submission.
 * @return {[type]} [description]
 */
Submission.prototype.getForm = function (cb) {
  var formId = this.get('formId');
  var Form = require("./form");

  if (formId) {
    log.d("FormId found for getForm: " + formId);
    Form.fromLocal({
      'formId': formId
    }, cb);
  } else {
    log.e("No form Id specified for getForm");
    return cb("No form Id specified for getForm");
  }
};
Submission.prototype.reloadForm = function (cb) {
  log.d("Submission reload form");
  var formId = this.get('formId');
  var self = this;
  new require("./form").fromLocal({
    formId: formId
  }, function (err, form) {
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
Submission.prototype.getFileInputValues = function (cb) {
  var self = this;
  self.getFileFieldsId(function (err, fileFieldIds) {
    if (err) {
      return cb(err);
    }
    return cb(null, self.getInputValueArray(fileFieldIds));
  });
};

Submission.prototype.getFormFields = function () {
  var formFields = this.get("formFields", []);


  //Removing null values
  for (var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++) {
    formFields[formFieldIndex].fieldValues = formFields[formFieldIndex].fieldValues || [];
    formFields[formFieldIndex].fieldValues = formFields[formFieldIndex].fieldValues.filter(function (fieldValue) {
      return fieldValue !== null && typeof(fieldValue) !== "undefined";
    });
  }

  return formFields;
};

Submission.prototype.getFileFieldsId = function (cb) {
  var self = this;
  var formFieldIds = [];

  if (self.isDownloadSubmission()) {
    //For Submission downloads, there needs to be a scan through the formFields param
    var formFields = self.getFormFields();

    formFields = _.filter(formFields, function (formFieldEntry) {
      return (formFieldEntry.fieldId.type === 'file' || formFieldEntry.fieldId.type === 'photo' || formFieldEntry.fieldId.type === 'signature');
    });

    formFieldIds = _.map(formFields, function(formFieldEntry){
      return formFieldEntry.fieldId._id;
    });

    return cb(null, formFieldIds);
  } else {
    self.getForm(function (err, form) {
      if (err) {
        log.e("Error getting form for getFileFieldsId" + err);
        return cb(err);
      }
      return cb(err, form.getFileFieldsId());
    });
  }
};

Submission.prototype.updateFileLocalURI = function (fileDetails, newLocalFileURI, cb) {
  log.d("updateFileLocalURI: " + newLocalFileURI);
  var self = this;
  fileDetails = fileDetails || {};

  if (fileDetails.fileName && newLocalFileURI) {
    //Search for the file placeholder name.
    self.findFilePlaceholderFieldId(fileDetails.fileName, function (err, fieldDetails) {
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

Submission.prototype.findFilePlaceholderFieldId = function (filePlaceholderName, cb) {
  var self = this;
  var fieldDetails = {};
  self.getFileFieldsId(function (err, fieldIds) {
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

Submission.prototype.getInputValueArray = function (fieldIds) {
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
Submission.prototype.clearLocal = function (cb) {
  var self = this;
  //remove from uploading list
  uploadManager.cancelSubmission(self, function (err, uploadTask) {
    if (err) {
      log.e(err);
      return cb(err);
    }
    //remove from submission list
    submissions.removeSubmission(self.getLocalId(), function (err) {
      if (err) {
        log.e(err);
        return cb(err);
      }
      self.clearLocalSubmissionFiles(function () {
        Model.prototype.clearLocal.call(self, function (err) {
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
Submission.prototype.getRemoteSubmissionId = function () {
  return this.get("submissionId", "");
};
Submission.prototype.setRemoteSubmissionId = function (submissionId) {
  if (submissionId) {
    this.set("submissionId", submissionId);
  }
};

function newInstance(form, params) {
  params = params ? params : {};
  var sub = new Submission(form, params);

  submissions.updateSubmissionWithoutSaving(sub);
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
    submissionObject.loadLocal(function (err, submission) {
      if (err) {
        log.e("Submission fromLocal. Error loading from local: ", localId, err);
        cb(err);
      } else {
        log.d("Submission fromLocal. Load from local sucessfull: ", localId);
        if (submission.isDownloadSubmission()) {
          return cb(null, submission);
        } else {
          submission.reloadForm(function (err, res) {
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
},{"./config.js":11,"./form":24,"./form.js":24,"./localStorage.js":31,"./log.js":32,"./model.js":33,"./rulesEngine.js":36,"./submissions.js":40,"./uploadManager.js":42,"./utils.js":44,"async":4,"underscore":9}],40:[function(require,module,exports){
var Model = require("./model");
var log = require("./log");
var submission = require("./submission");
var utils = require("./utils");
var config = require("./config").getConfig();
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
  self.updateSubmissionWithoutSaving(submission);
  self.saveLocal(cb);
};
Submissions.prototype.updateSubmissionWithoutSaving = function(submission) {
  log.d("Submissions updateSubmissionWithoutSaving");
  var pruneData = this.pruneSubmission(submission);
  var localId = pruneData._ludid;
  if (localId) {
    var currentMeta = this.findMetaByLocalId(localId);
    var submissions = this.getSubmissions();

    if (currentMeta) {
      _.extend(currentMeta, pruneData);
    } else {
      submissions.push(pruneData);
    }

    this.updateSubmissionCache(submissions);
  } else {
    // invalid local id.
    log.e('Invalid submission for localId:', localId, JSON.stringify(submission));
  }
};
Submissions.prototype.clearSentSubmission = function(cb) {
  log.d("Submissions clearSentSubmission");
  var self = this;
  var maxSent = config.get("max_sent_saved") ? config.get("max_sent_saved") : config.get("sent_save_min");
  var sentSubmissions = this.getSubmitted();
  var toBeRemoved;

  //Submissions are sorted by the date they were submitted
  sentSubmissions = _.sortBy(sentSubmissions, function(submission) {
    return Date(submission.submittedDate);
  });

  sentSubmissions = _.map(sentSubmissions, function(submission) {
    return submission._ludid;
  });

  //toBeRemoved Submissions = all but the last maxSent submissions
  toBeRemoved = _.difference(sentSubmissions, _.last(sentSubmissions, maxSent));

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

    return _.isFunction(cb) ? cb(err) : null;
  });
};
Submissions.prototype.findByFormId = function(formId) {
  log.d("Submissions findByFormId", formId);
  var submissions = this.getSubmissions();

  return _.filter(submissions, function(submission) {
    return _.isEqual(submission.formId, formId);
  });
};
Submissions.prototype.getSubmissions = function() {
  return _.compact(this.get('submissions', []));
};
Submissions.prototype.getSubmissionMetaList = Submissions.prototype.getSubmissions;
//function alias
Submissions.prototype.findMetaByLocalId = function(localId) {
  log.d("Submissions findMetaByLocalId", localId);
  var submissions = this.getSubmissions();

  return _.findWhere(submissions, {
    _ludid: localId
  });
};

/**
 * Finding a submission object by it's remote Id
 * @param remoteId
 * @returns {*}
 */
Submissions.prototype.findMetaByRemoteId = function(remoteId) {
  if (!remoteId) {
    return undefined;
  }

  log.d("Submissions findMetaByRemoteId: " + remoteId);
  var submissions = this.getSubmissions();

  return _.findWhere(submissions, {
    submissionId: remoteId
  });
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
  return _.pick(data, fields);
};

Submissions.prototype.clear = function(cb) {
  log.d("Submissions clear");
  var that = this;

  async.series([

    function(cb) {
      that.removeAllSubmissions(cb);
    },
    function clearSubmissionMeta(cb) {
      that.clearLocal(function(err) {
        if (err) {
          log.e(err);
          cb(err);
        } else {
          that.resetSubmissionCache();
          that.set("submissions", []);
          cb();
        }
      });
    }
  ], cb);
};

//Removing All Submissions From Local Storage. WARNING: This will remove all files associated with any submission.
Submissions.prototype.removeAllSubmissions = function(cb) {
  log.l("Submissions: Removing All Submissions");
  var self = this;
  var submissions = self.getSubmissions();

  log.d("Submissions: To Be Removed: ", submissions);

  async.eachSeries(submissions, function(submissionMeta, cb) {
    log.d("Submissions: ", submissionMeta);

    self.getSubmissionByMeta(submissionMeta, function(err, submission) {
      if (err) {
        log.e("Submission: Error Getting Submission Meta");
      }
      submission.clearLocal(cb);
    });
  }, function(err) {
    if (err) {
      log.e("Submissions: Error Removing All Submissions ", err);
    }

    cb(err);
  });
};

Submissions.prototype.resetSubmissionCache = function() {
  this.set('submissions', []);
};
Submissions.prototype.updateSubmissionCache = function(updatedSubmissions) {
  this.set('submissions', updatedSubmissions || []);
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

  var submissions = this.getSubmissions();
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
  if (!localId) {
    return cb("Local ID Needed To Remove A Submission");
  }

  var filteredSubmissions = _.filter(this.getSubmissions(), function(submission) {
    return submission._ludid !== localId;
  });

  this.updateSubmissionCache();
  this.saveLocal(cb);
};
Submissions.prototype.indexOf = function(localId) {
  log.d("Submissions indexOf: ", localId);
  var submissions = this.getSubmissions();

  return _.findIndex(submissions, function(submission) {
    return _.isEqual(submissions[i]._ludid, localId);
  });
};
var submissionsModel;

function getSubmissionsModel() {
  if (!submissionsModel) {
    submissionsModel = new Submissions();
  }

  return submissionsModel;
}

module.exports = getSubmissionsModel();
},{"./config":11,"./log":32,"./model":33,"./submission":39,"./utils":44,"async":4,"underscore":9}],41:[function(require,module,exports){
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
},{"./model":33,"./utils":44}],42:[function(require,module,exports){
/**
 * Manages submission uploading tasks
 */
var Model = require("./model");
var utils = require("./utils");
var log = require("./log");
var dataAgent = require("./dataAgent");
var uploadTask = require("./uploadTask");
var config = require('./config').getConfig();

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
        if (config.isOnline()) {
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
        if (timePassed > config.get("timeout") * 1000) {
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
                            if (config.isOnline()) {
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
},{"./config":11,"./dataAgent":12,"./log":32,"./model":33,"./uploadTask":43,"./utils":44}],43:[function(require,module,exports){
/**
 * Uploading task for each submission
 */

var Model = require("./model.js");
var log = require("./log.js");
var config = require("./config.js").getConfig();
var dataAgent = require("./dataAgent.js");
var FormSubmission = require("./formSubmission.js");
var FormSubmissionDownload = require("./formSubmissionDownload.js");
var FormSubmissionStatus = require("./formSubmissionStatus.js");
var Base64FileSubmission = require("./fileSubmissionBase64.js");
var FileSubmission = require("./fileSubmission.js");
var FileSubmissionDownload = require("./fileSubmissionDownload.js");
var FormSubmissionComplete = require("./formSubmissionComplete.js");
var submission = require("./submission.js");
var utils = require("./utils.js");
var _ = require('underscore');

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

  _.bindAll(this, 'addFileTask');

  Model.call(this, {
    '_type': 'uploadTask'
  });
}

utils.extend(UploadTask, Model);

UploadTask.prototype.init = function (submissionModel) {
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
UploadTask.prototype.getTotalSize = function () {
  var self = this;
  var jsonSize = JSON.stringify(self.get('jsonTask')).length;
  var fileTasks = self.get('fileTasks');

  return  _.reduce(fileTasks, function(memo, fileTask){
    return memo + fileTask.fileSize;
  }, jsonSize);
};
UploadTask.prototype.getUploadedSize = function () {
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
UploadTask.prototype.getRemoteStore = function () {
  return dataAgent.remoteStore;
};
UploadTask.prototype.addFileTasks = function (submissionModel, cb) {
  var self = this;
  submissionModel.getFileInputValues(function (err, files) {
    if (err) {
      log.e("Error getting file Input values: " + err);
      return cb(err);
    }

    _.each(files, self.addFileTask);
    cb();
  });
};
UploadTask.prototype.addFileTask = function (fileDef) {
  this.get('fileTasks').push(fileDef);
};
/**
 * get current uploading task
 * @return {[type]} [description]
 */
UploadTask.prototype.getCurrentTask = function () {
  return this.get('currentTask', null);
};
UploadTask.prototype.getRetryAttempts = function () {
  return this.get('retryAttempts');
};
UploadTask.prototype.increRetryAttempts = function () {
  this.set('retryAttempts', this.get('retryAttempts') + 1);
};
UploadTask.prototype.resetRetryAttempts = function () {
  this.set('retryAttempts', 0);
};
UploadTask.prototype.isStarted = function () {
  return this.getCurrentTask() !== null;
};


UploadTask.prototype.setSubmissionQueued = function (cb) {
  var self = this;
  self.submissionModel(function (err, submission) {
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
UploadTask.prototype.uploadForm = function (cb) {
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

      self.setSubmissionQueued(function (err) {
        self.increProgress();
        self.saveLocal(function (err) {
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
    self.submissionModel(function (err, submissionModel) {
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
      submissionModel.saveLocal(function (err) {
        log.d("Saved SubmissionModel", err, submissionModel);
        if (err) {
          log.e("Error saving updated submission from download submission: " + err);
        }

        //Submission Model is now populated with all the fields in the submission
        self.addFileTasks(submissionModel, function (err) {
          log.d("addFileTasks called", err, submissionModel);
          if (err) {
            return cb(err);
          }
          self.increProgress();
          self.saveLocal(function (err) {
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
    self.submissionModel(function (err, submissionModel) {
      if (err) {
        return cb(err);
      }
      self.addFileTasks(submissionModel, function (err) {
        if (err) {
          log.e("Error adding file tasks for submission upload");
          return cb(err);
        }

        var formSubmissionModel = new FormSubmission(formSub);
        self.getRemoteStore().create(formSubmissionModel, function (err, res) {
          if (err) {
            return cb(err);
          } else {
            var updatedFormDefinition = res.updatedFormDefinition;
            if (updatedFormDefinition) {
              // remote form definition is updated
              self.refreshForm(updatedFormDefinition, function (err) {
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
UploadTask.prototype.handleCompletionError = function (err, res, cb) {
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
UploadTask.prototype.handleIncompleteSubmission = function (cb) {
  var self = this;

  function processUploadIncompleteSubmission() {

    var remoteStore = self.getRemoteStore();
    var submissionStatus = new FormSubmissionStatus(self);

    remoteStore.submissionStatus(submissionStatus, function (err, res) {
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
          self.resetUploadTask(pendingFiles, function () {
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
UploadTask.prototype.resetUploadTask = function (pendingFiles, cb) {
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
UploadTask.prototype.uploadFile = function (cb) {
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
    fileSubmissionModel.loadFile(function (err) {
      if (err) {
        log.e("Error loading file for upload: " + err);
        return cb(err);
      }

      self.getRemoteStore().create(fileSubmissionModel, function (err, res) {
        if (err) {
          var errorMessage = 'File upload failed for file: ' + fileTask.fileName;

          log.e('File upload failed for file: ' + fileTask.fileName, err);
          return cb(errorMessage);
        }

        fileTask.updateDate = utils.getTime();
        self.increProgress();
        self.saveLocal(function (err) {
          //save current status.
          if (err) {
            log.e("Error saving upload task" + err);
          }

          self.emit('progress', self.getProgress());
          return cb();
        });
      });
    });
  }

  function processDownloadFile() {
    log.d("processDownloadFile called");
    fileSubmissionModel = new FileSubmissionDownload(fileTask);
    fileSubmissionModel.setSubmissionId(submissionId);
    self.getRemoteStore().read(fileSubmissionModel, function (err, localFilePath) {
      if (err) {
        log.e("Error downloading a file from remote: " + err);
        return cb(err);
      }

      log.d("processDownloadFile called. Local File Path: " + localFilePath);

      //Update the submission model to add local file uri to a file submission object
      self.submissionModel(function (err, submissionModel) {
        if (err) {
          log.e("Error Loading submission model for processDownloadFile " + err);
          return cb(err);
        }

        submissionModel.updateFileLocalURI(fileTask, localFilePath, function (err) {
          if (err) {
            log.e("Error updating file local url for fileTask " + JSON.stringify(fileTask));
            return cb(err);
          }

          self.increProgress();
          self.saveLocal(function (err) {
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
UploadTask.prototype.isDownloadTask = function () {
  return this.get("submissionTransferType") === "download";
};
//The upload task needs to be retried
UploadTask.prototype.setRetryNeeded = function (retryNeeded) {
  //If there is a submissionId, then a retry is needed. If not, then the current task should be set to null to retry the submission.
  if (this.get('submissionId', null) !== null) {
    this.set('retryNeeded', retryNeeded);
  } else {
    this.set('retryNeeded', false);
    this.set('currentTask', null);
  }
};
UploadTask.prototype.retryNeeded = function () {
  return this.get('retryNeeded');
};
UploadTask.prototype.uploadTick = function (cb) {
  var self = this;

  function _handler(err) {
    if (err) {
      log.d('Err, retrying transfer: ' + self.getLocalId());
      //If the upload has encountered an error -- flag the submission as needing a retry on the next tick -- User should be insulated from an error until the retries are finished.
      self.increRetryAttempts();
      if (self.getRetryAttempts() <= config.get('max_retries')) {
        self.setRetryNeeded(true);
        self.saveLocal(function (err) {
          if (err) {
            log.e("Error saving upload taskL " + err);
          }

          cb();
        });
      } else {
        //The number of retry attempts exceeds the maximum number of retry attempts allowed, flag the upload as an error.
        self.setRetryNeeded(true);
        self.resetRetryAttempts();
        self.error(err, function () {
          cb(err);
        });
      }
    } else {
      //no error.
      self.setRetryNeeded(false);
      self.saveLocal(function (_err) {
        if (_err) {
          log.e("Error saving upload task to local memory" + _err);
        }
      });
      self.submissionModel(function (err, submission) {
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
UploadTask.prototype.increProgress = function () {
  var curTask = this.getCurrentTask();
  if (curTask === null) {
    curTask = 0;
  } else {
    curTask++;
  }
  this.set('currentTask', curTask);
};
UploadTask.prototype.uploadComplete = function (cb) {
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
    remoteStore.create(completeSubmission, function (err, res) {
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
UploadTask.prototype.success = function (cb) {
  log.d("Transfer Sucessful. Success Called.");
  var self = this;
  var submissionId = self.get('submissionId', null);
  self.set('completed', true);


  function processUploadSuccess(cb) {
    log.d("processUploadSuccess Called");
    self.submissionModel(function (_err, model) {
      if (_err) {
        return cb(_err);
      }
      model.set('submissionId', submissionId);
      model.submitted(cb);
    });
  }

  function processDownloadSuccess(cb) {
    log.d("processDownloadSuccess Called");
    self.submissionModel(function (_err, model) {
      if (_err) {
        return cb(_err);
      } else {
        model.populateFilesInSubmission();
        model.downloaded(cb);
      }
    });
  }

  self.saveLocal(function (err) {
    if (err) {
      log.e("Error Clearing Upload Task");
    }

    if (self.isDownloadTask()) {
      processDownloadSuccess(function (err) {
        self.clearLocal(cb);
      });
    } else {
      processUploadSuccess(function (err) {
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
UploadTask.prototype.error = function (uploadErrorMessage, cb) {
  var self = this;
  log.e("Error uploading submission: ", uploadErrorMessage);
  self.set('error', uploadErrorMessage);
  self.saveLocal(function (err) {
    if (err) {
      log.e('Upload task save failed: ' + err);
    }

    self.submissionModel(function (_err, model) {
      if (_err) {
        cb(_err);
      } else {
        model.setUploadTaskId(null);
        model.error(uploadErrorMessage, function (err) {
          if (err) {
            log.e("Error updating submission model to error status ", err);
          }
          self.clearLocal(function (err) {
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
UploadTask.prototype.isFormCompleted = function () {
  var curTask = this.getCurrentTask();
  return curTask !== null;
};
UploadTask.prototype.isFileCompleted = function () {
  var curTask = this.getCurrentTask();
  if (curTask === null) {
    return false;
  } else if (curTask < this.get('fileTasks', []).length) {
    return false;
  } else {
    return true;
  }
};
UploadTask.prototype.isError = function () {
  var error = this.get('error', null);
  if (error) {
    return true;
  } else {
    return false;
  }
};
UploadTask.prototype.isCompleted = function () {
  return this.get('completed', false);
};
UploadTask.prototype.isMBaaSCompleted = function () {
  var self = this;
  if (!self.isFileCompleted()) {
    return false;
  } else {
    var curTask = self.getCurrentTask();
    if (curTask > self.get('fileTasks', []).length) {
      //change offset if completion bit is changed
      self.set("mbaasCompleted", true);
      self.saveLocal(function (err) {
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
UploadTask.prototype.getProgress = function () {
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
UploadTask.prototype.refreshForm = function (updatedFormJSON, cb) {
  var formId = this.get('formId');
  log.l("Refreshing Form Definition " + JSON.stringify(updatedFormJSON));
  require("./form.js").fromLocal({
    'formId': formId
  }, function (err, form) {
    if (err) {
      log.e(err);
    }

    form.fromJSON(updatedFormJSON);
    form.saveLocal(function (err) {
      if (err) {
        log.e("Error Saving Form To Local Storage " + err);
      } else {
        log.l("Form Updated");
      }
      cb(err);
    });
  });
};
UploadTask.prototype.submissionModel = function (cb) {
  require("./submission").fromLocal(this.get('submissionLocalId'), function (err, submission) {
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
},{"./config.js":11,"./dataAgent.js":12,"./fileSubmission.js":20,"./fileSubmissionBase64.js":21,"./fileSubmissionDownload.js":22,"./form.js":24,"./formSubmission.js":25,"./formSubmissionComplete.js":26,"./formSubmissionDownload.js":27,"./formSubmissionStatus.js":28,"./log.js":32,"./model.js":33,"./submission":39,"./submission.js":39,"./utils.js":44,"underscore":9}],44:[function(require,module,exports){
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

},{"md5-node":7,"underscore":9}],45:[function(require,module,exports){
var log = require("./log");
var utils = require("./utils");
var _ajax = require("../libs/ajax");
var fileSystem = require("./fileSystem");
var _ = require('underscore');
var config;

_.defer(function(){
  config = require("./config").getConfig();
});


function get(url, cb) {
  log.d("Ajax get ", url);
  _ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    timeout: config.get("timeout"),
    success: function (data, text) {
      log.d("Ajax get", url, "Success");
      cb(null, data);
    },
    error: function (xhr, status, err) {
      log.e("Ajax get", url, "Fail", xhr, status, err);
      cb(err || xhr);
    }
  });
}

function post(url, body, cb) {
  log.d("Ajax post ", url, body);
  var file = false;
  var formData;
  if (_.isObject(body)) {
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

  //Setting Ajax Settings For File Upload
  var contentType = _.isString(body);
  var processData = _.isString(body);

  var param = {
    url: url,
    type: 'POST',
    data: body,
    dataType: 'json',
    contentType: contentType,
    processData: processData,
    timeout: config.get("timeout"),
    success: function (data, xhr) {
      log.d("Ajax post ", url, " Success");
      cb(null, data);
    },
    error: function (xhr, status, err) {
      log.e("Ajax post ", url, " Fail ", xhr, status, err);
      cb(xhr);
    }
  };
  if (file === false) {
    param.contentType = 'application/json';
  }
  _ajax(param);
}

function uploadFile(url, fileProps, cb) {
  log.d("Phonegap uploadFile ", url, fileProps);
  var filePath = fileProps.fullPath;

  if (!config.isOnline()) {
    log.e("Phonegap uploadFile. Not Online.", url, fileProps);
    return cb("No Internet Connection Available.");
  }

  var success = function (r) {
    log.d("upload to url ", url, " sucessful");
    r.response = r.response || {};
    if (typeof r.response === "string") {
      r.response = JSON.parse(r.response);
    }
    cb(null, r.response);
  };

  var fail = function (error) {
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

  if (!config.isOnline()) {
    log.e("Phonegap downloadFile. Not Online.", url, fileMetaData);
    return cb("No Internet Connection Available.");
  }

  fileSystem.getBasePath(function (err, basePath) {
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

},{"../libs/ajax":1,"./config":11,"./fileSystem":23,"./log":32,"./utils":44,"underscore":9}]},{},[10]);
