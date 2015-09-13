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
    var meta = this.findMetaByLocalId(localId) || pruneData;
    var submissions = this.getSubmissions();

    var currentMeta = _.findWhere(submissions, {
      _ludid: localId
    });

    if (currentMeta) {
      _.extend(currentMeta, meta);
    } else {
      submissions.push(meta);
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
  var submissions = self.getSubmissions();
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