module.exports = {
    "appId": "appId1234",
    "mode": "dev",
    "env": "dev",
    "deviceId": "dev1234",
    "cloudHost": "host",
    "mbaasBaseUrl": "mbaas",
    "sent_save_min": 10,
    "sent_save_max": 1000,
    "targetWidth": 640,
    "targetHeight": 480,
    "quality": 50,
    "debug_mode": false,
    "logger": false,
    "max_retries": 3,
    "timeout": 30000,
    "log_line_limit": 5000,
    "log_email": "test@example.com",
    "log_level": 3,
    "log_levels": ["error", "warning", "log", "debug"],
    "config_admin_user": true,
    "picture_source": "both",
    "saveToPhotoAlbum": true,
    "encodingType": "jpeg",
    "sent_items_to_keep_list": [5, 10, 20, 30, 40, 50, 100],
    "storageStrategy": "html5-filesystem",
    "statusUrl": "ping",
    "userConfigValues": {

    },
    "formUrls": {
        "forms": "forms",
        "form": "form/:formId",
        "theme": "theme",
        "formSubmission": "submitFormData",
        "fileSubmission": "submitFormFile",
        "base64fileSubmission": "submitFormFileBase64",
        "submissionStatus": "submissionStatus",
        "formSubmissionDownload": "formSubmissionDownload",
        "fileSubmissionDownload": "fileSubmissionDownload",
        "completeSubmission": "completeSubmission",
        "config": "config"
    }

};