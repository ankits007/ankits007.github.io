(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyOptions", ['SurveyEngine.Enums', '$timeout', '$templateCache', options]);

    function options(enums, $timeout, $templateCache) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E',
            template: $templateCache.get('surveyOptions.html')
        };
        return directive;

        function link(scope, element, attrs, cntrls) {
            var options = [];

            scope.isGridOptions = attrs.isGridOptions;

            if (angular.isUndefined(attrs.showOptionLabel))
                scope.showOptionLabel = true;
            else
                scope.showOptionLabel = attrs.showOptionLabel == 'false' ? false : true;

            //saves single choices for select control(dropdown & selectbox)
            scope.SaveSingle = function (selectedValue) {
                if (selectedValue != null || selectedValue != undefined || selectedValue != '') {
                    scope.SaveAnswer(selectedValue);
                }
            }

            //saves multiple choices for select box
            scope.onSelect = function (optionID) {
                var option = scope.variable.Options[optionID];
                if (option.IsExclusive) {

                    scope.data.SelectedValues = [];
                    scope.data.SelectedValues.push(option.Code.toString());
                } else {
                    //Check if the any exclusive is selected..remove if..
                    for (var i = 0; i < scope.ExclusiveCodes.length; i++) {
                        if (scope.data.SelectedValues.indexOf(scope.ExclusiveCodes[i].toString()) > -1) {
                            var index = scope.data.SelectedValues.indexOf(scope.ExclusiveCodes[i].toString());
                            scope.data.SelectedValues.splice(index, 1);
                        }
                    }
                }

                //Now update answers finally...
                scope.RemoveAllAnswers();
                for (var i in scope.data.SelectedValues) {

                    var code = parseInt(scope.data.SelectedValues[i]);
                    scope.SaveAnswer(code);
                }
            }
        }

        function controller($scope) {
          
        }
    }
})(angular);