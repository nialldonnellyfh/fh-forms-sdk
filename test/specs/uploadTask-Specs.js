var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sinon = require('sinon');
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');
var submission = require('../../src/submission.js');
var submissions = require('../../src/submissions.js');
var config = require('../../src/config.js').getConfig();
var uploadManager = require('../../src/uploadManager.js');
var uploadTask = require('../../src/uploadTask.js');
var fileSystem = require('../../src/fileSystem.js');
var aync = require('async');


var testBase64Pic = require('../fixtures/base64pic.js').value;
var testData = {
  formId: "54d4cd220a9b02c67e9c3f0c",
  fieldId: "54d4cd220a9b02c67e9c3efa",
  fieldIdFile: "54d4cd220a9b02c67e9c1245",
  fieldIdPhoto: "54d4cd220a9b02c67e9c3f07"
};

var mockForm = require('../fixtures/getForm.json');


describe("UploadTask model", function () {

  beforeEach(function (done) {
    var self = this;
    self.server = sinon.fakeServer.create();
    self.server.autoRespond = true;
    self.server.autoRespondAfter = 50;

    self.config = config;

    self.config.init({}, function (err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      //Server Ping
      self.server.respondWith('GET', config.getCloudHost() + '/sys/info/ping', [200, {
        "Content-Type": "application/json"
      },
        JSON.stringify({
          "status": "ok"
        })
      ]);

      self.form = Form.newInstance({
        rawMode: true,
        rawData: mockForm
      });
      done();
    });
  });

  afterEach(function (done) {
    this.server.restore();
    done();
  });

  it("how to upload submission form", function(done) {
    var sub = this.form.newSubmission();
    var ut = uploadTask.newInstance(sub);

    this.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "remsubid1234"
      })
    ]);

    ut.uploadForm(function(err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));
      var progress = ut.getProgress();
      assert(progress.formJSON);

      assert.equal(sub.getRemoteSubmissionId(), "remsubid1234");
      assert.equal(sub.get('submissionId'), "remsubid1234");
      done();
    });
  });

   it("how to deal with out of date form submission", function(done) {
     var self = this;
     var changedMockForm = _.clone(mockForm);
     changedMockForm.name = "Changed Mock Form";
     this.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
       "Content-Type": "application/json"
     },
       JSON.stringify({
         "status": "ok",
         "submissionId": "remsubid1234",
         "updatedFormDefinition": changedMockForm
       })
     ]);

     var sub = this.form.newSubmission();
     sub.changeStatus("pending", function(err) {
       assert(!err, "Expected No Error: " + JSON.stringify(err));

       sub.changeStatus("inprogress", function(err) {
         assert(!err, "Expected No Error: " + JSON.stringify(err));
         var ut = uploadTask.newInstance(sub);
         ut.uploadForm(function(err) {
           assert(!err, "Expected No Error: " + JSON.stringify(err));
           var progress = ut.getProgress();
           assert.equal(progress.formJSON, true);
           assert.equal(self.form.getName(), "Changed Mock Form");
           assert(!ut.isCompleted());
           done();
         });
       });
     });
   });

  it("how to upload a file ", function(done) {
    var self = this;
    self.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "remsubid1234"
      })
    ]);



    var sub = this.form.newSubmission();
    sub.changeStatus("pending", function(err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function(err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        fileSystem.save("testfile.txt", "content of the file", function(err) {
          assert(!err, "Expected No Error: " + JSON.stringify(err));
          fileSystem.readAsFile("testfile.txt", function(err, file) {
            sub.addInputValue({
              fieldId: testData.fieldIdFile,
              value: file
            }, function(err, result) {
              assert(!err, "Expected No Error: " + JSON.stringify(err));
              assert(_.isString(result.hashName), "Expected The Hash Name To Be A String");

              //Setting Up The File Response
              self.server.respondWith('POST', 'host/mbaas/forms/appId1234/remsubid1234/' + testData.fieldIdFile + "/" + result.hashName + '/submitFormFile', [200, {
                "Content-Type": "multipart/form-data"
              }, JSON.stringify({

              })
              ]);

              var ut = uploadTask.newInstance(sub);
              ut.uploadForm(function(err) {
                assert(!err, "Expected No Error: " + JSON.stringify(err));

                ut.uploadFile(function(err) {
                  assert(!err, "Expected No Error: " + JSON.stringify(err));
                  assert(ut.get("currentTask") === 1);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it("how to upload by tick", function(done) {
    var self = this;
    self.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "remsubid12345"
      })
    ]);



    var sub = this.form.newSubmission();
    sub.changeStatus("pending", function(err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function(err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        fileSystem.save("testfile.txt", "content of the file", function(err) {
          assert(!err, "Expected No Error: " + JSON.stringify(err));
          fileSystem.readAsFile("testfile.txt", function(err, file) {
            sub.addInputValue({
              fieldId: testData.fieldIdFile,
              value: file
            }, function(err) {
              assert(!err, "Expected No Error: " + JSON.stringify(err));
              var ut = uploadTask.newInstance(sub);

              ut.uploadTick(function(err) {
                assert(!err, "Expected No Error: " + JSON.stringify(err));
                assert(ut.isFormCompleted());
                assert(!ut.isFileCompleted());
                assert(!ut.isMBaaSCompleted());
                assert(!ut.isError());
                done();
              });
            });
          });
        });
      });
    });
  });

  it("how to check for failed file upload", function (done) {
    config.set("max_retries", 2);
    var self = this;
    var sub = self.form.newSubmission();

    sub.on('error', function(err){
      done();
    });

    self.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "subfailedfileupload"
      })
    ]);

    sub.changeStatus("pending", function (err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function (err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        fileSystem.save("testfile.txt", "content of the file", function (err) {
          assert(!err, "Expected No Error: " + JSON.stringify(err));
          fileSystem.readAsFile("testfile.txt", function (err, file) {
            sub.addInputValue({
              fieldId: testData.fieldIdFile,
              value: file
            }, function (err, result) {
              assert(!err, "Expected No Error: " + JSON.stringify(err));

              //Setting Up The File Response
              self.server.respondWith('POST', 'host/mbaas/forms/appId1234/subfailedfileupload/' + testData.fieldIdFile + "/" + result.hashName + '/submitFormFile', [500, {
                "Content-Type": "multipart/form-data"
              }, JSON.stringify({error: "Error Uploading File"})
              ]);

              //Setting Up The File Response
              self.server.respondWith('GET', 'host/mbaas/forms/appId1234/subfailedfileupload/status', [200, {
                "Content-Type": "application/json"
              }, JSON.stringify({
                status: "pending",
                pendingFiles: [result.hashName]
              })
              ]);

              var ut = uploadTask.newInstance(sub);

              ut.uploadTick(function (err) { //form upload
                assert(!err, "Expected No Error: " + JSON.stringify(err));

                ut.uploadTick(function (err) { //First upload fails -- upload task should be set to try again.
                  assert(!err, "Expected No Error: " + JSON.stringify(err));
                  assert(ut.getCurrentTask() === 0);
                  assert(sub.getStatus() === "queued");
                  assert.ok(sub.getRemoteSubmissionId());
                  assert(ut.get("retryNeeded") === true);
                  assert(ut.get("retryAttempts") === 1);

                  ut.uploadTick(function (err) { // Next upload tick should reset the uploadTask
                    assert(!err, "Expected No Error: " + JSON.stringify(err));
                    assert(sub.getStatus() === "queued");
                    assert(ut.get("retryNeeded") === false);
                    assert(ut.get("retryAttempts") === 1);

                    ut.uploadTick(function (err) { //Next upload fails again
                      assert(!err, "Expected No Error: " + JSON.stringify(err));
                      assert(ut.getCurrentTask() === 0);
                      assert(sub.getStatus() === "queued");
                      assert(ut.get("retryNeeded") === true);
                      assert(ut.get("retryAttempts") === 2);

                      ut.uploadTick(function (err) { // Next upload tick should reset the uploadTask again
                        assert(!err, "Expected No Error: " + JSON.stringify(err));
                        assert(ut.getCurrentTask() === 0);
                        assert(sub.getStatus() === "queued");
                        assert(ut.get("retryNeeded") === false);
                        assert(ut.get("retryAttempts") === 2);

                        ut.uploadTick(function (err) { // Upload fails again. Exceeded max number of retry attempts. Upload task is now in error state
                          assert(err);
                          assert(sub.getStatus() === "error");
                          assert(ut.isError() === true);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });


  it("how to check for file status", function (done) {
    var self = this;

    self.config.set("max_retries", 2);
    var sub = self.form.newSubmission();

    sub.on('error', function (err) {
      assert(!err, "Expected No Error");
    });

    sub.on('submitted', function (submissionId) {
      assert.equal(submissionId, "subcompleteupload");
      done();
    });

    self.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "subcompleteupload"
      })
    ]);



    sub.changeStatus("pending", function (err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function (err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        fileSystem.save("testfile.txt", "content of the file", function (err) {
          assert(!err, "Expected No Error: " + JSON.stringify(err));
          fileSystem.readAsFile("testfile.txt", function (err, file) {
            sub.addInputValue({
              fieldId: testData.fieldIdFile,
              value: file
            }, function (err, result) {
              assert(!err, "Expected No Error: " + JSON.stringify(err));


              self.server.respondWith('POST', 'host/mbaas/forms/appId1234/subcompleteupload/completeSubmission', [200, {
                "Content-Type": "multipart/form-data"
              }, JSON.stringify({
                status: "complete"
              })
              ]);

              self.server.respondWith('GET', 'host/mbaas/forms/appId1234/subcompleteupload/status', [200, {
                              "Content-Type": "application/json"
              }, JSON.stringify({
                status: "pending",
                pendingFiles: [result.hashName]
              })
              ]);

              var ut = uploadTask.newInstance(sub);

              ut.uploadTick(function (err) { //upload form successfully
                assert(!err, "Expected No Error: " + JSON.stringify(err));


                //Setting Server Responses
                self.server.respondWith('GET', 'host/mbaas/forms/appId1234/subfailedfileupload/status', [200, {
                  "Content-Type": "application/json"
                }, JSON.stringify({
                  status: "pending",
                  pendingFiles: [result.hashName]
                })
                ]);

                //Setting Up The File Response
                self.server.respondWith('POST', 'host/mbaas/forms/appId1234/subcompleteupload/' + testData.fieldIdFile + "/" + result.hashName + '/submitFormFile', [500, {
                  "Content-Type": "multipart/form-data"
                }, JSON.stringify({error: "Failed To Upload File"})
                ]);

                ut.uploadTick(function (err) { // upload file failed 1st time
                  assert(!err, "Expected No Error: " + JSON.stringify(err));
                  assert(ut.getCurrentTask() === 0);
                  assert(ut.get("retryNeeded") === true);
                  assert(ut.get("retryAttempts") === 1);
                  assert(sub.getStatus() === "queued");

                  //Setting Up The File Response
                  self.server.respondWith('POST', 'host/mbaas/forms/appId1234/subcompleteupload/' + testData.fieldIdFile + "/" + result.hashName + '/submitFormFile', [200, {
                    "Content-Type": "multipart/form-data"
                  }, JSON.stringify({})
                  ]);

                  ut.uploadTick(function (err) { //rebuilds the upload task
                    assert(!err, "Expected No Error: " + JSON.stringify(err));
                    assert(ut.get("retryNeeded") === false);
                    assert(ut.get("retryAttempts") === 1);
                    assert(sub.getStatus() === "queued");



                    ut.uploadTick(function (err) { //Next file uploaded sucessfully to mbaas.
                      assert(!err, "Expected No Error: " + JSON.stringify(err));
                      assert(sub.getStatus() === "queued");
                      ut.uploadTick(function (err) { //call completeSubmission
                        assert(!err, "Expected No Error: " + JSON.stringify(err));
                        assert(sub.getStatus() === "queued");

                        ut.uploadTick(function (err) { //Submission is now complete
                          assert(!err, "Expected No Error: " + JSON.stringify(err));
                          assert(sub.getStatus() === "submitted");
                          assert(ut.isCompleted() === true);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it("how to get total upload size", function() {
    var sub = this.form.newSubmission();
    sub.changeStatus("pending", function(err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function(err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        var ut = uploadTask.newInstance(sub);
        assert(ut.getTotalSize());
      });
    });
  });

  it("how to get uploaded size", function (done) {
    var self = this;
    var sub = this.form.newSubmission();

    self.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "subuploadsize"
      })
    ]);

    sub.changeStatus("pending", function (err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function (err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        var ut = uploadTask.newInstance(sub);
        assert(ut.getTotalSize());
        assert.equal(ut.getUploadedSize(), 0);
        ut.uploadTick(function (err) {
          assert.ok(!err, "Expected No Error " + JSON.stringify(err));
          assert.equal(ut.getTotalSize(), ut.getUploadedSize());
          done();
        });
      });
    });
  });

  it("how to upload photo/signature", function (done) {
    var self = this;
    var sub = self.form.newSubmission();

    self.server.respondWith('POST', 'host/mbaas/forms/appId1234/54d4cd220a9b02c67e9c3f0c/submitFormData', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        "status": "ok",
        "submissionId": "subphotoid"
      })
    ]);

    sub.changeStatus("pending", function (err) {
      assert(!err, "Expected No Error: " + JSON.stringify(err));

      sub.changeStatus("inprogress", function (err) {
        assert(!err, "Expected No Error: " + JSON.stringify(err));

        sub.addInputValue({
          fieldId: testData.fieldIdPhoto,
          value: testBase64Pic
        }, function (err, result) {
          assert(!err, "Expected No Error: " + JSON.stringify(err));

          //Setting Up The File Response
          self.server.respondWith('POST', 'host/mbaas/forms/appId1234/subphotoid/' + testData.fieldIdPhoto + "/" + result.hashName + '/submitFormFileBase64', [200, {
            "Content-Type": "multipart/form-data"
          }, JSON.stringify({})
          ]);

          var ut = uploadTask.newInstance(sub);
          ut.uploadForm(function (err) {
            assert(!err, "Expected No Error: " + JSON.stringify(err));

            ut.uploadFile(function (err) {
              assert(!err, "Expected No Error: " + JSON.stringify(err));
              assert.equal(ut.get("currentTask"), 1);
              done();
            });
          });
        });
      });
    });
  });

  it("how to download a submission definition", function (done) {
    var sub = submission.newInstance(null, {submissionId: "somesubmissionid"});

    var self = this;

    self.server.respondWith('GET', 'host/mbaas/forms/appId1234/submission/somesubmissionid', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({
        _id: "somesubmissionid",
        formId: "someformid",
        formFields: [{
          fieldId: {
            _id: "sometextfieldid",
            type: "text"
          },
          fieldValues: ["sometext"]
        }, {
          fieldId: {
            _id: "somephotofieldid",
            type: "photo"
          },
          fieldValues: [{
            groupId: "filegroup1234",
            fileName: "filename.jpeg",
            hashName: "filePlaceholderfile1234",
            fileType: "image/jpeg",
            fileSize: 1234
          }]
        }],
        formSubmittedAgainst: {
          _id: "someformid",
          pages: [{
            _id: "somepageid",
            fields: [{
              _id: "sometextfieldid",
              type: "text"
            }, {
              _id: "somephotofieldid",
              type: "photo"
            }]
          }]
        }
      })
    ]);

    self.server.respondWith('GET', 'host/mbaas/forms/appId1234/submission/somesubmissionid/file/filegroup1234', [200, {
      "Content-Type": "application/json"
    },
      JSON.stringify({})
    ]);

    sub.changeStatus("pending", function (err) {
      assert.ok(!err);

      sub.changeStatus("inprogress", function (err) {
        assert.ok(!err);

        var downloadTask = uploadTask.newInstance(sub);
        //First download tick will download the json definition of the submission
        downloadTask.uploadTick(function (err) {
          assert.ok(!err);

          assert.ok(!downloadTask.retryNeeded(), "Expected No Retry Needed");

          assert.ok(downloadTask.getProgress());
          assert.ok(sub.getStatus() === "inprogress");

          //Second download tick will download the file from the server
          downloadTask.uploadTick(function (err) {
            assert.ok(!err);
            assert.ok(sub.getStatus() === "inprogress");
            assert.ok(!downloadTask.retryNeeded(), "Expected No Retry Needed");

            //Third download tick will verify the submission as downloaded
            downloadTask.uploadTick(function (err) {
              assert.ok(!err);
              assert.ok(!downloadTask.retryNeeded(), "Expected No Retry Needed");
              //It should have downloaded a file
              //Third download tick will verify the submission as downloaded
              downloadTask.uploadTick(function (err) {
                assert.ok(!err);
                assert.ok(!downloadTask.retryNeeded(), "Expected No Retry Needed");

                assert.ok(sub.getStatus() === "downloaded");
                //It should have downloaded a file
                done();
              });
            });
          });
        });
      });
    });
  });
});