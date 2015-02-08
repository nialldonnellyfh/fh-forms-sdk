/*jshint expr: true*/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var config = require('../../src/config.js');

describe("Config module", function() {

    beforeEach(function(){
        this.config = config;
    });

    it("config should be init before usage. config should get data from mbaas.", function(done) {
        this.config.init({}, function(err, returnedConfig) {
            assert(!err, "Unexpected Error When Returning Config Data.");
            assert.equal(config.get("log_email"), "test@feedhenry.com");
            done();
        });
    });

    it("how to get config properties", function() {
        assert(this.config.getAppId(), "Expected appId To Be set");
        assert(this.config.get("mbaasBaseUrl"), "Expected mbaasBaseUrl To Be set");
        assert(this.config.get("formUrls"), "Expected formUrls To Be set");
        assert(this.config.get("env"), "Expected env To Be set");
        assert(this.config.get("userConfigValues"), "Expected userConfigValues To Be set");
        assert.ok(this.config.get("sent_save_min") === 5, "Expected defaultConfigValues To Be set");
    });

    it("Should Only Be One Config Module", function() {
        var sameConfig = require('../../src/config.js');

        assert.ok(sameConfig.get("sent_save_min") === config.get("sent_save_min"));
    });
});
