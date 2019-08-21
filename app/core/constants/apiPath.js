(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .constant("SurveyEngine.APIPathConstants", {

            // Change this API path
            BaseURL: 'https://beta-v3-live-webrole.rebuscode.com/',
            MediaUrl : "https://rebuscloudlivestorage.blob.core.windows.net/rebuscloud-v3-live-blobcontainerpublic/",
            AppInsightsKey : '3d1450ae-2f66-4c46-9179-658a57d7f223',//live

            //BaseURL : 'https://beta-v3-test-webrole.rebuscode.com/',
            //MediaURL : "https://rebuscloudteststorage.blob.core.windows.net/rebuscloud-v3-test-blobcontainerpublic/",
            //AppInsightsKey : 'f8a1d232-3005-42f1-bae2-3088c309eec1', //test



            //BaseURL : 'https://rcsync.rebuscode.com/devapi/',
            //MediaURL : "https://rebuscloudteststorage.blob.core.windows.net/rebuscloud-v3-test-blobcontainerpublic/",
            //AppInsightsKey : '28897a38-f531-47c7-aaa4-6d5851906c7e',//dev


        });
})(angular);