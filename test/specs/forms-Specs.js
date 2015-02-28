var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');
var config = require('../../src/config.js');
var sinon = require('sinon');

var testResponse = {
  "forms": [{
    "_id": "54d4cd220a9b02c67e9c3f0c",
    "name": "Test All Form Things",
    "description": "Testing all field types",
    "lastUpdated": "2015-02-06T14:31:07.566Z",
    "lastUpdatedTimestamp": 1423233067566
  }]
};

var testData = {
  formId: "54d4cd220a9b02c67e9c3f0c"
};



describe("forms model", function() {
  beforeEach(function(done) {
    this.server = sinon.fakeServer.create();
    this.server.autoRespond = true;
    this.server.autoRespondAfter = 500;
    config.init({}, function(err, returnedConfig) {
      assert.ok(!err, "Expected No Error");
      forms.clearLocal(function(err, model) {
        assert.ok(!err, "Expected No Error");
        done();
      });
    });
  });

  afterEach(function() {
    this.server.restore();
  });
  it("How to load form list from local storage-> mBaaS / can load forms and refresh the model ", function(done) {
    var timeStamp1 = forms.getLocalUpdateTimeStamp();
    var response = {
      forms: [{
        "_id": "54d4cd220a9b02c67e9c3f0c",
        "name": "Test A Form",
        "description": "Testing all field types",
        "lastUpdated": "2015-02-06T14:31:07.566Z",
        "lastUpdatedTimestamp": 1423233067567
      }]
    };

    this.server.respondWith('GET', 'hostmbaas/forms/appId1234', [200, {
        "Content-Type": "application/json"
      },
      JSON.stringify(response)
    ]);

    forms.refresh(function(err, model) {
      assert(!err);
      var timeStamp2 = model.getLocalUpdateTimeStamp();

      assert.equal(forms.getFormsList().length, 1);
      var formMeta = forms.getFormsList()[0];

      assert.equal(formMeta._id, "54d4cd220a9b02c67e9c3f0c");
      assert.equal(formMeta.name, "Test A Form");

      assert(timeStamp1 != timeStamp2);
      done();
    });
  });
  it("how to forcely load form list from mBaaS and store it locally / can load forms and refresh the model forcely from remote", function(done) {
    var timeStamp1 = forms.getLocalUpdateTimeStamp();

    var response = {
      forms: [{
        "_id": "54d4cd220a9b02c67e9c3f0c",
        "name": "Test A Form",
        "description": "Testing all field types",
        "lastUpdated": "2015-02-06T14:31:07.566Z",
        "lastUpdatedTimestamp": 1423233067567
      }]
    };

    this.server.respondWith('GET', 'hostmbaas/forms/appId1234', [200, {
        "Content-Type": "application/json"
      },
      JSON.stringify(response)
    ]);

    forms.refresh(true, function(err, forms) {
      assert(!err);
      var timeStamp2 = forms.getLocalUpdateTimeStamp();
      assert(timeStamp1 != timeStamp2);

      assert.equal(forms.getFormsList().length, 1);
      var formMeta = forms.getFormsList()[0];

      assert.equal(formMeta._id, "54d4cd220a9b02c67e9c3f0c");
      assert.equal(formMeta.name, "Test A Form");

      done();
    });
  });

  it("how to test if a form model object is up to date / should check if a form is up to date", function(done) {
    var response = {
      forms: [{
        "_id": "54d4cd220a9b02c67e9c3f0c",
        "name": "Test A Form",
        "description": "Testing all field types",
        "lastUpdated": "2015-02-06T14:31:07.566Z",
        "lastUpdatedTimestamp": 1423233067567
      }]
    };

    this.server.respondWith('GET', 'hostmbaas/forms/appId1234', [200, {
        "Content-Type": "application/json"
      },
      JSON.stringify(response)
    ]);

    var testFormOutOfDate = {
      "_id": "54d4cd220a9b02c67e9c3f0c",
      "description": "Test Form Out Of Date",
      "name": "Test Form Out Of Date",
      "updatedBy": "testingform@example.com",
      "lastUpdatedTimestamp": 1423233067565,
      "lastUpdated": "2014-01-22T16:51:53.725Z",
      "dateCreated": "2014-01-22T14:43:21.806Z",
      "pageRules": [

      ],
      "fieldRules": [

      ],
      "pages": [{
        "_id": "52dfd909a926eb2e3f000001",
        "name": "A Page",
        "fields": [{
          "fieldOptions": {
            "definition": {
              "defaultValue": ""
            }
          },
          "required": false,
          "type": "text",
          "name": "Text",
          "helpText": "Text",
          "_id": "52dfd93ee02b762d3f000001",
          "repeating": false
        }]
      }]
    };

    var testFormUpToDate = {
      "_id": "54d4cd220a9b02c67e9c3f0c",
      "description": "Test Form Up To Date",
      "name": "Test Form Up To Date",
      "updatedBy": "testingform@example.com",
      "lastUpdatedTimestamp": 1423233067567,
      "lastUpdated": "2014-01-22T16:51:53.725Z",
      "dateCreated": "2014-01-22T14:43:21.806Z",
      "pageRules": [

      ],
      "fieldRules": [

      ],
      "pages": [{
        "_id": "52dfd909a926eb2e3f000001",
        "name": "A Page",
        "fields": [{
          "fieldOptions": {
            "definition": {
              "defaultValue": ""
            }
          },
          "required": false,
          "type": "text",
          "name": "Text",
          "helpText": "Text",
          "_id": "52dfd93ee02b762d3f000001",
          "repeating": false
        }]
      }]
    };

    this.server.respondWith('GET', 'hostmbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c', [200, {
        "Content-Type": "application/json"
      },
      JSON.stringify(testFormUpToDate)
    ]);

    new Form({
      formId: testData.formId,
      fromRemote: false,
      rawMode: true,
      rawData: testFormOutOfDate
    }, function(err, form) {
      assert(!err);

      assert.equal(form.getName(), "Test Form Out Of Date");
      assert(forms.isFormUpdated(form), "Form Should Be Marked as Up To Date");

      //Now Get The Up To Date Form
      form.refresh(true, function(err, form) {
        assert(!err);
        assert.equal(form.getName(), "Test Form Up To Date");
        assert(!forms.isFormUpdated(form), "Form Should Not Be Marked as Updated");
        done();
      });
    });
  });
});