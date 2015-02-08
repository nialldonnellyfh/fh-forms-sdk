var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var Page = require('../../src/page.js');

var testPage = {
    "_id": "52dfd909a926eb2e3f000001",
    "name": "A Page",
    "description": "This Is A Page",
    "fields": [{
        "fieldOptions": {
            "definition": {
                "defaultValue": "first thing"
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
};


describe("Page Module", function() {
    it("Creating A New Page Model", function() {
        var page = new Page(testPage, {});

        assert.equal(page.getName(), "A Page");
        assert.equal(page.getDescription(), "This Is A Page");
        assert.equal(page.getPageId(), "52dfd909a926eb2e3f000001");
        assert.ok(page.getFieldIds().indexOf("52dfd93ee02b762d3f000001") === 0, "Expected pages to be in order.");
        assert.ok(page.getFieldIds().indexOf("52dfd93ee02b762d3f000002") === 1, "Expected pages to be in order.");
    });
});