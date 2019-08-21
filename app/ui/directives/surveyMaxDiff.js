(function (angular) {
    "use strict";

    angular
        .module('SurveyEngine')
        .directive('surveyMaxdiff', ['SurveyEngine.Enums', 'SurveyEngine.RespondentService', '$templateCache', surveyMaxdiff]);

    function surveyMaxdiff(enums, respondentService, $templateCache) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            require: ['surveyMaxdiff', '^surveyQuestion'],
            restrict: 'E',
            replace: true,
            template: $templateCache.get('maxdiff.html')
        }

        return directive;

        function link(scope, element, attrs, cntrls) {
            scope.answers = [];

            var parentCntrol = cntrls[1];

            scope.SaveAnswer = function (variableId, variableName, variableType, optionId) {
                scope.answers = [];
                scope.SelectedValues.single[variableId] = optionId;
                for (var variable in scope.SelectedValues.single) {
                    if ((variable != variableId) && (scope.SelectedValues.single[variable] == optionId)) {
                        scope.SelectedValues.single[variable] = 0;
                        var answers = [];
                        parentCntrol.SaveAnswer(scope.qObject.Variables[variable].Name, scope.qObject.Variables[variable].VariableType, answers, true, true);
                    }
                }

                if (scope.SelectedValues.single[variableId] != undefined || scope.SelectedValues.single[variableId] != null) {
                    scope.answers.push(scope.SelectedValues.single[variableId]);
                    parentCntrol.SaveAnswer(variableName, variableType, scope.answers, true, true);
                }
            }
        }

        function controller($scope) {
            $scope.ticks = (new Date()).getTime();
            $scope.SelectedValues = {'single':{}};

            var header = new Array(3);

            $scope.GridData = {
                head: [],
                row: []
            }

            $scope.SelectedValues = {
                single: {}
            }

            $scope.PopulateAnswer = function (variable) {
                var answer = respondentService.GetVariableAnswers(variable.Name);
                if (answer && answer.length != 0) {
                    $scope.SelectedValues.single[variable.ID] = answer[0].toString();
                }
            }

            $scope.GridData.head.push(header);

            transformData();

            function transformData() {
                for (var qlIndex in $scope.qObject.QuestionLevelSequence) {
                    var qlObject = $scope.qObject.QuestionLevelSequence[qlIndex];

                    switch (qlObject.ObjectType) {
                        case enums.ObjectType.AttributeHeader:
                            var attrHeadRow = new Array(3);
                            attrHeadRow[1] = {
                                Id: qlObject.ID,
                                Property: 'AttributeHeaders'
                            };

                            for (var attrIndex in $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence) {
                                var attribute = $scope.qObject.Attributes[$scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence[attrIndex]],
                                    attributeRow = new Array(3);

                                attributeRow[1] = {
                                    Id: attribute.ID,
                                    Property: 'Attributes',
                                    InGroup: true,
                                    HeaderId: qlObject.ID,
                                    IsLastVariable: true
                                };

                                for (var gsqIndex in attribute.GroupSequence) {
                                    var group = $scope.qObject.Groups[attribute.GroupSequence[gsqIndex]];
                                    var variable = $scope.qObject.Variables[group.VariableSequence[0]];
                                    $scope.PopulateAnswer(variable);

                                    for (var opIndex = 0; opIndex < 2; opIndex++) {
                                        var option = variable.Options[variable.VariableLevelSequence[opIndex].ID];

                                        if (qlIndex == 0 && attrIndex == 0) {
                                            header[2 * opIndex] = {
                                                Id: option.Code.toString(),
                                                Type: "text",
                                                Property: 'none',
                                                Text: option.Text[$scope.language],
                                                Media: option.Media[$scope.language]
                                            }
                                        }

                                        attributeRow[2 * opIndex] = {
                                            Id: option.Code.toString(),
                                            Type: "radio",
                                            Property: 'none',
                                            parentId: variable.ID
                                        }
                                    }
                                }

                                if (attrIndex == 0) {
                                    $scope.GridData.row.push(attrHeadRow);
                                }

                                if (attrIndex == 0 && qlIndex == 0)
                                    $scope.FirstAttribute = attribute.ID;

                                $scope.GridData.row.push(attributeRow);
                            }
                            break;
                        case enums.ObjectType.Attribute:
                            var attribute = $scope.qObject.Attributes[qlObject.ID],
                                attributeRow = new Array(3);

                            attributeRow[1] = {
                                Id: attribute.ID,
                                Property: 'Attributes',
                                InGroup: false,
                                HeaderId: null,
                                IsLastVariable: true
                            };

                            for (var gsqIndex in attribute.GroupSequence) {
                                var group = $scope.qObject.Groups[attribute.GroupSequence[gsqIndex]];

                                var variable = $scope.qObject.Variables[group.VariableSequence[0]];
                                $scope.PopulateAnswer(variable);

                                for (var opIndex = 0; opIndex < 2; opIndex++) {
                                    var option = variable.Options[variable.VariableLevelSequence[opIndex].ID];

                                    if (qlIndex == 0) {
                                        header[2 * opIndex] = {
                                            Id: option.Code.toString(),
                                            Type: "text",
                                            Property: 'none',
                                            Text: option.Text[$scope.language],
                                            Media: option.Media[$scope.language]
                                        }
                                    }

                                    attributeRow[2 * opIndex] = {
                                        Id: option.Code.toString(),
                                        Type: "radio",
                                        Property: 'none',
                                        parentId: variable.ID
                                    }
                                }
                            }

                            $scope.GridData.row.push(attributeRow);
                            break;
                    }
                }

            }
        }
    };
})(angular);