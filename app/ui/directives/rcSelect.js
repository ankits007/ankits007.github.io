(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("rcSelect", ['SurveyEngine.RespondentService', 'SurveyEngine.SurveySettings', '$compile', rcSelect]);

    function rcSelect(respondentService, SurveySettings, $compile) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E'
        };

        return directive;

        function link(scope, element, attrs, cntrls) {
            // scope.SelectedValues.single = 1;
            generateHTML();


            function generateHTML() {

                var temp = '';

                if (scope.displayType == "selectbox") {
                    temp += '<select size="5" ng-model="SelectedValues.single" ng-change="SaveSingle(SelectedValues.single)"  class="dropdown survey-option-text"  style="border-bottom:0px!important;background:transparent"><option style="display:none" value="0">Select</option>';
                }
                else if (scope.displayType == "dropdown") {
                    temp += '<select ng-model="SelectedValues.single" ng-change="SaveSingle(SelectedValues.single)"  class="dropdown survey-option-text select-box"><option style="display:none" value="0">Select</option>';
                }
                else {
                    temp += '<select multiple size="5" ng-model="data.SelectedValues" class="dropdown survey-option-text" style="background:transparent">';
                }

                for (var key in scope.variable.VariableLevelSequence) {
                    var item = scope.variable.VariableLevelSequence[key];
                    if (item.IsOption) {
                        var optionCode = scope.variable.Options[item.ID].Code;

                        if (scope.displayType == "multiselectbox") {
                            if (scope.variable.Options[item.ID].Text[scope.Language])
                                temp += '<option class="opt pos-rel" ng-disabled="data.SelectedValues.indexOf(\'' + optionCode + '\') == -1 && data.SelectedValues.length == MaxChoices" ng-click="onSelect(' + item.ID + ')" value="' + optionCode + '">' + scope.variable.Options[item.ID].Text[scope.Language] + '</option>';
                            else
                                temp += '<option class="opt pos-rel" ng-disabled="data.SelectedValues.indexOf(\'' + optionCode + '\') == -1 && data.SelectedValues.length == MaxChoices" ng-click="onSelect(' + item.ID + ')" value="' + optionCode + '">' + scope.variable.Options[item.ID].Text[scope.DefaultLanguage] + '</option>';
                        } else {
                            if (scope.variable.Options[item.ID].Text[scope.Language])
                                temp += '<option class="opt" value="' + optionCode + '">' + scope.variable.Options[item.ID].Text[scope.Language] + '</option>';
                            else
                                temp += '<option class="opt" value="' + optionCode + '">' + scope.variable.Options[item.ID].Text[scope.DefaultLanguage] + '</option>';
                        }
                    }
                    else {
                        temp += '<optgroup class="opt" label="' + scope.variable.OptionGroups[item.ID].Text[scope.Language] + '">';
                        for (var index in scope.variable.OptionGroups[item.ID].OptionSequence) {
                            var optionCode = scope.variable.OptionGroups[item.ID].OptionSequence[index];

                            if (scope.displayType == "multiselectbox") {
                                if (scope.variable.Options[optionCode].Text[scope.Language])
                                    temp += '<option class="opt" ng-disabled="data.SelectedValues.indexOf(\'' + optionCode + '\') == -1 && data.SelectedValues.length == MaxChoices" ng-click="onSelect(' + optionCode + ')"  value="' + optionCode.toString() + '">' + scope.variable.Options[optionCode].Text[scope.Language] + '</option>';
                                else
                                    temp += '<option class="opt" ng-disabled="data.SelectedValues.indexOf(\'' + optionCode + '\') == -1 && data.SelectedValues.length == MaxChoices" ng-click="onSelect(' + optionCode + ')"  value="' + optionCode.toString() + '">' + scope.variable.Options[optionCode].Text[scope.DefaultLanguage] + '</option>';

                            } else {
                                if (scope.variable.Options[optionCode].Text[scope.Language])
                                    temp += '<option class="opt" value="' + optionCode.toString() + '">' + scope.variable.Options[optionCode].Text[scope.Language] + '</option>';
                                else
                                    temp += '<option class="opt" value="' + optionCode.toString() + '">' + scope.variable.Options[optionCode].Text[scope.DefaultLanguage] + '</option>';

                            }
                        }
                        temp += '</optgroup>';
                    }
                }

                temp += "</select>";

                var temp2 = $compile(angular.element(temp))(scope);
                element.append(temp2);
            }

        }

        function controller($scope) {
            $scope.SelectedValues.single = '0';
        }
    }
})(angular);