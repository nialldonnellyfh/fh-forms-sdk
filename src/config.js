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

Config.prototype.getStatusUrl = function(){
    var host = this.get('cloudHost');
    return host + this.get('statusUrl', "/sys/info/ping");
};

//Getting the relevant url endpoint for a model
Config.prototype.getUrlEndpoint = function(model) {
    log.d("_getUrl ", model);

    var type = model.get('_type');
    var host = this.get('cloudHost');
    var mBaaSBaseUrl = this.get('mbaasBaseUrl', "");
    var formUrls = this.get('formUrls');
    var relativeUrl = "";
    if (formUrls[type]) {
        relativeUrl = formUrls[type];
    } else {
        log.e('type not found to get url:' + type);
    }
    var url = host + mBaaSBaseUrl + relativeUrl;
    var props = {};
    props.appId = this.get('appId');
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
    return url;
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


