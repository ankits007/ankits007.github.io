(function(angular){
    "use strict";
    angular.module("SurveyEngineCore").directive("errorToolTip",["$compile",toolTip]);

    function toolTip($compile){
        return{
            restrict: 'A',
            scope:{
                ErrorConfig:'=errorConfig'
            },
            link: link,
            controller: ['$scope',controller]

        };

        function link(scope, element, attr){

            var html = "";

            html += '<div ng-if="ErrorConfig.ShowError" class="message" ng-style="ErrorConfig.Style"><span>{{ErrorConfig.Message}}</span><div ng-style="ErrorConfig.CaretStyle"></div></div>';
            element.append($compile(angular.element(html))(scope));

        }

        function controller($scope){

        }
    }
})(angular);