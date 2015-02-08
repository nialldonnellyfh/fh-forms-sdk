//Should be moved to a test fixture..

var getFormsData = require("../test/fixtures/getForms.json");
var allForms = require("../test/fixtures/getForm.json");
var theme = require("../test/fixtures/getTheme.json");
var sampleConfig = require("../test/fixtures/getConfig.json");
var submissionFile = require("../test/fixtures/submissionFile.json");
var submissionData = require("../test/fixtures/submissionData.json");
var sampleConfig = require("../test/fixtures/getConfig.json");
var responseDelay = 10;
var web = {
    GET: function(url, params, cb) {
        console.log("FAKE GET: ", url, params);

        function _ping(params, cb) {
            console.log("In _ping, ", url);
            cb(null, "OK");
        }

        function _getTheme(params, cb) {
            console.log("In _getTheme, ", url);
            cb(null, theme);
        }

        function _getConfig(params, cb) {
            console.log("In _getConfig, ");

            cb(null, JSON.stringify(sampleConfig));
        }

        function _getSubmissionData(params, cb) {
            var submissionId = params.submissionId;
            console.log("In _getSubmissionData", url);
            var retVal = {};

            if (submissionId === "submissionData") {
                retVal = submissionData;
            } else if (submissionId === "submissionFile") {
                retVal = submissionFile;
            } else { //If it is not either of these, send back an error
                retVal = {
                    error: "No submission matches id: " + submissionId
                };
            }
            cb(null, retVal);
        }

        function _getSubmissionFile(params, cb) {
            console.log("In _getSubmissionData", url);

            cb(null, "some/path/to/file");
        }

        function _getForms(params, cb) {
            console.log("In _getForms, ", url);
            cb(null, getFormsData);
        }

        function _getForm(params, cb) {
            console.log("In _getForm, ", url);
            var formId = params.formId;

            if (url.indexOf("somerandomformid") > -1) {
                cb("Cannot find specified form");
            } else {
                console.log("Form Found");
                cb(null, allForms);
            }
        }

        function _getSubmissionStatus(params, cb) {
            var submissionId = params.submissionId;
            console.log("In _getSubmissionStatus, ", submissionId);

            var responseJSON = {
                "status": "complete"
            };

            if (submissionId === "submissionStatus") {
                if (submissionStatusCounter === 0) {
                    responseJSON = {
                        "status": "pending",
                        "pendingFiles": [submissionStatusFileHash]
                    };
                    submissionStatusCounter++;
                } else {
                    responseJSON = {
                        "status": "complete"
                    };
                }
            } else if (submissionId === "failedFileUpload") {
                responseJSON = {
                    "status": "pending",
                    "pendingFiles": [failedFileUploadFileHash]
                };
            } else if (submissionId === "submissionError") {
                responseJSON = {
                    "status": "pending",
                    "pendingFiles": ["filePlaceHolder123456"]
                };
            }

            setTimeout(function() {
                cb(null, responseJSON);
            }, responseDelay);
        }

        var urlMap = {
            hostmbaasforms: _getForms,
            "hostmbaasform/54d4cd220a9b02c67e9c3f0c": _getForm,
            "hostmbaasform/somerandomformid": _getForm,
            hostmbaastheme: _getTheme,
            hostmbaassubmissionStatus: _getSubmissionStatus,
            hostmbaasconfig: _getConfig,
            hostmbaasformSubmissionDownload: _getSubmissionData,
            hostmbaasfileSubmissionDownload: _getSubmissionFile,
            hostping: _ping
        };

        setTimeout(function() {
            urlMap[url](params, cb);
        }, responseDelay);
    },
    POST: function(url, body, cb) {
        console.log("FAKE POST: ", url, body);

        function _completeSubmission(body, cb) {
            var submissionId = body.submissionId;
            console.log("In _completeSubmission, ", submissionId);
            var resJSON = {
                "status": "complete"
            };
            if (submissionId === "submissionNotComplete") {
                resJSON = {
                    "status": "pending",
                    "pendingFiles": ["filePlaceHolder123456"]
                };
            } else if (submissionId === "submissionError") {
                resJSON = {
                    "status": "error"
                };
            } else if (submissionId === "submissionStatus") {
                submissionStatusFileHash = "";
                submissionStatusCounter = 0;
            }
            console.log(resJSON);
            setTimeout(function() {
                cb(null, resJSON);
            }, responseDelay);
        }

        function _postFormSubmission(body, cb) {
            console.log("In _postFormSubmission, ", body);

            var submissionId = "123456";

            if (body.testText === "failedFileUpload") {
                submissionId = "failedFileUpload";
            } else if (body.testText === "submissionNotComplete") {
                submissionId = "submissionNotComplete";
            } else if (body.testText === "submissionError") {
                submissionId = "submissionError";
            } else if (body.testText === "submissionStatus") {
                submissionId = "submissionStatus";
            } else {
                submissionId = Math.floor((Math.random() * 1000) + 1).toString();
            }

            var rtn = {
                "submissionId": submissionId,
                "ori": body
            };
            if (body.outOfDate) {
                rtn.updatedFormDefinition = allForms;
            }
            setTimeout(function() {
                console.log("Returning: ", body.testText);
                console.log("submissionId: ", submissionId);
                cb(null, rtn);
            }, responseDelay);
        }

        var urlMap = {
            hostmbaasformSubmission: _postFormSubmission,
            hostmbaascompleteSubmission: _completeSubmission,
            hostmbaassubmitFormData: _postFormSubmission
        };

        setTimeout(function() {
            urlMap[url](body, cb);
        }, responseDelay);
    }
};

module.exports = function(params) {
    console.log("Fake Ajax ", params);

    web[params.type](params.url, params, function(err, res) {
        console.log("FAKE AJAX ", err, res);
        if (err) {
            return params.error(null, null, err);
        }
        return params.success(res);
    });
}