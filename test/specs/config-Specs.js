/*jshint expr: true*/

var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var config = require('../../src/config.js');
var requests = [];

describe("Config module", function() {

  beforeEach(function(done) {
    this.request = sinon.useFakeXMLHttpRequest();
    var requests = this.requests = [];

    this.config = config;
    config.init({}, function(err, returnedConfig) {
      assert(!err, "Expected no error clearing local storage");
      config.clearLocal(function(err) {
        assert(!err, "Expected no error clearing local storage");
        done();
      });
    });
  });

  afterEach(function() {
    this.request.restore();
  });

  // it("config should be initialised before usage. config should get data from local storage.", function(done) {
  //   assert.equal(config.get("log_email"), "test@example.com");
  //   done();
  // });

  // it("config should be able to be saved to local storage ", function(done) {
  //   this.config.init({}, function(err, returnedConfig) {
  //     assert(!err, "Unexpected Error When Returning Config Data.");
  //     assert.equal(config.get("log_email"), "test@example.com");

  //     config.set('log_email', 'someOtherValue@example.com');

  //     config.saveLocal(function(err) {
  //       assert(!err, "Expected No Error When Saving Config");

  //       assert.equal(config.get("log_email"), "someOtherValue@example.com");

  //       config.refresh(false, function(err) {
  //         assert(!err, "Expected No Error When Loading From Local");
  //         assert.equal(config.get("log_email"), "someOtherValue@example.com");
  //         done();
  //       });
  //     });

  //   });
  // });

  // it("config should be able to be loaded from local storage ", function(done) {
  //   this.config.init({}, function(err, returnedConfig) {
  //     assert(!err, "Unexpected Error When Returning Config Data.");
  //     assert.equal(config.get("log_email"), "test@example.com");

  //     config.set('log_email', 'someOtherValue@example.com');

  //     assert.equal(config.get("log_email"), "someOtherValue@example.com");

  //     config.refresh(false, function(err) {
  //       assert(!err, "Expected No Error When Loading From Local");
  //       assert.equal(config.get("log_email"), "someOtherValue@example.com");
  //       done();
  //     });
  //   });
  // });



  // it("how to get config properties", function() {
  //   assert(this.config.getAppId(), "Expected appId To Be set");
  //   assert(this.config.get("mbaasBaseUrl"), "Expected mbaasBaseUrl To Be set");
  //   assert(this.config.get("formUrls"), "Expected formUrls To Be set");
  //   assert(this.config.get("env"), "Expected env To Be set");
  //   assert(this.config.get("userConfigValues"), "Expected userConfigValues To Be set");
  //   assert.ok(this.config.get("sent_save_min") === 10, "Expected sent_save_min To Be set");
  // });

  // it("Should Only Be One Config Module", function() {
  //   var sameConfig = require('../../src/config.js');

  //   assert.ok(sameConfig.get("sent_save_min") === config.get("sent_save_min"));
  // });

  it("how to get config properties From Remote", function(done) {

    var callback = sinon.spy();
    this.request.onCreate = function(request) {
      debugger;
      request.respond(200, {
          "Content-Type": "application/json"
        },
        '{"randomRemoteConfig": 12}'
      );

      assert(callback.called, "Expected The Callback To Be Called Once");
      done();
    };

    config.refresh(true, callback);
  });


});