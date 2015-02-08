var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var Field = require('../../src/field.js');

//TODO, need to do all field typess.

var testField = {
    "fieldOptions": {
        "definition": {
            "defaultValue": "def"
        }
    },
    "required": true,
    "type": "text",
    "name": "Text Field",
    "helpText": "Text",
    "adminOnly": false,
    "_id": "52dfd93ee02b762d3f000001",
    "repeating": false
};


describe("Field Module", function() {
	it("Creating A New Field Model", function() {
		var field = new Field(testField);

		assert.equal(field.isRequired(), true, "Expected the field to not be required.");
		assert.equal(field.getType(), 'text');
		assert.equal(field.getDefaultValue(), 'def');
		assert.equal(field.isAdminField(), false);
		assert.equal(field.getFieldId(), "52dfd93ee02b762d3f000001");
		assert.equal(field.getName(), "Text Field");
	});
});