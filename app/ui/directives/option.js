(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyOption", ['SurveyEngine.SurveySettings', '$templateCache', option]);

    function option(SurveySettings, $templateCache) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E',
            replace: true,
            template: $templateCache.get('option.html')
        };

        return directive;

        function link(scope, element, attrs, cntrls) {
            scope.OptionLayout = SurveySettings.Settings.InputButtonType ? SurveySettings.Settings.InputButtonType : 1;
            scope.OptionId = parseInt(attrs.optionId);

            init();

            function init() {
               // scope.otherVariableType = 3;
                if (scope.variable.Options[scope.OptionId].IsOther)
                    scope.OtherVariableType[scope.OptionId] = scope.GetOtherVariableType(scope.variable.Options[scope.OptionId].OtherVariableID) == 4? "number" : "text";
            }

            scope.SelectOption = function (Option) {
                if (parseInt(scope.variable.VariableType) == 1) {
                    scope.SingleSelectOption();
                } else {
                    if (scope.OptionLayout == 2) {
                        scope.MuiltiSelectOption(true, option);
                    } else {
                        // scope.MuiltiSelectOption(false, option);
                    }
                }
            }

            scope.SingleSelectOption = function (event) {
                if (event) {
                    event.preventDefault();
                }
                scope.SelectedValues.single = scope.variable.Options[scope.OptionId].Code;
                if (scope.SelectedValues.single != null || scope.SelectedValues.single != undefined || scope.SelectedValues.single != '') {
                    scope.SaveAnswer(scope.SelectedValues.single, undefined, '', '', scope.variable.Options[scope.OptionId].IsOther);
                    if(!scope.variable.Options[scope.OptionId].IsOther)
                        scope.HideDropDown();
                }
            }

            scope.MuiltiSelectOption = function (toggle, option, event) {
                if (event) {
                    event.stopPropagation();
                }
                scope.multiSelectOption(toggle, option.Code);
            }

            scope.$on('updateAnswers', function (event, args) {
                if (args.message == scope.variable.Name && scope.variable.Properties.ShowAs == 'checkbox') {
                    scope.SelectedValues = {};
                    var answer = scope.GetVariableAnswers(scope.variable.Name);
                    for (var ans in answer) {
                        scope.SelectedValues[answer[ans]] = true;
                    }
                }
            });

            //Save the answer of Other options in the variable specified in OtherVariableID key of Other option
            scope.saveOtherValue = function (option) {
                scope.otherVariableType = scope.GetOtherVariableType(option.OtherVariableID);
                var otherVariableName = scope.GetOtherVariableName(option.OtherVariableID);
                scope.SaveAnswer(scope.OtherAnswer.Value[option.Code], otherVariableName, scope.otherVariableType, true);
            }
        }

        function controller($scope) {

        }
    }
})(angular);