/*jshint expr: true*/
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var Model = require("../../src/model.js");
var utils = require("../../src/utils");

describe("Form Utils", function() {
    it("should extend a function", function() {
        var func1 = function() {};
        func1.prototype.function1 = function() {};

        var func2 = function() {};
        func2.prototype.function2 = function() {};

        utils.extend(func1, func2);

        expect(func1.prototype).to.have.property("function2");
    });

    it("how to generate a local id from a model", function() {
        var model = new Model();
        var localId = utils.localId(model);
        assert(localId.indexOf('model') > -1, "Expected model based local id");
        assert.ok(model.getLocalId().indexOf('model') > -1, "Expected model based local id");
        assert.ok(model.getLocalId() === model.getLocalId(), "Expected local model id to be constant");
    });

    it("how to generate a local id from a custom model", function() {
        var model = new Model({
            "_type": "someNewModel"
        });
        var localId = utils.localId(model);
        assert(localId.indexOf('someNewModel') > -1, "Expected custom model based local id");
        assert.ok(model.getLocalId().indexOf('someNewModel') > -1, "Expected model based local id");
    });

    it("how to generate a local id from a custom model and a Remote Id", function() {
        var model = new Model({
            "_type": "someRNewModel",
            "_id": "someRemoteID"
        });
        var localId = utils.localId(model);
        assert(localId.indexOf('someRNewModel') > -1, "Expected custom model based local id");
        assert.ok(model.getLocalId().indexOf('someRNewModel') > -1, "Expected model based local id");
        assert.ok(model.getLocalId().indexOf('someRemoteID') > -1, "Expected model based local id to contain remote id");
    });
});
