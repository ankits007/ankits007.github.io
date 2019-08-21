(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyGrid", ['SurveyEngine.Enums', 'SurveyEngine.RespondentService', '$compile', '$interpolate', '$templateCache', grid]);

    function grid(enums, respondentService, $compile, $interpolate, $templateCache) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E',
            replace: true,
            template: $templateCache.get('grid.v2.html')
        };
        return directive;

        function link(scope, element, attrs, cntrls) {

            scope.CalculateWidth = function (length) {
                return (100 / length) + '%';
            }

            scope.GetFirstKey = function (obj) {
                return Object.keys(obj)[0];
            }

            scope.$evalAsync(function () {
                var gridRows = element.find('tbody>tr');
            })
        }

        function controller($scope) {
            $scope.ChildScopes = {};
            $scope.GridAnswer = {
                Single: ''
            }

            $scope.Table = {
                Callbacks: {},
                Info: {},
                Renderers: {}
            }

            $scope.Table.Callbacks = {
                afterRenderer: afterRenderer

                // beforeKeyDown: beforeKeyDown,
                // afterChange: afterChange
            }

            $scope.Table.Renderers = {
                SingleChoiceRenderer: singleChoiceRenderer,
                MultiChoiceRenderer: multiChoiceRenderer,
                NumericRenderer: numericRenderer,
                TextboxRenderer: textboxRenderer,
                HeaderRenderer: headerRenderer,
                NumericTotalRenderer: numericTotalRenderer,
                DateTimeRenderer: dateTimeRenderer
            }
            $scope.r = window.r;

            function afterRenderer(TD, row, col, prop, value, cellProperties) {
                var cellKey = "r" + row + "c" + col,
                    cellInfo = $scope.Table.Info.cellProperties[cellKey];

                if (cellInfo) {
                    if (!cellInfo.IsHeader || $scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                        if($scope.ChildScopes[cellInfo.ID])
                        $compile(TD)($scope.ChildScopes[cellInfo.ID]);
                    } else if (cellInfo.IsConstantSum) {
                        $compile(TD)($scope);
                    }  else if (cellInfo.IsHeader && $scope.qObject.Attributes[cellInfo.ID] && $scope.qObject.Attributes[cellInfo.ID].IsOther) {
                        var attribute = $scope.qObject.Attributes[cellInfo.ID];
                        var variableName = $scope.qObject.Variables[attribute.OtherVariableID].Name;
                        $scope.OtherAttributeAnswer[attribute.ID] = respondentService.GetVariableAnswers(variableName);
                        $compile(TD)($scope);
                    }

                }
            }

            function getHeaderTmpl(cellInfo, cellKey) {
                var template = "",
                    imageTemplate = "",
                    otherTemplate = "",
                    id = null,
                    text = "",
                    contextMenu = "",
                    contextMenuConfig = "";

                switch (cellInfo.CellType) {
                    case enums.ObjectType.Group:
                        id = cellInfo.ID;
                        text = $scope.qObject.Groups[id].Text[$scope.language] || $scope.qObject.Groups[id].Text[$scope.DefaultLanguage];
                        break;

                    case enums.ObjectType.AttributeHeader:
                        id = cellInfo.ID;
                        text = $scope.qObject.AttributeHeaders[id].Text[$scope.language] || $scope.qObject.AttributeHeaders[id].Text[$scope.DefaultLanguage];
                        break;

                    case enums.ObjectType.Attribute:
                        id = cellInfo.ID;
                        text = $scope.qObject.Attributes[id].Text[$scope.language] || $scope.qObject.Attributes[id].Text[$scope.DefaultLanguage];

                        if ($scope.qObject.Attributes[id].Media[$scope.language] || $scope.qObject.Attributes[id].Media[$scope.DefaultLanguage])
                            imageTemplate = '<div style="display:block;text-align:left!important"><img src="' + ($scope.qObject.Attributes[id].Media[$scope.language] || $scope.qObject.Attributes[id].Media[$scope.DefaultLanguage]) + '?dt={{ticks}}" style="max-height:100px;max-width:100px;"/></div>';

                        if ($scope.qObject.Attributes[id].IsOther) {
                            otherTemplate = '<input class="input-txt darkBdr" type="text" ng-blur="SaveOtherAttributeValue(\'' + id + '\',\'' + $scope.qObject.Attributes[id].OtherVariableID + '\')" ng-model="OtherAttributeAnswer[\'' + id + '\']">';
                        }
                        break;

                    case enums.ObjectType.Variable:
                        id = cellInfo.ID;
                        text = $scope.qObject.Variables[id].Text[$scope.language] || $scope.qObject.Variables[id].Text[$scope.DefaultLanguage];

                        if ($scope.qObject.Variables[id].Media[$scope.language] || $scope.qObject.Variables[id].Media[$scope.DefaultLanguage])
                            imageTemplate = '<img src="' + ($scope.qObject.Variables[id].Media[$scope.language] || $scope.qObject.Variables[id].Media[$scope.DefaultLanguage]) + '?dt={{ticks}}" style="max-height:100px;max-width:100px;"/>';
                        break;

                    case enums.ObjectType.Option:
                        var variable = $scope.qObject.Variables[cellInfo.ID],
                            option = variable.Options[cellInfo.OptionCode];

                        id = cellInfo.ID + "@" + cellInfo.OptionCode;
                        text = option.Text[$scope.language] || option.Text[$scope.DefaultLanguage];

                        //  if (option.Media[$scope.language])
                        //      imageTemplate = '<img src="' + option.Media[$scope.language] + '?dt={{ticks}}" style="max-height:100px;max-width:100px;"/>';
                        break;
                }
                text = $interpolate(text)($scope);
                template = (imageTemplate != "" ? imageTemplate : "") + '<span class="survey-option-text" style="display: block; text-align: center;">' + text + '</span>';
                if (otherTemplate != '') {
                    template += otherTemplate;
                }
                return template;
            }

            function singleChoiceRenderer(instance, TD, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);

                var variable = cellProperties.variable,
                    elemKey = cellProperties.elemKey,
                    optionId = cellProperties.cellInfo.OptionID;

                TD.style["text-align"] = "-webkit-center";

                if (variable.Properties.ShowAs == "2") {
                    if (jsrcb.browser.indexOf('Microsoft Internet Explorer') >= 0) {
                        var tempHtml = '<div class="custom-dropdown" ng-mouseleave="hideDrp()" ng-mouseenter="toggleDrp()" >' +
                            '<button ng-if="SelectedTextAnswer" ng-bind="SelectedTextAnswer" class="dropbtn survey-option-text"></button>' +
                            '<button ng-if="!SelectedTextAnswer" class="dropbtn survey-option-text">Select</button>' +
                            '<div id="myDropdown" class="dropdown-content show" style="text-align: left;" ng-show="sd.show"><ul class="marginZero paddingZero">';
                    } else {
                        var tempHtml = '<select class="survey-option-text on-blur dropdown-qtable" ng-model="SelectedValues.single" ng-change="SaveAnswer(SelectedValues.single)">';
                    }

                    for (var optnIndex in variable.VariableLevelSequence) {
                        if (variable.VariableLevelSequence[optnIndex].IsOption) {
                            var option = variable.Options[variable.VariableLevelSequence[optnIndex].ID];
                            var optionText = option.Text[$scope.language] || option.Text[$scope.DefaultLanguage];
                            // tempHtml += '<option class="opt" value="' + option.Code + '">' + optionText + '</option>';
                            if (jsrcb.browser.indexOf('Microsoft Internet Explorer') >= 0) {
                                tempHtml += '<li class="custom-dropdown-list padding-5" style="list-style: none; font-size: 14px; margin-top: 0px!important" ng-click="SaveAnswer(' + option.Code + '); hideDrp()">' + optionText + '</li>';
                            } else {
                                tempHtml += '<option class="opt ng-scope" value="' + option.Code + '">' + optionText + '</option>';
                            }
                        }
                    }

                    if (jsrcb.browser.indexOf('Microsoft Internet Explorer') >= 0) {
                        tempHtml += '</ul></div>' +
                            '</div>';
                    } else {
                        tempHtml += '</select>';
                    }
                    TD.innerHTML = tempHtml;
                } else if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                    var tempHtml = "<survey-stars ng-if='!variable.Options["+optionId+"].IsExclusive' ng-click='SaveAnswer(" + parseInt(optionId) + ")' class='pos-rel' ng-mouseenter='setHoverID(" + optionId + ")' "+
                        " ng-mouseleave='removeHoverID()' option-id='" + optionId + "'></survey-stars>";
                      //for showing no answer option 
                        tempHtml += '<div ng-if="variable.Options['+optionId+'].IsExclusive" class="noAnswer">' +
                            '<survey-option option-id="{{RatingQuestionConfig.ExclusiveID}}"></survey-option>'
                        '</div>';
                    TD.innerHTML = tempHtml;
                } else {
                    var option = variable.Options[cellProperties.cellInfo.OptionID],
                        inputHtml = "";

                    if (option.Media[$scope.language] || option.Media[$scope.DefaultLanguage]) {
                        var src = (option.Media[$scope.language] || option.Media[$scope.DefaultLanguage]) + "?dt=" + (new Date()).getTime();
                        inputHtml = '<label class="imageInput"> <input type="radio" ng-click="SaveAnswer(SelectedValues.single)" ng-model="SelectedValues.single" name="' + variable.Name + '" value="' + cellProperties.cellInfo.OptionCode + '" /> <div class="input-img-mask CaptureImg" style="height:70px;width:70px;"> <img src="' + src + '" style="max-height:70px;max-width:70px;"/> <div class="image-select-ovelay"></div> </div> </label>';
                    } else {
                        inputHtml = '<label  class="form-radio display-block pos-rel" ><input type="radio"  ng-change="SaveAnswer(SelectedValues.single)" ng-model="SelectedValues.single" name="' + variable.Name + '" value="' + cellProperties.cellInfo.OptionCode + '"/>' +
                            '                <i class="form-icon"></i> ' +
                            '                <span class="survey-option-text" ng-if="showOptionLabel && variable.Options[OptionId].Text[Language] != undefined" bind-html-compile="variable.Options[OptionId].Text[Language]"></span>' +
                            '                <span class="survey-option-text" ng-if="showOptionLabel && variable.Options[OptionId].Text[Language] == undefined" bind-html-compile="variable.Options[OptionId].Text[DefaultLanguage]"></span></label>';
                    }

                    TD.innerHTML = inputHtml;
                }
            }

            function multiChoiceRenderer(instance, TD, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);

                var variable = cellProperties.variable,
                    elemKey = cellProperties.elemKey,
                    option = variable.Options[cellProperties.cellInfo.OptionID],
                    inputHtml = "";

                TD.style["text-align"] = "-webkit-center";
                if (option.Media[$scope.language] || option.Media[$scope.DefaultLanguage]) {
                    var src = (option.Media[$scope.language] || option.Media[$scope.DefaultLanguage]) + "?dt=" + (new Date()).getTime();
                    TD.innerHTML = '<label class="imageInput" style="display: block"><input id="' + elemKey + '" type="checkbox" name="' + variable.Name + '" style="margin:0" ng-change="MultiSelectOptionsinGrid(' + cellProperties.cellInfo.OptionCode + ')" ng-model="SelectedValues[' + cellProperties.cellInfo.OptionCode + ']"/><div class="input-img-mask CaptureImg" style="height:70px;width:70px;"><img style="max-height:70px;max-width:70px;" onError="this.onerror=null;this.src=\'./Project/app/Components/SE/assets/images/default.jpg\';" src="' + src + '" /><div class="image-select-ovelay"></div></div></label>'
                } else {
                    TD.innerHTML = '<label class="form-checkbox" ><label class="check"><input id="' + elemKey + '" type="checkbox" name="' + variable.Name + '" style="margin:0" ng-change="MultiSelectOptionsinGrid(' + cellProperties.cellInfo.OptionCode + ')" ng-model="SelectedValues[' + cellProperties.cellInfo.OptionCode + ']"/> <i class="form-icon"></i>  </label></label>';
                }
                // TD.innerHTML = '<label class="form-checkbox"><input type="checkbox" ng-model="SelectedValues[OptionId]"  ng-click="MuiltiSelectOption(false, variable.Options[OptionId])" /><i class="form-icon"></i> </lable>';
                // TD.innerHTML = '<label class="form-checkbox" ><label class="check"><input id="' + elemKey + '" type="checkbox" name="' + variable.Name + '" style="margin:0" ng-click="MultiSelectOptionsinGrid(' + cellProperties.cellInfo.OptionCode + ')" ng-model="SelectedValues[' + cellProperties.cellInfo.OptionCode + ']"/> <i class="form-icon"></i>  </label></label>';
            }

            function numericRenderer(instance, TD, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                TD.style["text-align"] = "-webkit-center";

                var variable = cellProperties.variable;
                $scope.IsRowTotal = cellProperties.IsRowTotal;

                if (cellProperties.isSlider) {
                    TD.classList.remove('qGrid-cell-border')
                    TD.innerHTML = '<div class="sg-container"><rzslider rz-slider-model="answerInput" rz-slider-options="{floor:' + variable.Properties.Min + ', ceil:' + variable.Properties.Max + ', step:' + variable.Properties.IncrementScaleBy + ', onChange:OnValueChange(' + variable.Name + ',answerInput,' + variable.Properties.Max + ')}"></rzslider></div>'
                } else {
                    if (cellProperties.IsRowTotal || (cellProperties.IsRowTotal == false && cellProperties.IsColumnTotal == false)) {
                        TD.innerHTML = '<span ng-if="variable.Properties.Prefix != \'\'" class="font-size survey-option-text" style="display:inline-block;float:left;width:25%">' + variable.Properties.Prefix + '</span><input ng-model="SelectedValues.single" ng-change="SetDecimalPlaces(SelectedValues.single)" ng-blur="OnBlurSave(SelectedValues.single);addVariable(' + row + ')" ng-init="addVariable(' + row + ')" class="input-txt survey-option-text paddingZero font-size" style="width: 50%;" ng-class="{\'floatLeft\':variable.Properties.Prefix != \'\' || variable.Properties.Suffix != \'\'}" type="number"/><span ng-if="variable.Properties.Suffix != \'\'" class="font-size survey-option-text" style="display:inline-block;float:right;width:23%">' + variable.Properties.Suffix + '</span><span class="error font-size-sm" ng-if="!valid && ((variable.Properties.Min && SelectedValues.single < variable.Properties.Min) || (variable.Properties.Max && SelectedValues.single > variable.Properties.Max))">(Min: ' + variable.Properties.Min + ', Max: ' + variable.Properties.Max + ')</span>';
                    } else {
                        TD.innerHTML = '<span ng-if="variable.Properties.Prefix != \'\'" class="font-size survey-option-text" style="display:inline-block;float:left;width:25%">' + variable.Properties.Prefix + '</span><input ng-model="SelectedValues.single" ng-change="SetDecimalPlaces(SelectedValues.single)" ng-blur="OnBlurSave(SelectedValues.single);addVariable(' + col + ')" ng-init="addVariable(' + col + ')" class="input-txt survey-option-text paddingZero font-size" style="width: 50%;" ng-class="{\'floatLeft\':variable.Properties.Prefix != \'\' || variable.Properties.Suffix != \'\'}" type="number"/><span ng-if="variable.Properties.Suffix != \'\'" class="font-size survey-option-text" style="display:inline-block;float:right;width:23%">' + variable.Properties.Suffix + '</span>';
                    }
                }
            }

            function textboxRenderer(instance, TD, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                TD.style["text-align"] = "-webkit-center";
                // TD.style["box-sizing"] = "inherit";
                // TD.style["max-width"] = "150px";
                TD.innerHTML = '<input ng-model="SelectedValues.single" ng-blur="OnBlurSave(SelectedValues.single)"   maxlength="{{variable.Properties.Max}}" style="width: 98%;" class="input-txt survey-option-text paddingZero" type="text"/>';
            }

            function dateTimeRenderer(instance, TD, row, col, prop, value, cellProperties) {
                Handsontable.renderers.DateRenderer.apply(this, arguments);
                TD.style["text-align"] = "-webkit-center";
                TD.innerHTML = '<input ng-model="answerInput" ng-blur="SaveAnswer(answerInput)" style="width: 90%" class="input-txt" type="date"/>';
            }

            function numericTotalRenderer(instance, TD, row, col, prop, value, cellProperties) {
                // if ($scope.Total.sum[row] == undefined) {
                //     $scope.Total.sum[row] = 0;
                // }
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                TD.style["text-align"] = "-webkit-center";

                if ($scope.IsRowTotal) {
                    TD.innerHTML = '<span style="visibility:hidden" class="font-size survey-option-text">$</span><input readonly ng-value="Total.sum[' + row + ']" style="width: 98%;" class="total-values input-txt survey-option-text paddingZero" type="number"/>';
                } else {
                    TD.innerHTML = '<span style="visibility:hidden" class="font-size survey-option-text">$</span><input readonly ng-class="{\'color-green\':Total.conditionMet['+col+']}" ng-value="Total.sum[' + col + ']" style="width: 98%;" class="total-values input-txt survey-option-text paddingZero" type="number"/>';
                }

            }


            function headerRenderer(instance, TD, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);

                TD.style["text-align"] = "-webkit-center";
                if (cellProperties.cellInfo.ClassName)
                    TD.className = cellProperties.cellInfo.ClassName;
                TD.innerHTML = getHeaderTmpl(cellProperties.cellInfo, cellProperties.cellKey);
            }

            var totalColumns = 0,
                headerGroup = [],
                headerVariable = [],
                headerAttributes = [],
                variables = []

            $scope.GridData = {
                head: [],
                row: []
            };

            $scope.QuestionType = $scope.qObject.QuestionType;

            // $scope.rowVariables = {

            // };
            $scope.TotalBox = $scope.qObject.Properties.Total ? $scope.qObject.Properties.Total : "None";
            $scope.ShowAs = $scope.qObject.Properties["ShowAs"];


            // if ($scope.qObject.Properties.Transpose == 'true')
            //     transformTransposeData();
            // else
            //     transformData();

            // function transformData() {
            //     $scope.GridData.head.push(headerGroup);
            //     $scope.GridData.head.push(headerVariable);

            //     for (var qlIndex in $scope.qObject.QuestionLevelSequence) {
            //         var qlObject = $scope.qObject.QuestionLevelSequence[qlIndex];

            //         switch (qlObject.ObjectType) {
            //             case enums.ObjectType.AttributeHeader:
            //                 var attrHeadRow = [];
            //                 attrHeadRow.push({
            //                     Id: qlObject.ID,
            //                     Property: 'AttributeHeaders'
            //                 });

            //                 for (var attrIndex in $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence) {
            //                     var attribute = $scope.qObject.Attributes[$scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence[attrIndex]],
            //                         attributeRow = [];

            //                     attributeRow.push({
            //                         Id: attribute.ID,
            //                         Property: 'Attributes',
            //                         InGroup: true
            //                     });

            //                     for (var gsqIndex in attribute.GroupSequence) {
            //                         var group = $scope.qObject.Groups[attribute.GroupSequence[gsqIndex]];

            //                         if (qlIndex == 0 && attrIndex == 0) {
            //                             headerGroup.push({
            //                                 Id: group.ID,
            //                                 Property: 'Groups'
            //                             })
            //                         }

            //                         for (var varIndex in group.VariableSequence) {
            //                             var variable = {
            //                                 Id: group.VariableSequence[varIndex],
            //                                 Property: 'Variables',
            //                                 IsLastVariable: varIndex == group.VariableSequence.length - 1
            //                             }

            //                             if (qlIndex == 0 && attrIndex == 0)
            //                                 headerVariable.push(variable);

            //                             if (attrIndex == 0)
            //                                 attrHeadRow.push({
            //                                     Property: 'Empty',
            //                                     IsLastVariable: varIndex == group.VariableSequence.length - 1
            //                                 })

            //                             attributeRow.push(variable);
            //                         }
            //                     }

            //                     if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {
            //                         attributeRow.push({
            //                             Id: attribute.ID,
            //                             Property: 'Text2',
            //                             InGroup: true,
            //                             HeaderId: qlObject.ID
            //                         });
            //                     }

            //                     if (attrIndex == 0) {
            //                         if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {
            //                             attrHeadRow.push({
            //                                 Property: 'Empty',
            //                                 IsLastVariable: varIndex == group.VariableSequence.length - 1
            //                             })
            //                             headerVariable.push({
            //                                 Id: null,
            //                                 Property: null
            //                             })
            //                         }
            //                         $scope.GridData.row.push(attrHeadRow);
            //                     }

            //                     $scope.GridData.row.push(attributeRow);
            //                 }
            //                 break;
            //             case enums.ObjectType.Attribute:
            //                 var attribute = $scope.qObject.Attributes[qlObject.ID],
            //                     attributeRow = [];

            //                 attributeRow.push({
            //                     Id: attribute.ID,
            //                     Property: 'Attributes',
            //                     InGroup: false
            //                 });

            //                 for (var gsqIndex in attribute.GroupSequence) {
            //                     var group = $scope.qObject.Groups[attribute.GroupSequence[gsqIndex]];

            //                     if (qlIndex == 0) {
            //                         headerGroup.push({
            //                             Id: group.ID,
            //                             Property: 'Groups'
            //                         })
            //                     }

            //                     for (var varIndex in group.VariableSequence) {
            //                         var variable = {
            //                             Id: group.VariableSequence[varIndex],
            //                             Property: 'Variables',
            //                             IsLastVariable: varIndex == group.VariableSequence.length - 1
            //                         }

            //                         // if($scope.QuestionType == 20 && variable.IsLastVariable){
            //                         //     variable.IsLastVariable = false;
            //                         // }

            //                         if (qlIndex == 0)
            //                             headerVariable.push(variable);

            //                         attributeRow.push(variable);
            //                     }

            //                     if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {
            //                         attributeRow.push({
            //                             Id: attribute.ID,
            //                             Property: 'Text2',
            //                             InGroup: false,
            //                             HeaderId: undefined
            //                         });

            //                         if (qlIndex == 0) {
            //                             headerVariable.push({
            //                                 Id: null,
            //                                 Property: null
            //                             })
            //                         }
            //                     }
            //                     // if (attrIndex == 0) {        
            //                     //     $scope.GridData.row.push(attrHeadRow);       
            //                     // }        
            //                     if (qlIndex == 0) {
            //                         $scope.FirstAttribute = attribute.ID;
            //                     }
            //                 }

            //                 // if (attrIndex == 0) {
            //                 //     $scope.GridData.row.push(attrHeadRow);
            //                 // }

            //                 $scope.GridData.row.push(attributeRow);
            //                 break;
            //         }
            //     }
            //     switch ($scope.qObject.QuestionType) {
            //         case enums.QuestionType.NumericGrid:
            //         case enums.QuestionType.TextGrid:
            //         case enums.QuestionType.SimpleGrid:
            //         case enums.QuestionType.Distribution:
            //             $scope.GridData.head.splice(0, 1);
            //             break;
            //     }

            //     //Repeat Headers
            //     //variable 'headersPosition' is an array which contains the positions of Headers
            //     if ($scope.qObject.Properties.RepeatHeader == 'true') {
            //         var numberOfRows = $scope.GridData.row.length;
            //         var rowPosition = 0;
            //         $scope.isHeader = new Array(numberOfRows);
            //         if (numberOfRows > 5) {
            //             var headersPosition = repeatHeaders(numberOfRows, 2);
            //         }
            //         for (var position in headersPosition) {
            //             if (rowPosition == 0)
            //                 rowPosition += headersPosition[position]
            //             else
            //                 rowPosition += headersPosition[position] + 1;
            //             if (rowPosition <= numberOfRows) {
            //                 $scope.isHeader[rowPosition] = true;
            //                 var obj = {
            //                     Property: 'Empty'
            //                 }
            //                 if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid) {
            //                     var rowData = angular.copy($scope.GridData.head[0]);
            //                 } else {
            //                     var rowData = angular.copy($scope.GridData.head[1]);
            //                 }
            //                 rowData.splice(0, 0, obj);
            //                 $scope.GridData.row.splice(rowPosition, 0, rowData);
            //             }
            //         }
            //     }

            //     function repeatHeaders(rows, dividingNumber) {
            //         var newRowPositions = [];
            //         var firstPosition = Math.ceil(rows / dividingNumber);
            //         if (firstPosition > 5) {
            //             newRowPositions = repeatHeaders(rows, ++dividingNumber);
            //         } else {
            //             for (var i = 0; i < dividingNumber - 1; i++) {
            //                 newRowPositions.push(Math.ceil(rows / dividingNumber));
            //             }
            //         }
            //         return newRowPositions;
            //     }

            //     //For Total column in the Constant Sum Grid
            //     if ($scope.qObject.Properties["ShowAs"] == enums.ShowAsProperty.ConstantSum) {
            //         if ($scope.TotalBox == 'RowTotal') {
            //             for (var row in $scope.GridData.row) {
            //                 if ($scope.GridData.row[row][0].Property != "AttributeHeaders")
            //                     $scope.Total.sum.push(0);
            //                 else
            //                     $scope.Total.sum.push(-1);
            //             }
            //         } else {
            //             for (var header in $scope.GridData.head[0]) {
            //                 $scope.Total.sum.push(0);
            //             }
            //         }
            //     }
            // }

            function transformTransposeData() {
                $scope.GridData.head.push(headerAttributes); //Attributes to be shown as Headers in case of transpose grid 
                $scope.OptionsVariable = {};

                for (var qIndex in $scope.qObject.QuestionLevelSequence) {
                    var qlObject = $scope.qObject.QuestionLevelSequence[qIndex];
                    switch (qlObject.ObjectType) {
                        case enums.ObjectType.AttributeHeader:
                            for (var attribute in $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence) {
                                var attrId = $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence[attribute];
                                var attrObject = {
                                    Id: attrId,
                                    Property: "Attributes"
                                }
                                headerAttributes.push(attrObject);
                                for (var group in $scope.qObject.Attributes[attrId].GroupSequence) {
                                    var groupVariables = [];
                                    var groupId = $scope.qObject.Attributes[attrId].GroupSequence[group];
                                    for (var item in $scope.qObject.Groups[groupId].VariableSequence) {
                                        var varId = $scope.qObject.Groups[groupId].VariableSequence[item];
                                        var varObject = {
                                            Id: varId,
                                            Property: "Variables"
                                        }

                                        if ($scope.qObject.QuestionType == 11) {
                                            if (qIndex == 0 && attribute == 0) {
                                                $scope.GridData.row.push(variables);
                                                $scope.OptionsVariable = varObject;
                                            }
                                            variables.push(varObject);
                                        } else {
                                            //For grids other than Simple Grid
                                            //Number of Rows will be equal to number of columns

                                            if (item == 0 && attribute == 0) {
                                                for (var rowVars in $scope.qObject.Groups[groupId].VariableSequence) {
                                                    $scope.GridData.row.push([]);
                                                }
                                            }
                                            $scope.GridData.row[item].push(varObject);
                                            if ($scope.qObject.Properties["ShowAs"] == enums.ShowAsProperty.ConstantSum) {
                                                if ($scope.TotalBox == 'RowTotal') {
                                                    for (var header in $scope.GridData.head[0]) {
                                                        $scope.Total.sum.push(0);
                                                    }
                                                } else {
                                                    for (var row in $scope.GridData.row) {
                                                        $scope.Total.sum.push(0);
                                                    }
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                            break;

                        case enums.ObjectType.Attribute:
                            var attrObject = {
                                Id: qlObject.ID,
                                Property: "Attributes"
                            }
                            headerAttributes.push(attrObject);

                            for (var group in $scope.qObject.Attributes[qlObject.ID].GroupSequence) {
                                var groupVariables = [];
                                var groupId = $scope.qObject.Attributes[qlObject.ID].GroupSequence[group];
                                var groupObj = {
                                    Id: groupId,
                                    Property: "Groups"
                                }
                                for (var item in $scope.qObject.Groups[groupId].VariableSequence) {
                                    var varId = $scope.qObject.Groups[groupId].VariableSequence[item];
                                    var varObject = {
                                        Id: varId,
                                        Property: "Variables"
                                    }

                                    if ($scope.qObject.QuestionType == 11) {
                                        if (qIndex == 0) {
                                            $scope.GridData.row.push(variables);
                                        }
                                        if (qIndex == 0) {
                                            $scope.OptionsVariable = varObject;
                                        }
                                        variables.push(varObject);
                                    } else {
                                        if (item == 0 && qIndex == 0) {
                                            for (var variable in $scope.qObject.Groups[groupId].VariableSequence) {
                                                $scope.GridData.row.push([]);
                                            }
                                        }
                                        $scope.GridData.row[item].push(varObject);
                                    }

                                }

                            }

                            break;
                    }
                }
            }

            function getRatingHtml(variable, optionId) {
                var tempHtml = "";
                if ($scope.qObject.Properties.ShapeType == '7') {
                    tempHtml += "<span class='padding-5 pull-left'>" +
                        "<img src='Project/app/Components/Surveybuilder/" + variable.Options[optionId].Media['en-us'] + "'" +
                        "style='width:40px;height:40px;margin-right:10px'/>" +
                        "</span>";
                } else if ($scope.qObject.Properties.ShapeType == '8') {
                    tempHtml += "<div class='none-div text-center'>" +
                        "<span class='none-label'>" + optionId + "</span>" +
                        "</div>";
                } else {
                    tempHtml = "<span class='padding-5 pull-left width-40'><svg role='img' class='stkv-c-hoverable-icon stkv-us-secondary--fill' viewBox='0 0 32 32'>" +
                        "<svg width='32' height='32' viewBox='0 0 32 32' class='stkv-c-hoverable-icon__svg stkv-c-hoverable-icon__svg--outline'>";
                    switch ($scope.qObject.Properties.ShapeType) {
                        case '1':
                        case undefined:
                            tempHtml += "<path d='M0 11.625h12.219q.469-1.469 1.422-4.375T16 0q.469 1.438 1.422 4.344t2.359 7.281H32q-1.219.875-3.688 2.672t-6.188 4.516q.469 1.438 1.406 4.359t2.344 7.266q-1.219-.906-3.688-2.703t-6.188-4.484q-1.219.906-3.688 2.703t-6.188 4.484Q6.591 29 7.528 26.079t2.344-7.266q-1.219-.906-3.688-2.703t-6.188-4.484zm3.938 1.25q.938.688 2.813 2.047t4.656 3.422q-.344 1.063-1.063 3.25t-1.813 5.469q.938-.656 2.813-2.016T16 21.656q.938.656 2.813 2.016t4.656 3.391q-.344-1.094-1.063-3.281t-1.813-5.438l2.813-2.063 4.656-3.406h-9.219q-.344-1.094-1.063-3.281t-1.781-5.469q-.344 1.094-1.063 3.281t-1.781 5.469H3.936z'></path>";
                            break;
                        case '2':
                            tempHtml += '<path d="M0 8.313q0-.125.016-.234t.016-.203V7.47q.156-1.594.844-2.922t1.875-2.391Q3.939 1.063 5.329.532T8.313.001q1.281 0 2.453.344t2.203 1.063q1.031.688 1.797 1.609T16 5.095q.5-1.156 1.25-2.078t1.781-1.609Q20.094.689 21.25.345t2.438-.344q1.594 0 2.984.531t2.578 1.625q1.219 1.063 1.891 2.391t.828 2.922q.031.094.031.203v.641q0 1.031-.172 2.047t-.516 1.984-.797 1.844-1.047 1.688q-.594.781-1.25 1.547t-1.375 1.516q-.719.719-1.469 1.438t-1.563 1.406-1.578 1.359-1.484 1.328q-.719.625-1.406 1.297t-1.313 1.391q-.344.375-.641.734t-.547.703-.453.688-.391.656q-.344-.656-.844-1.359t-1.156-1.422q-.625-.719-1.313-1.406t-1.438-1.313q-.719-.625-1.469-1.281t-1.563-1.344q-.813-.719-1.578-1.438t-1.484-1.438q-.719-.75-1.375-1.516t-1.25-1.547q-.563-.813-1.016-1.703t-.797-1.859q-.188-.5-.313-.984t-.219-.984T.042 9.33t-.047-1.016zm1.281 0q0 1.031.203 2.031t.578 1.969q.406.969.906 1.844t1.094 1.625q.625.75 1.344 1.516t1.531 1.578 1.625 1.531 1.594 1.375q.781.625 1.563 1.344t1.594 1.531q.844.781 1.516 1.531t1.172 1.438q.531-.688 1.203-1.438t1.484-1.531q.813-.813 1.609-1.531t1.578-1.344q.781-.656 1.578-1.375t1.609-1.531q.844-.813 1.563-1.578t1.313-1.516q.625-.75 1.125-1.625t.875-1.844q.406-.969.594-1.969t.188-2.031v-.547l-.031-.141q-.125-1.375-.703-2.5t-1.578-2.031-2.172-1.359-2.547-.453q-1.094 0-2.078.297t-1.859.891-1.516 1.375-1.047 1.75q-.188.469-.484 1.172t-.703 1.641q-.125-.344-.422-1.047t-.766-1.766q-.375-.969-1.016-1.75T12.251 2.47q-.875-.594-1.859-.891t-2.078-.297q-1.344 0-2.531.453T3.595 3.094 2.032 5.125t-.719 2.5v.141l-.031.172v.375z"></path>';
                            break;
                        case '3':
                            tempHtml += '<path d="M.625 21.625q0-1.25.313-2.453t.875-2.266l8.594-12.719 8.594 12.719q.563 1.063.875 2.266t.313 2.453q0 4.094-2.875 7t-6.906 2.906-6.906-2.906-2.875-7zm1.094 0q0 .906.172 1.766t.516 1.672q.313.781.781 1.484t1.094 1.328q.594.594 1.281 1.063t1.469.813 1.641.516 1.734.172 1.719-.172 1.656-.516q.75-.344 1.453-.813t1.297-1.063q.594-.625 1.063-1.328t.813-1.484q.344-.813.516-1.672t.172-1.766q0-.563-.078-1.109t-.203-1.078q-.125-.5-.313-1t-.438-.969L10.408 6.156 2.752 17.5q-.25.438-.438.938t-.313 1q-.156.531-.219 1.078t-.063 1.109zm14.844-11q.063-.156.156-.328t.156-.328l6.063-8.875 6.031 8.875q.375.719.594 1.547t.219 1.703q0 2.844-2.016 4.875t-4.828 2.031q-.344 0-.688-.031T21.594 20q-.156-1-.484-1.953t-.797-1.828zm1.25-.094l3.406 5.094.031.031.031.063q.438.781.734 1.609T22.499 19q.125.031.219.031h.219q1.125 0 2.188-.438T27 17.343q.813-.844 1.25-1.906t.438-2.219q0-.688-.172-1.391t-.484-1.297l-5.094-7.5z"></path>';
                            break;
                        case '4':
                            tempHtml += '<path d="M0 30.063V17.907q0-.281.094-.5t.281-.406.422-.281.484-.094h3.844q.281 0 .5.094t.406.281.281.406.094.5v12.156q0 .281-.094.516t-.281.422-.406.266-.5.078H1.281q-.25 0-.484-.078t-.422-.266-.281-.422T0 30.063zm1.281 0h3.844V17.907H1.281v12.156zm6.407.343V17.281h.625q.219 0 .438-.078t.438-.234q.25-.188.516-.453t.578-.609q.313-.375.656-.938t.719-1.281q.375-.75.766-1.625t.797-1.906q.094-.219.219-.438t.281-.406q.188-.219.328-.375t.266-.25l.141-.141.172-.141q.125-.094.234-.172t.234-.172q.375-.313.688-.625t.531-.656q.25-.375.484-.953t.422-1.359q.094-.375.188-.828t.156-.953q.063-.531.109-1.094t.078-1.188q0-.188.156-.281T18.377 0q.063-.031.109-.031h.078q.281 0 .594.078t.688.234q.219.094.406.203t.344.266q.188.125.359.297t.297.359q.375.5.578 1.156t.266 1.5q.016.281.016.563 0 .547-.078 1.063-.125.781-.438 1.5-.031.063-.219.469t-.563 1.125q-.375.688-.625 1.297t-.406 1.109q-.063.25-.094.484t-.031.422.047.344.109.313q1.813-.094 3.25-.109h.563q1.094 0 1.938.047 1.094.031 1.797.125t1.047.25q.344.125.703.469t.734.906q.375.531.547.984t.141.828q0 .125-.125.359t-.375.578q-.25.313-.391.531t-.172.344q0 .188.125.5t.375.75q.281.438.438.75t.156.469-.172.422-.516.672q-.344.375-.516.625t-.172.406.078.453.234.734q.188.438.266.734t.078.453q0 .25-.203.594t-.609.75-.641.656-.297.344q-.031.125-.047.375t-.016.625-.016.625-.047.375q-.125.281-.406.609t-.719.703-.797.625-.672.344q-.594.188-1.563.266T21.468 32t-2.609-.031-2.328-.125l-.875-.078-1.25-.109q-.844-.156-2.516-.469t-4.203-.781zm1.281-1.062q.688.125 2.078.391t3.484.641h10.594q.219-.094.453-.281t.516-.438.453-.453.234-.359l-.016-.047-.016-.141-.016-.25-.016-.375q0-.188.016-.359t.047-.328.078-.297.109-.266q.094-.188.313-.438t.531-.594q.344-.313.531-.516t.219-.266q0-.031-.063-.188t-.188-.406q-.125-.281-.219-.703t-.188-.953v-.156q.031-.125.047-.234t.047-.234.078-.219.109-.188q.063-.125.141-.234t.172-.234.203-.25.234-.25l.156-.156q.063-.063.078-.094l.016-.031q0-.031-.047-.109t-.141-.172q-.063-.094-.109-.188t-.109-.188-.141-.234-.172-.359l-.141-.484q-.078-.265-.141-.547v-.25q.031-.063.047-.125t.016-.094q.031-.063.047-.125t.016-.125q.125-.313.25-.547t.25-.359q.125-.156.234-.25t.203-.094v-.109l-.031-.047q-.063-.25-.156-.453t-.219-.391-.297-.375-.359-.344q0-.031-.016-.047l-.016-.016q0-.031-.016-.031h-.047q-.031-.031-.047-.063t-.047-.031q0-.031-.016-.047t-.047-.016q-.125-.063-.484-.109t-.953-.078q-.563-.031-1.328-.047t-1.766-.016h-.938l-.906.031h-.859l-.859.031q-.188-.094-.469-.25t-.688-.375q-.031-.094-.063-.172t-.063-.172l-.063-.188-.063-.156q0-.094-.016-.172t-.047-.141v-.313q0-.438.094-.906t.281-.969q.188-.531.438-1.078t.563-1.109q.156-.281.266-.516t.203-.391q.094-.188.141-.297t.047-.141q.125-.281.203-.547t.141-.516q.063-.281.078-.563t.016-.594q0-.375-.031-.719t-.125-.625q-.063-.281-.188-.531t-.281-.438q-.094-.156-.234-.281t-.297-.219q-.156-.125-.328-.203t-.391-.109q-.125 1.688-.391 2.953t-.641 2.109q-.375.813-.891 1.484t-1.172 1.203q-.313.219-.547.422t-.422.391q-.156.188-.281.375t-.188.344q-.688 1.75-1.391 3.125t-1.391 2.375q-.656.969-1.328 1.563t-1.359.781v10.875zm19.594-4.313q.031-.031.031-.047v-.078l-.016.016-.016.047v.063zm.625-4.593l.063.125h.031v-.094q.031-.063.031-.109v-.047l-.031.031zm.125-.157z"></path>';
                            break;
                        case '5':
                            tempHtml += '<path d="M0 7.688q0-.656.234-1.234t.703-1.047 1.031-.703 1.219-.234 1.234.234 1.047.703.703 1.047.234 1.234q0 .281-.047.547t-.141.516-.234.5-.359.469q.563.625 1.406 1.547t1.938 2.172q.219-.906.625-2.688t1-4.469q-.5-.188-.906-.484t-.719-.703q-.313-.438-.484-.906t-.172-1q0-.656.234-1.219T9.249.939q.5-.469 1.063-.703t1.219-.234 1.219.234 1.031.703.703 1.031.234 1.219q0 .406-.094.797t-.313.766q-.219.344-.484.641t-.609.516q.469 1.188 1.172 3t1.609 4.219q.344-.906 1.047-2.719t1.734-4.5q-.313-.219-.594-.516t-.5-.641q-.188-.375-.297-.766t-.109-.797q0-.656.234-1.219t.703-1.031 1.031-.703 1.219-.234 1.234.234 1.047.703.703 1.031.234 1.219q0 .531-.156 1t-.5.906q-.313.406-.719.703t-.906.484q.281 1.188.688 2.969t.938 4.188q.438-.469 1.266-1.406t2.078-2.313q-.188-.219-.344-.469t-.25-.5-.141-.516-.047-.547q0-.656.234-1.234t.703-1.047q.5-.469 1.063-.703t1.219-.234 1.219.234 1.031.703.703 1.047.234 1.234q0 .625-.219 1.172t-.688 1.016q-.438.469-.969.719t-1.188.281q-.594 1.688-1.516 4.25t-2.141 6H6.714q-.438-1.281-1.359-3.844t-2.297-6.406q-.625-.031-1.172-.281t-.984-.719T.23 8.86t-.234-1.172zm1.281 0q0 .375.141.703T1.813 9q.281.281.594.422t.688.172h.375l.5.031.016.016q.016.016.016.047.094-.094.266-.297t.422-.484q.125-.156.203-.297t.109-.266q.063-.156.094-.328t.031-.328q0-.406-.141-.75t-.422-.625-.625-.422-.75-.141q-.375 0-.719.141t-.625.422-.422.625-.141.75zM3.969 9.75q.031 0 .047.031l.047.094q0-.031-.016-.078T4 9.688v.016q0 .016-.031.047zm.094.125q.438 1.25 1.328 3.734t2.234 6.234h16.75q.469-1.25 1.359-3.75t2.203-6.219q-.688.781-2.094 2.344t-3.5 3.906l-.844-3.75-1.438-6.25q-.5 1.313-1.516 3.953t-2.547 6.578q-.5-1.313-1.516-3.953t-2.547-6.578l-.844 3.75-1.438 6.25q-.688-.781-2.094-2.344t-3.5-3.906zM6.719 27.5v-4.469h18.563V27.5H6.719zM8 26.219h16v-1.906H8v1.906zM9.594 3.188q0 .313.094.609t.281.547q.219.25.453.422t.516.266q.125.031.328.094t.516.156l.281-.188.469-.281q.25-.156.422-.328t.266-.359q.125-.219.172-.453t.047-.484q0-.406-.141-.734t-.422-.609-.609-.422-.734-.141-.75.141-.625.422-.422.609-.141.734zm2.062 2.187q.031.094.109.281t.172.469q.031-.094.063-.281t.094-.469q-.031-.031-.109-.047t-.203-.047l-.031.031-.094.063zm6.907-2.187q0 .25.063.484t.156.453q.125.188.297.359t.391.328q.094.063.281.172t.469.297q.125-.031.328-.094t.516-.156q.281-.094.531-.266t.438-.422.281-.547.094-.609q0-.406-.141-.734t-.422-.609-.625-.422-.75-.141q-.375 0-.719.141t-.625.422-.422.609-.141.734zm1.343 2.187q.031.094.063.281t.094.469q.031-.094.109-.281t.172-.469q0-.031-.031-.047l-.094-.047q-.031 0-.109.031t-.203.063zm6.969 2.313q0 .156.031.328t.094.328q.063.125.141.266t.172.297q.125.125.297.328t.391.453l.016-.016q.016-.016.016-.047.125 0 .344-.016t.531-.016q.375-.031.703-.172t.578-.422q.281-.281.406-.609t.125-.703q0-.406-.141-.75t-.422-.625-.609-.422-.734-.141-.75.141-.625.422-.422.625-.141.75zm1.063 2.187q.031-.031.047-.063t.047-.063v-.016q0-.016-.031-.047 0 .031-.016.078t-.047.109z"></path>';
                            break;
                        case '6':
                            tempHtml += '<path d="M0 20.125q0-2.313 1.203-4.203t3.109-2.828q-.094-.406-.141-.844t-.047-.844q0-3.188 2.203-5.438t5.328-2.25q2.031 0 3.75 1.031t2.688 2.688q.531-.219 1.109-.328T20.405 7q2.563 0 4.406 1.875t1.844 4.5q0 .344-.031.688t-.094.656q2.313.375 3.891 2.219t1.578 4.313q0 2.719-1.891 4.656t-4.516 1.969v.094H7.029v-.031q-2.938-.25-4.984-2.5t-2.047-5.313zm1.25 0q0 1.25.438 2.406t1.281 2.094q.813.875 1.891 1.422t2.266.641l.281.031h16.938v-.063l1.219-.031q1.031 0 1.984-.406t1.672-1.156q.75-.781 1.141-1.75t.391-2.063q0-.969-.328-1.875t-.953-1.625q-.594-.719-1.422-1.188t-1.734-.625l-1.281-.188.25-1.281q.063-.281.094-.547t.031-.547q0-1.031-.391-1.969T23.94 9.749q-.719-.75-1.641-1.125t-1.891-.375q-.5 0-.953.078t-.891.266l-1 .406-.531-.938q-.438-.688-1-1.266t-1.25-.984q-.719-.406-1.516-.625t-1.609-.219q-1.25 0-2.406.484T7.221 6.842q-.438.438-.781.953t-.563 1.078q-.25.594-.375 1.234t-.125 1.297q0 .344.031.703t.125.703l.219.969-.875.406q-.813.406-1.469 1.016t-1.156 1.391-.75 1.688-.25 1.844z"></path>';
                            break;
                    }
                    tempHtml += "</svg></svg></span>";
                }
                return tempHtml;
            }

            function populateHeaders(attribute) {

            }
        }
    }
})(angular);