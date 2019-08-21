(function () {
    'use strict';

    angular.module('SurveyEngineCore').directive('bindHtmlCompile', ['$interpolate', function ($interpolate) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.r = window.r;
                var content = element.html();
                if (!content) {
                    content = "";
                }
                content = content + scope.$eval(attrs.bindHtmlCompile);
                // var inter = $interpolate(content, false, null, true)(scope);
                var watch = scope.$watch(function () {
                    return $interpolate(content, false, null, true)(scope);
                }, function (newValue, oldValue) {
                    if(newValue != undefined){
                        element.html(newValue);
                        if(newValue == content){
                            watch();
                        }else {
                            content = newValue;
                        }
                    }
                })
            }
        };
    }]);
}());