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