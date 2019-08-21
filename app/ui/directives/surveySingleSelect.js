(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveySingleSelect", ['SurveyEngine.Enums', '$timeout', '$compile', '$templateCache', singleSelect]);


    function singleSelect(enums, $timeout, $compile, $templateCache) {
        var directive = {
            link: link,
            controller: controller,
            restrict: 'E',
            require: ['^surveyVariable'],
            // template: '<ng-include src="GetTemplateUrl()"/>'
        };
        return directive;

        function link(scope, element, attrs, cntrls) {
            var parentCtrl = cntrls[0];
            var defaultOptionCode = parentCtrl.defaultOptionCode;

            if (parentCtrl.answers.length > 0) {
                $timeout(function () {
                    scope.SelectedValue = parentCtrl.answers[0].toString();
                }, 0);
            }
            else if (defaultOptionCode.length > 0) {
                $timeout(function () {
                    scope.SelectedValue = defaultOptionCode[0].toString();
                    parentCtrl.SaveAnswer(parseInt(scope.SelectedValue));
                }, 0);
            }

            if (scope.OtherVariableID) {
                scope.OtherVariableType = parentCtrl.GetOtherVariableType(scope.OtherVariableID);
            }
            scope.GetTemplateUrl = function () {
                var html = "";
                if (attrs.showAs == "selectbox") {
                    html = $templateCache.get('singleSelectBox.html');
                } else if (attrs.showAs == "dropdown") {
                    html = $templateCache.get('dropdown.html');
                }
                return html;
            };

            scope.SaveAnswer = function (selectedValue) {
                if (selectedValue != null || selectedValue != undefined || selectedValue != '')
                    parentCtrl.SaveAnswer(parseInt(selectedValue));
            }

            //Save the answer for Other options of the variable
            scope.SaveOtherValue = function (selectedValue, otherVariableID) {
                scope.OtherVariableID = otherVariableID;
                if (scope.OtherVariableID) {
                    var otherVariableName = parentCtrl.GetOtherVariableName(scope.OtherVariableID);
                    var otherVariableType = parentCtrl.GetOtherVariableType(scope.OtherVariableID)
                    parentCtrl.SaveAnswer(scope.OtherAnswer.Value[selectedValue], otherVariableName, otherVariableType, true, false);
                }
            }

            $timeout(function () {
                element.html(scope.GetTemplateUrl());
                $compile(element.contents())(scope);
            });

        }

        function controller($scope) {
            $scope.SelectedValue = '';
            $scope.OtherAnswer = {
                Value: {}
            };
            $scope.OtherAnswerType = '';
        }
    }


})(angular);