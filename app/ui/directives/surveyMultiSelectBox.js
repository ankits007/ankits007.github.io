(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyMultiSelectBox", ['SurveyEngine.Enums', '$timeout', '$templateCache', '$compile', multiSelectBox]);


    function multiSelectBox(enums, $timeout, $templateCache, $compile) {
        var directive = {
            link: link,
            controller: controller,
            restrict: 'E',
            require: ['surveyMultiSelectBox', '^surveyVariable'],
            // template: '<ng-include src="GetTemplateUrl()"/>'
        };
        return directive;

        function link(scope, element, attrs, cntrls) {
            var myCtrl = cntrls[0];
            myCtrl.parentCtrl = cntrls[1];
            var exclusiveCode = myCtrl.parentCtrl.exclusiveCode;
            var defaultOptionCode = myCtrl.parentCtrl.defaultOptionCode;
            var answers = myCtrl.parentCtrl.answers;


            if (myCtrl.parentCtrl.answers.length > 0) {
                for (var i in myCtrl.parentCtrl.answers) {
                    if (typeof (myCtrl.parentCtrl.answers[i]) == "number")
                        scope.data.SelectedValues.push(myCtrl.parentCtrl.answers[i].toString());
                    else
                        scope.data.SelectedValues.push(myCtrl.parentCtrl.answers[i]);
                }
            }
            else if (defaultOptionCode.length > 0) {
                for (var i in defaultOptionCode) {
                    scope.data.SelectedValues.push(defaultOptionCode[i].toString());
                    myCtrl.parentCtrl.SaveAnswer(parseInt(defaultOptionCode[i]));
                }
            }

            scope.onSelect = function (option, SelectedValues) {
                if (option.IsExclusive) {

                    scope.data.SelectedValues = [];
                    scope.data.SelectedValues.push(option.Code.toString());
                } else {
                    //Check if the any exclusive is selected..remove if..
                    if (scope.data.SelectedValues.indexOf(exclusiveCode.toString()) > -1) {
                        var index = scope.data.SelectedValues.indexOf(exclusiveCode.toString());
                        scope.data.SelectedValues.splice(index, 1);
                    }
                }

                //Now update answers finally...
                myCtrl.parentCtrl.RemoveAllAnswers();
                for (var i in scope.data.SelectedValues) {

                    var code = parseInt(scope.data.SelectedValues[i]);
                    myCtrl.parentCtrl.SaveAnswer(code);
                }
            }

            scope.GetTemplateUrl = function () {
                return $templateCache.get('multiSelectBox.html');
            }

            $timeout(function () {
                element.html(scope.GetTemplateUrl());
                $compile(element.contents())(scope);
            });
        }

        function controller($scope) {
            var localInstance = this;

            $scope.data = {
                SelectedValues: []
            };

            $scope.OtherAnswer = {
                Value: {}
            };
        }


    }
})(angular);