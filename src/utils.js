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
