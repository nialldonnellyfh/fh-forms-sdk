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

  if(params.id){
    self.setRemoteId(params.id);
    self.setLocalId(params.id);
  }

  var rawMode = params.rawMode || false;
  var rawData = params.rawData || undefined;
  self.setType('form');
  log.d("Form: ", rawMode, rawData);

  function processRawFormJSON() {
    self.fromJSON(rawData);
    self.getLocalId();
    self.initialise();

    _forms[self.getFormId()] = _forms[self.getFormId()] || self;
    return _forms[self.getFormId()];
  }

  //Raw mode is for avoiding interaction with the mbaas
  if (rawMode === true && _.isObject(rawData)) {
    return processRawFormJSON();
  }
  return self;
}

utils.extend(Form, Model);

Form.prototype.loadFromRemote = function(cb) {
  log.d("Form: loadFromRemote", rawMode, rawData, formId, fromRemote);
  var self = this;
  if (_forms[formId]) {
    log.d("Form: loaded from cache", rawMode, rawData, formId, fromRemote);
    //found form object in mem return it.
    cb(null, _forms[formId]);
    return _forms[formId];
  }

  self.refresh(true, function(err, obj1) {
    self.initialise();

    _forms[formId] = obj1;
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
    var fields = _.each(page.fields, function(field, fieldIndex) {
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
  this.fields = {};
  for (var fieldId in fieldsRef) {
    var fieldRef = fieldsRef[fieldId];
    var pageIndex = fieldRef.page;
    var fieldIndex = fieldRef.field;
    if (pageIndex === undefined || fieldIndex === undefined) {
      throw 'Corruptted field reference';
    }
    var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
    if (fieldDef) {
      this.fields[fieldId] = new Field(fieldDef, this);
    } else {
      throw 'Field def is not found.';
    }
  }
};
Form.prototype.initialisePage = function() {
  log.d("Form: initialisePage");
  var pages = this.getPagesDef();
  this.pages = [];
  for (var i = 0; i < pages.length; i++) {
    var pageDef = pages[i];
    var pageModel = new Page(pageDef, this);
    this.pages.push(pageModel);
  }
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

  for (var fieldId in self.fields) {
    var field = self.fields[fieldId];
    if (field.getCode() !== null && field.getCode() === code) {
      return field;
    }
  }

  return null;
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
  var fieldsId = [];
  for (var fieldId in this.fields) {
    var field = this.fields[fieldId];
    if (field.getType() === 'file' || field.getType() === 'photo' || field.getType() === 'signature') {
      fieldsId.push(fieldId);
    }
  }
  return fieldsId;
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