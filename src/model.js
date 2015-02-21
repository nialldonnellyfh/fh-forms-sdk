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
