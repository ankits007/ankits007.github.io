(function (angular) {
    "use strict";

    angular
        .module("SurveyEngineCore")
        .config(['SurveyEngine.APIPathConstants','insightsProvider', '$locationProvider', engineConfig]);

    function engineConfig(APIPathConstants, insightsProvider, $locationProvider) {
        insightsProvider.start(APIPathConstants.AppInsightsKey, 'SurveyEngine');

        $locationProvider.hashPrefix('');

    }
})(angular);