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