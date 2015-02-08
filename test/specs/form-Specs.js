var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var Form = require('../../src/form.js');

var testForm = {
    "_id": "52dfd909a926eb2e3f123456",
    "description": "Small Form",
    "name": "Small Form",
    "updatedBy": "testingform@example.com",
    "lastUpdatedTimestamp": 1390409513725,
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
        }, {
            "required": false,
            "type": "file",
            "name": "File",
            "helpText": "File",
            "_id": "52dfd93ee02b762d3f000002",
            "repeating": false
        }]
    }, {
        "name": "Page 2",
        "_id": "52dff729e02b762d3f000004",
        "fields": [{
            "required": false,
            "type": "text",
            "name": "Page 2 Text",
            "helpText": "Page 2 Text",
            "_id": "52dff729e02b762d3f000003",
            "repeating": false
        }]
    }],
    "lastUpdated": "2014-01-22T16:51:53.725Z",
    "dateCreated": "2014-01-22T14:43:21.806Z"
};

describe("Form model", function() {
    it("how to initialise a form with a JSON object representing a form", function(done) {
        //load from local then from remote.
        new Form({
            rawMode: true,
            rawData: testForm,
            formId: "52dfd909a926eb2e3f123456"
        }, function(err, form) {
            assert(!err, "Expected no error when creating a form from JSON. " + err);
            assert(form, "Expected a form object");
            assert(form.getType() === "form");
            assert.equal(Date(form.getLastUpdate()), Date(1390409513725));

            var fieldRef = form.getFieldRef();
            var pageRef = form.getPageRef();

            assert.equal(pageRef["52dfd909a926eb2e3f000001"], 0);
            assert.equal(pageRef["52dff729e02b762d3f000004"], 1);

            assert.equal(fieldRef["52dfd93ee02b762d3f000002"].page, 0);
            assert.equal(fieldRef["52dfd93ee02b762d3f000002"].field, 1);

            assert.equal(fieldRef["52dff729e02b762d3f000003"].page, 1);
            assert.equal(fieldRef["52dff729e02b762d3f000003"].field, 0);

            done();
        });
    });
    it("Form Should Provide Fields And Page Models", function(done) {
        //load from local then from remote.
        new Form({
            rawMode: true,
            rawData: testForm,
            formId: "52dfd909a926eb2e3f123456"
        }, function(err, form) {
            assert(!err, "Expected no error when creating a form from JSON." + err);

            var pages = form.getPageModelList();

            assert.equal(pages.length, 2);

            //Should be able to load Field Models from the Page Models
            var page = pages[0];
            var fields = page.getFieldModelList();

            assert.equal(fields.length, 2);

            assert.equal(page.getFieldModelById("52dfd93ee02b762d3f000002"), fields[1]);

            done();
        });
    });
    it("form initialisation is singleton for a single formid. only 1 instance of form model will be returned for same form id", function(done) {
        new Form({
            rawMode: true,
            rawData: testForm,
            formId: "52dfd909a926eb2e3f123456"
        }, function(err, form1) {
            new Form({
                rawMode: true,
                rawData: testForm,
                formId: "52dfd909a926eb2e3f123456"
            }, function(err, form2) {
                assert(!err);
                assert(form1 === form2);
                done();
            });
        });
    });
    it("if form id is not found when trying to pop data, it will return error ", function(done) {
        var form = new Form({
            formId: "somerandomformid"
        }, function(err, form) {
            assert(err, "Expected an error when getting a bad form.");
            assert(form, "Expected a form when getting a bad form.");

            done();
        });
    });

    it("Loading A Form From A Remote Server", function(done) {
        var form = new Form({
            formId: "54d4cd220a9b02c67e9c3f0c"
        }, function(err, form) {
            assert(!err, "Expected no error when getting a bad form. " + err);
            assert(form);

            done();
        });
    });
});