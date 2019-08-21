/**
 * Created by AnkitS on 6/8/2017.
 */

(function (angular) {
    'use strict';

    angular.module('SurveyEngineCore').directive("autoProgessBar", ["$timeout", function ($timeout) {
        return {
            restrict: "E",
            scope: {
                max : "=",
                completed: '=',
                text : "="
            },
            link: function (scope, elem, attrs) {
                scope.getProgress = function () {
                    return {width : (scope.completed*100/scope.max) + "%"};
                }
            },
            template:
            "   <div class='progress-bar' title='Auto Generate Progress : {{getProgress() | number:0 }}' style='width: {{completed*100/max}}%; height: 25px;'>"+
            "   </div>"+
            "   <div style='width: 100%; text-align: center; margin-top: 25px;'>" +
            "       <span class='progress-text'>{{text}}</span>" +
            "   </div>"
        };
    }])
})(angular);