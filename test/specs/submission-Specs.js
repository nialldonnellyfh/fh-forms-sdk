var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');
var submission = require('../../src/submission.js');
var submissions = require('../../src/submissions.js');
var config = require('../../src/config.js');
var uploadManager = require('../../src/uploadManager.js');
var sinon = require('sinon');
var testData = {
  formId: "54d4cd220a9b02c67e9c3f0d",
  fieldId: "52dfd93ee02b762d3f000001"
};

var testForm = {
  "_id": "54d4cd220a9b02c67e9c3f0d",
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

describe("Submission model", function() {
  beforeEach(function(done) {
    this.server = sinon.fakeServer.create();
    this.server.autoRespond = true;
    config.init({}, function(err, returnedConfig) {
      assert.ok(!err, "Expected No Error");
      forms.clearLocal(function(err, model) {
        assert.ok(!err, "Expected No Error");
        submissions.clearLocal(function(err) {
          assert.ok(!err, "Expected No Error");
          done();
        });
      });
    });
  });

  afterEach(function() {
    this.server.restore();
  });
  it("how to create new submission from a form", function(done) {
    var form = new Form({
      formId: testData.formId,
      rawMode: true,
      rawData: testForm,
      fromRemote: false
    }, function(err, form) {
      assert(!err);
      var newSub = submission.newInstance(form);
      var localId = newSub.getLocalId();
      assert.equal(newSub.getStatus(), "new");
      assert(newSub);
      assert(localId);
      done();
    });
  });

  it("how to load a submission from local storage without a form", function(done) {
    //load form
    var form = new Form({
      formId: testData.formId,
      rawMode: true,
      rawData: testForm,
      fromRemote: false
    }, function(err, form) {
      assert(!err);
      var newSub = submission.newInstance(form);
      var localId = newSub.getLocalId();
      newSub.saveDraft(function(err) {
        assert(!err);
        submission.fromLocal(localId, function(err, submission1) {
          assert(!err);
          assert.equal(submission1.get("formId"), newSub.get("formId"));
          assert.equal(submission1.getStatus(), "draft"); 

          submission1.clearLocal(function(err) {
            assert(!err);
            done();
          });
        });
      });
    });
  });

  it("will throw error if status is in wrong order", function(done) {
    var error = false;
    //load form
    var form = new Form({
      formId: testData.formId,
      rawMode: true,
      rawData: testForm,
      fromRemote: false
    }, function(err, form) {
      assert(!err);
      var newSub = submission.newInstance(form);
      var localId = newSub.getLocalId();
      newSub.saveDraft(function(err) {
        assert(!err);

        newSub.submitted(function(err) {
          assert(err, "Expected An Error When Trying To Change To An Invalid State");
          newSub.clearLocal(function(err) {
            assert(!err);
            done();
          });
        });
      });
    });
  });

  it("how to store a draft,and find it from submissions list", function(done) {
    var form = new Form({
      formId: testData.formId,
      rawMode: true,
      rawData: testForm,
      fromRemote: false
    }, function(err, form) {
      assert(!err);
      var newSub = submission.newInstance(form);
      var localId = newSub.getLocalId();

      newSub.saveDraft(function(err) {
        assert(!err);
        var localId = newSub.getLocalId();
        var meta = submissions.findMetaByLocalId(localId);
        assert(meta._ludid == localId);
        assert(meta.formId == newSub.get("formId"));
        submissions.getSubmissionByMeta(meta, function(err, sub1) {
          assert(newSub === sub1);
          newSub.clearLocal(function(err) {
            assert(!err);
            done();
          });
        });
      });
    });
  });
  it("submission model loaded from local should have only 1 reference", function(done) {

    var form = new Form({
      formId: testData.formId,
      rawMode: true,
      rawData: testForm,
      fromRemote: false
    }, function(err, form) {
      assert(!err);
      var newSub = submission.newInstance(form);
      var localId = newSub.getLocalId();

      assert(localId, "Expected A Local ID To Be Set");

      var meta = submissions.findByFormId(testData.formId)[0];

      assert.equal(meta._ludid, localId);

      submission.fromLocal(localId, function(err, submission1) {
        submission.fromLocal(localId, function(err, submission2) {
          assert(submission1 === submission2);
          submission1.clearLocal(function(err) {
            assert(!err);
            done();
          });
        });
      });
    });
  });
  describe("comment", function() {
    beforeEach(function(done) {
      config.init({}, function(err) {
        assert(!err);
        done();
      });
    });
    it("how to add a comment to a submission with or without a user", function(done) {
      var form = new Form({
        formId: testData.formId,
        rawMode: true,
        rawData: testForm,
        fromRemote: false
      }, function(err, form) {
        assert(!err);
        var newSub = submission.newInstance(form);
        var localId = newSub.getLocalId();

        assert(localId, "Expected A Local ID To Be Set");
        submission.fromLocal(localId, function(err, submission) {
          assert(!err);
          var ts1 = submission.addComment("hello world");
          var ts2 = submission.addComment("test", "testerName");
          var comments = submission.getComments();
          assert(comments.length > 0);
          var str = JSON.stringify(comments);
          assert(str.indexOf("hello world") > -1);
          assert(str.indexOf("testerName") > -1);
          submission.clearLocal(function(err) {
            assert(!err);
            done();
          });
        });
      });

    });

    it("how to remove a comment from submission", function(done) {
      var form = new Form({
        formId: testData.formId,
        rawMode: true,
        rawData: testForm,
        fromRemote: false
      }, function(err, form) {
        assert(!err);
        var newSub = submission.newInstance(form);
        var localId = newSub.getLocalId();

        assert(localId, "Expected A Local ID To Be Set");
        submission.fromLocal(localId, function(err, submission) {
          assert(!err, "unexpected error: " + err);
          var ts1 = submission.addComment("hello world2");
          submission.removeComment(ts1);
          var comments = submission.getComments();

          var str = JSON.stringify(comments);
          assert(str.indexOf(ts1.toString()) == -1, "comment still in submission: " + str);
          submission.clearLocal(function(err) {
            assert(!err);
            done();
          });
        });
      });
    });

  });

  describe("User input", function() {
    var newSub = null;
    beforeEach(function(done) {
      config.init({}, function(err) {
        assert(!err);
        var form = new Form({
          formId: testData.formId,
          rawMode: true,
          rawData: testForm,
          fromRemote: false
        }, function(err, form) {
          assert(!err);
          newSub = submission.newInstance(form);
          var localId = newSub.getLocalId();
          assert(newSub.getStatus() == "new");
          assert(newSub);
          assert(localId);
          done();
        });
      });

    });
    it("how to add user input value to submission model", function() {
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 40
      }, function(err) {
        assert(!err);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[0] == 40);
      });
    });
    it("how to reset a submission to clear all user input", function() {
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 40
      }, function(err) {
        assert(!err);
      });
      newSub.reset();
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(!err);
        assert(res.length === 0);
      });
    });

    it("how to handle a null user input", function() {
      newSub.reset();
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: null
      }, function(err) {
        assert(!err);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(!err);
        assert(res.length === 0);
      });
    });

    it("how to use transaction to input a series of user values to submission model", function() {
      newSub.reset();
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 40
      }, function(err) {
        assert(!err);
      });
      newSub.startInputTransaction();
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 50
      }, function(err) {
        assert(!err);
      });
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 60
      }, function(err) {
        assert(!err);
      });
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 35
      }, function(err) {
        assert(!err);
      });
      newSub.endInputTransaction(true);
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[0] == 40);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[1] == 50);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[2] == 60);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[3] == 35);
      });
    });
    it("how to use transaction for user input and roll back", function() {
      newSub.reset();
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 40
      }, function(err) {
        assert(!err);
      });
      newSub.startInputTransaction();
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 50
      }, function(err) {
        assert(!err);
      });
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 60
      }, function(err) {
        assert(!err);
      });
      newSub.addInputValue({
        fieldId: testData.fieldId,
        value: 35
      }, function(err) {
        assert(!err);
      });
      newSub.endInputTransaction(false);
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[0] === 40);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[1] === undefined);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[2] === undefined);
      });
      newSub.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(res[3] === undefined);
      });
    });
  });

  describe("upload submission with upload manager", function() {
    var form = null;
    beforeEach(function(done) {
      this.server = sinon.fakeServer.create();
      this.server.autoRespond = true;
      this.server.autoRespondAfter = 50;


      //Server Ping
      this.server.respondWith('GET', '/sys/info/ping', [200, {
          "Content-Type": "application/json"
        },
        JSON.stringify({"status": "ok"})
      ]);

      //Submission Data
      this.server.respondWith('POST', '/forms/appId1234/' + testData.formId + '/submitFormData', [200, {
          "Content-Type": "application/json"
        },
        JSON.stringify({"submissionid": "aSubmissionID"})
      ]);

      //CompleteSubmission
      this.server.respondWith('POST', '/forms/appId1234/aSubmissionID/completeSubmission', [200, {
          "Content-Type": "application/json"
        },
        JSON.stringify({"status": "complete"})
      ]);
      form = new Form({
        formId: testData.formId,
        rawMode: true,
        rawData: testForm,
        fromRemote: false
      }, function(err, _form) {
        form = _form;
        done();
      });
    });
    afterEach(function(done) {
      this.server.restore();
    });
    it("how to queue a submission", function(done) {
      var newSub1 = form.newSubmission();
      newSub1.on("submit", function(err) {
        assert(!err);

        newSub1.upload(function(err, uploadTask) {
          assert(!err);
          assert(uploadTask);
          assert(uploadManager.timer);
          assert(uploadManager.hasTask());

          newSub1.getUploadTask(function(err, task) {
            assert(!err);
            assert(task);
            newSub1.clearLocal(function(err) {
              assert(!err);
              done();
            });
          });
        });
      });

      newSub1.submit(function(err) {
        if (err) console.log(err);
        assert(!err);
      });
    });
    it("how to monitor if a submission is submitted", function(done) {
      var newSub1 = form.newSubmission();

      newSub1.on("submit", function() {
        newSub1.upload(function(err, uploadTask) {
          assert(!err);
          assert(uploadTask);
        });
      });
      newSub1.on("progress", function(progress) {
        console.log("PROGRESS: ", progress);
      });
      newSub1.on("error", function(err, progress) {
        assert.ok(!err);
        console.log("ERROR: ", err, progress);
      });
      newSub1.on("submitted", function(submissionId) {
        assert.ok(submissionId);
        assert.ok(newSub1.getLocalId());
        assert.ok(newSub1.getRemoteSubmissionId());
        newSub1.clearLocal(function(err) {
          assert(!err);
          done();
        });
      });
      newSub1.submit(function(err) {
        assert(!err);
      });
    });
  });

  describe("download a submission using a submission Id", function() {
    beforeEach(function(done) {
      config.init({}, function(err) {
        assert(!err);
        done();
      });
    });
    it("how to queue a submission for download", function(done) {
      var submissionToDownload = null;
      submissionToDownload = submission.newInstance(null, {
        "submissionId": "testSubmissionId"
      });

      submissionToDownload.on("progress", function(progress) {

        console.log("DOWNLOAD PROGRESS: ", progress);
        assert.ok(progress);
      });

      submissionToDownload.on("downloaded", function() {

        console.log("downloaded event called");
        done();
      });

      submissionToDownload.on("error", function(err, progress) {

        console.error("error event called");
        assert.ok(!err);
        assert.ok(progress);
        done();
      });

      submissionToDownload.download(function(err, downloadTask) {

        console.log(err, downloadTask);
        assert.ok(!err);
        assert.ok(downloadTask);

        submissionToDownload.getDownloadTask(function(err, downloadTask) {

          console.log(err, downloadTask);
          assert.ok(!err);
          assert.ok(downloadTask);
        });
      });
    });
  });
});