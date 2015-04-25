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