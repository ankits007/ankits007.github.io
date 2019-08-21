/**
 * Created by AnkitS on 1/24/2017.
 */

(function (angular) {
    'use strict';

    angular.module('SurveyEngineCore').directive("eProgressBar", ["$timeout", function ($timeout) {
        return {
            restrict: "E",
            scope: {
                showProgress: '=',
                callbacks : "=",
                progressType :"@"
            },
            transclude: true,
            link: function (scope, elem, attrs) {
                scope.progressText = "";
                scope.progress = 0;
                scope.progressStyle = {
                    'width': 0 + '%'
                }
                scope.updateCallbacks = scope.callbacks || {};
                scope.updateCallbacks.updateProgress = function (progress) {
                    scope.progress = progress;
                    scope.progressStyle['width'] = progress + '%';
                    
                }
                scope.updateCallbacks.updateText = function (text) {
                    scope.progressText = text;
                }
            },
            template:
            "<div >" +
            "<div class='ques-count' ng-show='progressType == \"text\"'>{{progressText}}</div>" +
            "<div class='ques-count' ng-show='progressType == \"percentage\"'>{{progressStyle.width}}</div>" +
            "<div class='progress ques-bar' ng-show='progress'>"+
            "   <div class='progress-bar ques-progress' ng-style='progressStyle'>"+
            "   </div>" +
            "</div>" +
            "</div>" +
            "<div class='loading loader-pos' ng-show='showProgress'></div>"
        };
    }])
})(angular);