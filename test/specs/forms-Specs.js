var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var _ = require('underscore');
var forms = require('../../src/forms.js');
var Form = require('../../src/form.js');

var testData = {
    formId: "54d4cd220a9b02c67e9c3f0c"
};

describe("forms model",function(){
    it ("How to load form list from local storage-> mBaaS / can load forms and refresh the model ",function(done){
        var timeStamp1=forms.getLocalUpdateTimeStamp();
        forms.refresh(function(err,model){
            assert(!err);
            var timeStamp2=model.getLocalUpdateTimeStamp();
            assert(timeStamp1!=timeStamp2);
            done();
        });
    });
    it ("how to forcely load form list from mBaaS and store it locally / can load forms and refresh the model forcely from remote",function(done){
        var timeStamp1=forms.getLocalUpdateTimeStamp();
        forms.refresh(true, function(err,model){
            assert(!err);
            var timeStamp2=model.getLocalUpdateTimeStamp();
            assert(timeStamp1!=timeStamp2);
            done();
        });
    });

    it (" how to find a form's meta info from form list / can load a formMeta data by its form id",function(){
        var form=forms.getFormMetaById(testData.formId);
        assert(form);
        assert(form._id==testData.formId);
        assert(form.lastUpdated);
    });

    it ("how to test if a form model object is up to date / should check if a form is up to date",function(done){
        new Form({formId:testData.formId,fromRemote:true},function(err, form){
            assert(!err);

            assert (!forms.isFormUpdated(form));
            done();
        });
    });
    it ("how to return the full list of forms",function(done){
        var formMetaList=forms.getFormsList();
        assert(formMetaList);
        assert(formMetaList.length>0);
        done();
    });
});