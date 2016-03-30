var localStorage = require("./localStorage");
var utils = require("./utils");
var log = require("./log");
var mbaasStore = require("fh-mbaas-store");
var storeMbaas = mbaasStore.getMbaasStore();

var _ = require('underscore');
var config;

function getConfig(){
  if(config){
    return config;
  } else {
    config = require('./config').getConfig();
  }
}

//default data agent uses mbaas as remote store, localstorage as local store
var DataAgent = {
  remoteStore: storeMbaas,
  localStore: localStorage
};

function initStoreMbaas() {
  getConfig();
  mbaasStore.init(log, {
    statusUrl: '/sys/info/ping'
  });

  DataAgent.remoteStore = mbaasStore.getMbaasStore();
}


/**
 * Read from local store first,
 if not exists, read from remote store and store locally
 * @param  {[type]}   model [description]
 * @param  {Function} cb    (err,res,isFromRemote)
 * @return {[type]}         [description]
 */
DataAgent.read = function (model, cb) {
  log.d("DataAgent read ", model);
  localStorage.read(model, function (err, locRes) {
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
DataAgent.refreshRead = function (model, cb) {
  log.d("DataAgent refreshRead ", model);
  var that = this;
  initStoreMbaas();
  that.remoteStore.read(model, function (err, res) {
    if (err) {
      log.e("Error reading model from remoteStore ", model, err);
      cb(err);
    } else {
      log.d("Model refresh successfull from remoteStore ", model, res);
      //update model from remote response
      model.fromJSON(res);
      //update local storage for the model
      that.localStore.upsert(model, function () {
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
DataAgent.attemptRead = function (model, cb) {
  log.d("DataAgent attemptRead ", model);
  var self = this;

  getConfig();

  self.checkOnlineStatus(function (online) {
    if (config.isOnline()) {
      self.refreshRead(model, function (err) {
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
DataAgent.checkOnlineStatus = function (cb) {
  log.d("DataAgent check online status ");
  getConfig();
  initStoreMbaas();
  if (utils.isPhoneGap() && navigator.connection.type && navigator.connection.type === Connection.NONE) {
    //No connection availabile, no need to ping.
    config.offline();
    return cb(false);
  }

  this.remoteStore.isOnline({
    url: config.getStatusUrl()
  }, function (online) {
    if (online === false) {
      config.setOffline();
    } else {
      config.setOnline();
    }

    cb(null, online);
  });
};

module.exports = DataAgent;
