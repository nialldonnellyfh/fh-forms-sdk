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

  self.refresh(true, function(err, obj1) {
    self.initialise();

    _forms[id] = obj1;
    return cb(err, obj1);
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
    id: formId
  });

  //Check local storage
  form.loadLocal(cb);
}

function newInstance(params) {
  var newForm = new Form(params);

  //Only one form with the same id is permitted to be loaded
  if(_forms[newForm.getRemoteId()]){
    return _forms[newForm.getRemoteId()];
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