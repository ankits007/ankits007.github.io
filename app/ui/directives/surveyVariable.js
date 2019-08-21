(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyVariable", ['SurveyEngine.Enums', 'SurveyEngine.RespondentService', '$timeout', 'SurveyEngine.NavigatorService', 'SurveyEngine.SurveySettings', 'SurveyEngine.ValidatorService', variable]);

    function variable(enums, respondentService, $timeout, NavigatorService, surveySettings, ValidatorService) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E',
            require: ['surveyVariable', '?^surveyQuestion'],
            transclude: true,
            scope: {
                variable: '=',
                properties: '=?'
            }
        };
        return directive;


        function link(scope, element, attrs, cntrls, transclude) {
            var plainElement = element[0];
            scope.isMobileDevice = window.jsrcb.isMobile;
            scope.Language = '';
            scope.valid = true;
            scope.showFallBackDate = false;
            scope.ExclusiveCodes = [];
            scope.defaultOptionCode = [];
            scope.ExclusiveAcrossRowsCodes = [];
            // scope.rowVariables = {};
            scope.IsSelected = [];

            scope.Hints = surveySettings.GetHints();
            scope.Placeholders = surveySettings.GetPlaceholders();
            scope.Buttons = surveySettings.GetButtons();

            scope.RatingQuestionConfig = {};
            scope.hover = {};
            scope.OtherVariableType = {};
            var myCntrl = cntrls[0],
                parentCtrl = cntrls[1];
            scope.VerifiedQuestionOTPMap = ValidatorService.VerifiedQuestionOTPMap;
            scope.qID = parentCtrl.qObject.ID;
            if (parentCtrl) {
                scope.MultiSelectOptionsinGrid = multiSelectOptionsInGrid;
                scope.SaveSingleChoiceGridAnswer = saveSingleChoiceGridAnswer;

                var showAs = scope.variable.Properties.ShowAs;
                scope.MaxChoices = parseInt(parentCtrl.qObject.Properties.MaxChoices);
                scope.MinChoices = parseInt(parentCtrl.qObject.Properties.MinChoices);

                if (showAs != undefined) {
                    switch (showAs.toString()) {
                        case enums.ShowAsProperty.Radio.toString():
                            scope.displayType = "radio";
                            break;
                        case enums.ShowAsProperty.DropBox.toString():
                            scope.displayType = "dropdown";
                            break;
                        case enums.ShowAsProperty.SelectBox.toString():
                            scope.displayType = "selectbox";
                            break;
                        case enums.ShowAsProperty.MultiSelectBox.toString():
                            scope.displayType = "multiselectbox";
                            break;
                        case enums.ShowAsProperty.SingleSelectImage.toString():
                            scope.displayType = "singleselectimage";
                            break;
                        case enums.ShowAsProperty.MultipleSelectImage.toString():
                            scope.displayType = "multipleselectimage";
                            break;
                        case enums.ShowAsProperty.SingleSelectLonglist.toString():
                        case enums.ShowAsProperty.MultiSelectLonglist.toString():
                            scope.displayType = "longlist";
                            break;
                    }
                }
                if (scope.variable.VariableType == enums.VariableType.DateTime) {
                    if (scope.variable.Properties.StartDate) {
                        scope.variable.Properties.StartDate = new Date(new Date(scope.variable.Properties.StartDate).setHours(12));
                        scope.localStartDateString = scope.variable.Properties.StartDate.toLocaleDateString();
                    }
                    if (scope.variable.Properties.EndDate) {
                        scope.variable.Properties.EndDate = new Date(new Date(scope.variable.Properties.EndDate).setHours(12));
                        scope.localEndDateString = scope.variable.Properties.EndDate.toLocaleDateString();
                    }
                }

                setDisplayedValues();
                scope.answers = respondentService.GetVariableAnswers(scope.variable.Name);
                scope.SelectedValues = {
                    single: scope.answers[0]
                };
                scope.SaveAnswer = SaveAnswer;
                scope.RemoveAllAnswers = RemoveAllAnswers;
                scope.findSpecialCodes = findSpecialCodes;
                scope.populateAnswers = populateAnswers;
                scope.SaveNPSAnswer = saveNPSAnswer;
                scope.SaveRankAnswer = saveRankAnswer;
                scope.ShowSelectedSmiley = showSelectedSmiley;
                scope.OnValueChange = onValueChange;
                scope.OnBlurSave = onBlurSave;

                myCntrl.ParentCtrl = cntrls[1];
                scope.Language = myCntrl.ParentCtrl.Language;
                scope.DefaultLanguage = myCntrl.ParentCtrl.DefaultLanguage;
                scope.TotalBox = scope.$parent.TotalBox;
                scope.answerInputDate = '';
                scope.Placeholder = getPlaceholder();

                if (parentCtrl.qObject.QuestionType == enums.QuestionType.LikeDislike) {
                    for (var optId in scope.variable.Options) {
                        var option = scope.variable.Options[optId];
                        if (option.AnalysisText['en-us'].toLowerCase() == 'like' || option.Text['en-us'].toLowerCase() == 'like') {
                            scope.likeOptionCode = option.Code;
                        }
                        if (option.AnalysisText['en-us'].toLowerCase() == 'dislike' || option.Text['en-us'].toLowerCase() == 'dislike') {
                            scope.dislikeOptionCode = option.Code;
                        }
                    }
                }

                //for star question
                if (parentCtrl.qObject.QuestionType == enums.QuestionType.Stars || parentCtrl.qObject.QuestionType == enums.QuestionType.Distribution || parentCtrl.qObject.QuestionType == enums.QuestionType.NPS) {
                    if (parentCtrl.qObject.Properties.ShapeType) {
                        scope.RatingQuestionConfig.ShapeType = parentCtrl.qObject.Properties.ShapeType;
                    } else if (scope.variable.Properties.ShapeType) {
                        scope.RatingQuestionConfig.ShapeType = scope.variable.Properties.ShapeType;
                    } else if (parentCtrl.qObject.QuestionType == enums.QuestionType.Stars || parentCtrl.qObject.QuestionType == enums.QuestionType.Distribution) {
                        scope.RatingQuestionConfig.ShapeType = "1";
                    }
                    scope.RatingQuestionConfig.ShowLabels = parentCtrl.qObject.Properties.ShowLabels;
                    scope.RatingQuestionConfig.StarBeforeSelection = parentCtrl.qObject.Properties.StarBeforeSelection;
                    scope.RatingQuestionConfig.StarAfterSelection = parentCtrl.qObject.Properties.StarAfterSelection;
                    scope.RatingQuestionConfig.Properties = parentCtrl.qObject.Properties; // To check question properties in NPS template.
                    var ExclusiveSequence = scope.variable.VariableLevelSequence.filter(function (seq) {
                        return scope.variable.Options[seq.ID].IsExclusive;
                    });
                    if (ExclusiveSequence.length) {
                        scope.RatingQuestionConfig.ExclusiveID = ExclusiveSequence[0].ID;
                    }
                    if (parentCtrl.qObject.LeftLabel) {
                        scope.RatingQuestionConfig.LeftLabel = parentCtrl.qObject.LeftLabel[scope.Language] || parentCtrl.qObject.LeftLabel[scope.DefaultLanguage];
                        scope.RatingQuestionConfig.MidLabel = parentCtrl.qObject.MidLabel[scope.Language] || parentCtrl.qObject.MidLabel[scope.DefaultLanguage];
                        scope.RatingQuestionConfig.RightLabel = parentCtrl.qObject.RightLabel[scope.Language] || parentCtrl.qObject.RightLabel[scope.DefaultLanguage];
                    }
                }

                scope.setHoverID = function (hoverID) {
                    scope.hover.hoverID = parseInt(hoverID);
                    //scope.$broadcast('setHoverID',hoverID);
                }
                scope.removeHoverID = function () {
                    scope.hover.hoverID = undefined;
                    //scope.$broadcast('removeHoverID');
                }
                //for text and numeric question
                if (scope.variable.VariableType == 3 || scope.variable.VariableType == 4) {
                    scope.HideOkButton = parentCtrl.qObject.Properties.HideOkButton || 'false';
                }
                //for multiple choice questions
                if (parentCtrl.qObject.QuestionType == 2) {
                    scope.HideHint = parentCtrl.qObject.Properties.HideHint;
                }

                $timeout(function () {
                    if (scope.variable.VariableType == 5) {
                        var elements = document.getElementsByClassName('date');

                        for (var index in elements) {
                            var element = elements[index];
                            if (element.type == 'text') {
                                scope.showFallBackDate = true;
                            }
                        }
                    }
                }, 0)
                $timeout(scope.findSpecialCodes, 0);
                $timeout(scope.populateAnswers, 0);


                for (var i = 0; i < scope.variable.VariableLevelSequence; i++) {
                    scope.IsSelected = false;
                }

                scope.dateAnswer = {
                    'answerInput': ''
                };

                scope.sd = {
                    show: false
                }
                scope.toggleDrp = function () {
                    scope.sd.show = true;
                }
                scope.hideDrp = function () {
                    scope.sd.show = false;
                }

                /**
                 * Adds array of variables as value to keys of rows
                 * @param {integer} index of row where variable is present.
                 */
                scope.addVariable = function (index) {
                    if (scope.$parent.rowVariables[index] == undefined) {
                        scope.$parent.rowVariables[index] = [];
                    }
                    if (scope.$parent.rowVariables[index].indexOf(scope.variable.Name) < 0)
                        scope.$parent.rowVariables[index].push(scope.variable.Name);
                    scope.$parent.Total.sum[index] = 0;
                    for (var data in scope.$parent.rowVariables[index]) {
                        var ans = respondentService.GetVariableAnswers(scope.$parent.rowVariables[index][data]);
                        if (ans[0] != null)
                            scope.$parent.Total.sum[index] += parseFloat(ans[0]);
                    }
                    scope.$parent.validateTotal();
                }

                scope.RemoveAnswer = function (answer) {
                    for (var i = 0; i < scope.answers.length; i++) {
                        scope.answers[i] = parseInt(scope.answers[i]);
                    }
                    var ansIndex = scope.answers.indexOf(answer);
                    if (ansIndex > -1) {
                        scope.answers.splice(ansIndex, 1);
                        if (scope.SelectedValues.hasOwnProperty('single')) {
                            delete scope.SelectedValues.single;
                        }
                        if (scope.SelectedValues.hasOwnProperty(answer)) {
                            scope.SelectedValues[answer] = false;
                        }
                        if (scope.IsSelected.hasOwnProperty(answer)) {
                            scope.IsSelected[answer] = false;
                        }
                        scope.maskOtherVariable(answer);
                        parentCtrl.SaveAnswer(scope.variable.Name, scope.variable.VariableType, scope.answers);
                    }
                }

                //Save the answer of Other options in the variable specified in OtherVariableID key of Other option
                scope.saveOtherValue = function (option) {
                    scope.otherVariableType = scope.GetOtherVariableType(option.OtherVariableID);
                    var otherVariableName = scope.GetOtherVariableName(option.OtherVariableID);
                    scope.SaveAnswer(scope.OtherAnswer.Value[option.Code], otherVariableName, scope.otherVariableType, true);
                }

                scope.GetVariableAnswers = function (variableName) {
                    var values = respondentService.GetVariableAnswers(variableName);
                    return values;
                }

                scope.GetOtherVariableName = function (id) {
                    return parentCtrl.GetOtherVariableName(id);
                }

                //Function to get the Variable name for Other options in the variable
                scope.GetOtherVariableType = function (id) {
                    return parentCtrl.GetOtherVariableType(id);
                }

                setDisplayedValues();

                transclude(scope, function (clone) {
                    element.append(clone);
                });

                if (!parentCtrl.qObject.Properties.hasOwnProperty('MobileFriendly')) {
                    parentCtrl.qObject.Properties.MobileFriendly = 'false';
                }
                if ((parentCtrl.qObject.QuestionType == enums.QuestionType.SimpleGrid ||
                    parentCtrl.qObject.QuestionType == enums.QuestionType.ComplexGrid ||
                    parentCtrl.qObject.QuestionType == enums.QuestionType.NumericGrid ||
                    parentCtrl.qObject.QuestionType == enums.QuestionType.TextGrid || parentCtrl.qObject.QuestionType == enums.QuestionType.Distribution || parentCtrl.qObject.QuestionType == enums.QuestionType.Distribution2 || parentCtrl.qObject.QuestionType == enums.QuestionType.Slider) &&
                    (parentCtrl.qObject.Properties.MobileFriendly == 'false')) {
                    if (scope.$parent.ChildScopes)
                        scope.$parent.ChildScopes[scope.variable.ID] = scope;
                }

                // to focus input element
                $timeout(function () {
                    if (!window.jsrcb.isMobile && (scope.variable.VariableType == enums.VariableType.Text || scope.variable.VariableType == enums.VariableType.Numeric ||
                        scope.variable.VariableType == enums.VariableType.DateTime) && !window.jsrcb.browser.includes("Microsoft Internet Explorer")) {
                        focusInputElement();
                    }
                });

                scope.onmouseEnter = function (event) {
                    var id = event.target.getAttribute('id');
                    AddFocus(id);
                }
                scope.onmouseLeave = function (event) {
                    var element = event.target;
                    RemoveFocus(element);
                }
                scope.moveNext = function () {
                    //document.removeEventListener("keydown", handler);
                    NavigatorService.Next();
                }

                scope.multiSelectOption = function (toggle, option) {
                    if (toggle) {
                        if (scope.SelectedValues.hasOwnProperty(option))
                            scope.SelectedValues[option] = !scope.SelectedValues[option];
                        else
                            scope.SelectedValues[option] = true;
                    } else {
                        //scope.SelectedValues[option] = true;
                    }

                    if (scope.SelectedValues[option] == true) {
                        if (scope.ExclusiveCodes.indexOf(option) > -1) {
                            for (var selectedValue in scope.SelectedValues) {
                                if (selectedValue == option) {
                                    continue;
                                }
                                scope.SelectedValues[selectedValue] = false;
                            }
                            scope.RemoveAllAnswers();
                        } else {
                            for (var i = 0; i < scope.ExclusiveCodes.length; i++) {
                                scope.RemoveAnswer(scope.ExclusiveCodes[i]);
                                scope.SelectedValues[scope.ExclusiveCodes[i]] = false;
                            }
                        }
                        scope.SaveAnswer(option);
                    } else {
                        scope.RemoveAnswer(option);
                    }
                }

                scope.$watch('dateAnswer', function (newValue, oldValue) {
                    if (oldValue != newValue) {
                        if (scope.variable.VariableType == enums.VariableType.DateTime && scope.showFallBackDate) {
                            SaveAnswer(newValue.answerInput);
                        }
                    }
                }, true);

                scope.$on('updateAnswers', function (event, data) {
                    // exclusive across columns
                    if (data.AllowSingleAnswerInRow && Object.keys(data.AllowSingleAnswerInRow).length > 0) {
                        if (scope.variable.Name == data.message) {
                            clearAnswer(data);
                        }
                    }
                    //exclusive across rows
                    if (data.message != scope.variable.Name && data.ExclusiveAcrossRows) {
                        clearAnswer(data);
                    }
                });
                //DKCS
                scope.$on('clearAnswer', function (event, data) {
                    if (scope.variable.Name == data.VariableName)
                        $timeout(function () {
                            clearAnswer(data);
                        });
                });

            } else {
                scope.$destroy();
            }

            scope.maskOtherVariable = function(option, bit) {
                bit = bit !== undefined ? bit : true;
                if(scope.variable.Options[option].IsOther){
                    var otherVariableName = scope.GetOtherVariableName(scope.variable.Options[option].OtherVariableID);
                    respondentService.SetMaskingBit(otherVariableName, bit);
                }
            }

            function getPlaceholder() {
                var placeholder = "";
                if (scope.variable.VariableType == enums.VariableType.Numeric) {
                    if (scope.variable.Properties.Min && scope.variable.Properties.Max && (scope.Placeholders.NumberBetween[scope.Language] || scope.Placeholders.NumberBetween[scope.DefaultLanguage])) {
                        placeholder = (scope.Placeholders.NumberBetween[scope.Language] || scope.Placeholders.NumberBetween[scope.DefaultLanguage]) + " " + scope.variable.Properties.Min + " - " + scope.variable.Properties.Max;
                    } else if (scope.variable.Properties.Min && (scope.Placeholders.NumberMin[scope.Language] || scope.Placeholders.NumberMin[scope.DefaultLanguage])) {
                        placeholder = (scope.Placeholders.NumberMin[scope.Language] || scope.Placeholders.NumberMin[scope.DefaultLanguage]) + " " + scope.variable.Properties.Min;
                    } else if (scope.variable.Properties.Max && (scope.Placeholders.NumberMax[scope.Language] || scope.Placeholders.NumberMax[scope.DefaultLanguage])) {
                        placeholder = (scope.Placeholders.NumberMax[scope.Language] || scope.Placeholders.NumberMax[scope.DefaultLanguage]) + " " + scope.variable.Properties.Max;
                    }
                } else if (scope.variable.VariableType == enums.VariableType.Text) {
                    if (scope.variable.Properties.RegexExample) {
                        placeholder = scope.variable.Properties.RegexExample;
                    } else if (scope.variable.Properties.Min && scope.variable.Properties.Max && (scope.Placeholders.TextBetween[scope.Language] || scope.Placeholders.TextBetween[scope.DefaultLanguage])) {
                        placeholder = (scope.Placeholders.TextBetween[scope.Language] || scope.Placeholders.TextBetween[scope.DefaultLanguage]).replace('_', scope.variable.Properties.Min);
                        placeholder = placeholder.replace('_', scope.variable.Properties.Max);
                    } else if (scope.variable.Properties.Min && (scope.Placeholders.TextMin[scope.Language] || scope.Placeholders.TextMin[scope.DefaultLanguage])) {
                        placeholder = (scope.Placeholders.TextMin[scope.Language] || scope.Placeholders.TextMin[scope.DefaultLanguage]).replace('_', scope.variable.Properties.Min);
                    } else if (scope.variable.Properties.Max && (scope.Placeholders.TextMax[scope.Language] || scope.Placeholders.TextMax[scope.DefaultLanguage])) {
                        placeholder = (scope.Placeholders.TextMax[scope.Language] || scope.Placeholders.TextMax[scope.DefaultLanguage]).replace('_', scope.variable.Properties.Max);
                    } else {
                        placeholder = (scope.Placeholders.Text[scope.Language] || scope.Placeholders.Text[scope.DefaultLanguage]);
                    }

                }
                return placeholder;
            }

            function AddFocus(id) {
                var focusableInput = document.getElementById(id);
                focusableInput.classList.add('hover');
            }

            function RemoveFocus(element) {
                if (element)
                    element.classList.remove('hover');
            }

            function setAnswerByQuestion(ans) {
                switch (parentCtrl.qObject.QuestionType) {
                    case enums.QuestionType.NPS:
                        saveNPSAnswer(scope.variable.Name, scope.variable.VariableType, ans);
                        break;

                    default:
                        if (scope.variable.VariableType == enums.VariableType.MultipleChoice) {
                            scope.multiSelectOption(true, ans);
                        } else {
                            scope.SaveAnswer(ans);
                        }
                        break;
                }
            }

            function onNumPress(number) {
                switch (parentCtrl.qObject.QuestionType) {
                    case enums.QuestionType.NPS:
                        NavigatorService.TOGGLE_BUTTON = true;
                        saveNPSAnswer(scope.variable.Name, scope.variable.VariableType, number);
                        break;
                }
            }

            function shiftFocus(dir) {
                var date = plainElement.getElementsByClassName('date');
                var options = plainElement.getElementsByClassName('focusable');
                var focusableList = Array.prototype.slice.call(options);
                var focusedOption = plainElement.getElementsByClassName('hover')[0] || document.getElementById(scope.SelectedValues.single) || 0;
                var focusedIndex = focusableList.indexOf(focusedOption);
                var nextFocusIndex = -1;
                switch (options.length > 0 && dir) {
                    case NavigatorService.Direction.LEFT:
                        if (focusedIndex > -1) {
                            nextFocusIndex = focusedIndex == 0 ? options.length - 1 : focusedIndex - 1;
                        } else {
                            nextFocusIndex = options.length - 1;
                        }
                        break;

                    case NavigatorService.Direction.RIGHT:
                        if (focusedIndex > -1) {
                            nextFocusIndex = focusedIndex + 1 == options.length ? 0 : focusedIndex + 1;
                        } else {
                            nextFocusIndex = 0;
                        }
                        break;

                    /*case NavigatorService.Direction.UP :
                        if(focusedIndex == 0){
                            backCallback();
                        }else{
                            if(focusedIndex > -1){
                                nextFocusIndex = focusedIndex == 0 ? options.length - 1 : focusedIndex - 1;
                            }else{
                                nextFocusIndex = options.length - 1;
                            }
                        }
                        break;

                    case NavigatorService.Direction.DOWN :
                        if(focusedIndex == options.length - 1){
                            nextCallback();
                        }else{
                            if(focusedIndex > -1){
                                nextFocusIndex = focusedIndex + 1 == options.length ? 0 : focusedIndex + 1;
                            }else{
                                nextFocusIndex = 0;
                            }
                        }
                        break;*/
                }
                if (date.length > 0) {
                    date[0].focus();
                }
                if (nextFocusIndex > -1) {
                    if (parentCtrl.qObject.QuestionType == enums.QuestionType.Stars) {
                        $timeout(function () {
                            scope.hover.hoverID = parseInt(options[nextFocusIndex].getAttribute('option-id'));
                        });
                    }
                    if (focusedOption) {
                        focusedOption.classList.remove('hover');
                    }
                    options[nextFocusIndex].classList.add('hover');
                }
            }

            function submitFocused() {
                var isOtherType = false;
                parentCtrl.shouldShiftFocus = false;
                var focusedOption = plainElement.getElementsByClassName('hover')[0];
                if (focusedOption) {
                    var optCode = focusedOption.getAttribute('id');
                    if (optCode != null && optCode != undefined && optCode != '') {
                        var option = scope.variable.Options[optCode];
                        isOtherType = scope.variable.Options[optCode].IsOther;
                        if (scope.variable.VariableType == enums.VariableType.MultipleChoice) {
                            parentCtrl.shouldShiftFocus = isOtherType;
                        }
                        setAnswerByQuestion(option.Code);
                    }
                    if (isOtherType) {
                        focusInputElement();
                    }
                    focusedOption.classList.remove('hover');
                } else {
                    if (scope.variable.VariableType == enums.VariableType.DateTime) {
                        blurDateInput();
                    } else if (scope.variable.Properties.ShowAs == enums.ShowAsProperty.MultiLine) {
                        var txt = plainElement.getElementsByTagName('textarea')[0];
                        if (txt) {
                            autoResize(txt);
                        }
                    } else {
                        blurInputElement();
                    }
                }
            }

            function autoResize(txt) {
                txt.style.height = 'initial';
                var minRows = 3,
                    rows; //txt.getAttribute('data-min-rows')|0, ;
                txt.rows = minRows;
                if (!txt.baseScrollHeight) {
                    txt.baseScrollHeight = txt.scrollHeight;
                }
                rows = Math.ceil((txt.scrollHeight - txt.baseScrollHeight) / 20); // here 20 is the line height
                txt.rows = minRows + rows;
            }

            $timeout(function () {
                var txt = plainElement.getElementsByTagName('textarea')[0]
                if (txt) {
                    txt.style.height = txt.scrollHeight + 'px' || 'initial';
                    txt.baseScrollHeight = 74;
                    txt.addEventListener('input', function () {
                        autoResize(this);
                    });
                }
            });

            function toggleSelection() {
                var focusedOption = plainElement.getElementsByClassName('hover')[0];
                if (focusedOption) {
                    NavigatorService.TOGGLE_BUTTON = true;
                    var optCode = focusedOption.getAttribute('id');
                    if (optCode != null && optCode != undefined && optCode != '') {
                        var option = scope.variable.Options[optCode];
                        if (parentCtrl.qObject.QuestionType == enums.QuestionType.NPS) {
                            if (scope.answers.hasItem(option.Code)) {
                                removeAnswerNPS(option.Code);
                                focusedOption.classList.remove('nps-background');
                            } else {
                                saveNPSAnswer(scope.variable.Name, scope.variable.VariableType, option.Code);
                            }
                        } else {
                            if (scope.variable.VariableType == enums.VariableType.SingleChoice || scope.variable.VariableType == enums.VariableType.MultipleChoice) {
                                if (scope.answers.hasItem(option.Code)) {
                                    scope.RemoveAnswer(option.Code);
                                    scope.hover.hoverID = undefined;
                                } else {
                                    if (scope.variable.VariableType == enums.VariableType.MultipleChoice) {
                                        scope.multiSelectOption(true, option.Code);
                                    } else {
                                        scope.SaveAnswer(option.Code);
                                    }
                                }
                                focusInputElement();
                            }
                        }
                    }
                }
            }

            function focusInputElement() {
                // to focus input element
                $timeout(function () {
                    var inputElement = plainElement.querySelectorAll('.focusableInput:not(.ng-hide)');
                    if (inputElement.length > 0) {
                        inputElement[0].focus();
                    }
                });
            }

            function blurInputElement() {
                $timeout(function () {
                    var focusedInput = plainElement.querySelectorAll('.focusableInput:not(.ng-hide)')[0];
                    if (focusedInput) {
                        NavigatorService.IS_BLUR_EVENT = true;
                        focusedInput.blur();
                    }
                });
            }

            function blurDateInput() {
                $timeout(function () {
                    var focusedInput = plainElement.querySelectorAll('.date:not(.ng-hide)')[0];
                    if (focusedInput) {
                        NavigatorService.IS_BLUR_EVENT = true;
                        focusedInput.blur();
                    }
                });
            }

            function removeAnswerNPS() {
                scope.answers.length = 0;
                if (scope.SelectedValues.hasOwnProperty('single')) {
                    delete scope.SelectedValues.single;
                }
                parentCtrl.SaveAnswer(scope.variable.Name, scope.variable.VariableType, scope.answers, false);
                var hiddenVariable = parentCtrl.qObject.Variables[parentCtrl.qObject.QuestionLevelSequence[1].ID];
                parentCtrl.SaveAnswer(hiddenVariable.Name, hiddenVariable.VariableType, [], false);
            }

            function getStringFormattedDate(answer) {
                var items = [],
                    finalDateString, dateObject;

                dateObject = new Date(answer);

                items[0] = dateObject.getFullYear().toString();
                items[1] = (dateObject.getMonth() + 1).toString();
                items[2] = dateObject.getDate().toString();

                for (var index in items) {
                    if (items[index].length == 1)
                        items[index] = 0 + items[index];
                }
                finalDateString = items[0] + '-' + items[1] + '-' + items[2];
                return finalDateString;

            }

            function getFormattedDate(answer) {
                var items, finalDateString, dateObject;
                if (answer == "") {
                    return;
                }
                if (scope.showFallBackDate) {
                    dateObject = new Date(answer);
                } else {
                    dateObject = answer;
                }
                dateObject.setHours(12);
                finalDateString = dateObject.toISOString();

                return finalDateString;
            }

            function onValueChange(sliderId, modelValue, highValue, pointerType) {
                if (!modelValue)
                    return;
                SaveAnswer(modelValue);
            }

            function multiSelectOptionsInGrid(option) {
                if (scope.SelectedValues[option] == true) {
                    if (scope.ExclusiveCodes.indexOf(option) > -1) {
                        for (var selectedValue in scope.SelectedValues) {
                            if (selectedValue == option) {
                                continue;
                            }
                            scope.SelectedValues[selectedValue] = false;
                        }
                        scope.RemoveAllAnswers();
                    } else {
                        for (var i = 0; i < scope.ExclusiveCodes.length; i++) {
                            scope.RemoveAnswer(scope.ExclusiveCodes[i]);
                            scope.SelectedValues[scope.ExclusiveCodes[i]] = false;
                        }
                    }
                    scope.SaveAnswer(option);
                } else {
                    scope.RemoveAnswer(option);
                }
            }

            function saveSingleChoiceGridAnswer(option) {
                scope.SelectedValues.single = option;
                if (scope.SelectedValues.single != null || scope.SelectedValues.single != undefined || scope.SelectedValues.single != '') {
                    scope.SaveAnswer(scope.SelectedValues.single);
                }

            }

            function SaveAnswer() {
                var args = Array.prototype.slice.call(arguments);
                var answer = args[0], //commenting because in case of other answer in single choice, option code getting saved as ans.
                    variableName = args[1] || scope.variable.Name,
                    variableType = args[2] || scope.variable.VariableType,
                    isOtherType = args[3],
                    isDefaultAns = args[4];
                var IsExclusiveAcrossRows = scope.ExclusiveAcrossRowsCodes.length > 0 && scope.ExclusiveAcrossRowsCodes.indexOf(parseInt(answer)) > -1;
                if(!answer && (variableType == enums.VariableType.SingleChoice || variableType == enums.VariableType.MultipleChoice)){
                    answer = scope.SelectedValues.single;
                }
                if (variableType != enums.VariableType.MultipleChoice && !isOtherType) {
                    scope.RemoveAllAnswers();
                }
                // Do not run data validation when there is no data
                if (!ValidatorService.IsNotNullOrEmpty(answer)) {
                    ValidatorService.IsDataValid = true;
                }

                if (isOtherType) {
                    var otherVariable = parentCtrl.getVariableFromName(variableName);
                    if(otherVariable){
                        var otherAnswer = Array.isArray(answer) ? answer : [answer];
                        ValidatorService.IsDataValid = ValidatorService.ContainsValidData(otherVariable, otherAnswer);
                        if (ValidatorService.IsDataValid) {
                            scope.valid = true;
                            parentCtrl.SaveAnswer(variableName, variableType, otherAnswer, isOtherType, IsExclusiveAcrossRows, scope.ExclusiveAcrossRowsCodes);
                        }else{
                            scope.valid = false;
                            ValidatorService.MakeBorderRed(scope.variable.Name);
                            ValidatorService.ShakeMe();
                        }
                    }
                } else if (ValidatorService.IsNotNullOrEmpty(answer)) {
                    switch (scope.variable.VariableType) {

                        case enums.VariableType.SingleChoice:
                            {
                                scope.SelectedValues.single = answer; //for stars
                                scope.answers.length = 0;
                                scope.answers.push(answer);

                                if (scope.variable.Options[answer]) {
                                    scope.filter.input = scope.variable.Options[answer].Text[scope.Language] || scope.variable.Options[answer].Text[scope.DefaultLanguage];
                                }
                                if (jsrcb.browser.indexOf('Microsoft Internet Explorer') >= 0) {
                                    if (scope.variable.VariableType == enums.VariableType.SingleChoice && scope.variable.Options[answer]) {
                                        scope.SelectedTextAnswer = scope.variable.Options[answer].Text[scope.Language];
                                    }
                                }
                                if (scope.answers.length == 1) {
                                    $timeout(focusAndBlink);
                                    showSelectedSmiley(answer);
                                }
                                break;
                            }

                        case enums.VariableType.MultipleChoice:
                            {
                                if (!scope.answers.hasItem(answer)) {
                                    scope.answers.push(answer);
                                }
                                if (scope.answers.length > 0) {
                                    $timeout(focusAndBlink);
                                }
                                break;
                            }

                        case enums.VariableType.Text:
                            scope.answers.length = 0;
                            scope.answers.push(answer);
                            break;

                        case enums.VariableType.Numeric:
                            {
                                scope.answers.length = 0;
                                if (scope.variable.Properties.Decimal == 'NoDecimal') {
                                    answer = parseFloat(answer).toFixed();
                                } else {
                                    answer = parseFloat(answer).toFixed(parseInt(scope.variable.Properties.DecimalPlacesCount));
                                }
                                scope.answers.push(answer);
                                break;
                            }

                        case enums.VariableType.DateTime:
                            {
                                scope.answers.length = 0;
                                scope.answers.push(getFormattedDate(answer));
                                break;
                            }
                    }
                    ValidatorService.IsDataValid = ValidatorService.ContainsValidData(scope.variable, scope.answers);
                    if (ValidatorService.IsDataValid) {
                        scope.valid = true;
                        ValidatorService.RemoveBorderRed(scope.variable.Name);
                        parentCtrl.SaveAnswer(scope.variable.Name, scope.variable.VariableType, scope.answers, isOtherType, IsExclusiveAcrossRows, scope.ExclusiveAcrossRowsCodes, isDefaultAns);
                    } else {
                        scope.valid = false;
                        ValidatorService.MakeBorderRed(scope.variable.Name);
                        ValidatorService.ShakeMe();
                    }
                }
                scope.sd.show = false;

            }

            function onBlurSave(answer) {
                NavigatorService.IS_BLUR_EVENT = !NavigatorService.IS_BLUR_EVENT;
                //    $timeout(function () {
                SaveAnswer(answer);
                NavigatorService.IS_BLUR_EVENT = false;
                //    });
            }

            function saveNPSAnswer(variableName, variableType, answer) {
                // var selectedElement = angular.element(document.getElementById(answer));
                // var spanElement = document.getElementsByTagName('span');
                // for (var span in spanElement) {
                //     var classesApplied = spanElement[span].classList;

                //     if (classesApplied && classesApplied.contains('nps-background')) {
                //         classesApplied.remove('nps-background');
                //     }
                // }

                // selectedElement[0].className += ' nps-background';
                scope.RemoveAllAnswers();
                scope.answers.length = 0;
                scope.answers.push(answer);
                scope.SelectedValues.single = answer;
                scope.NPSAnswer = answer;
                if (ValidatorService.ContainsValidData(scope.variable, scope.answers)) {
                    parentCtrl.SaveAnswer(variableName, variableType, scope.answers, false);
                    var hiddenVariable = parentCtrl.qObject.Variables[parentCtrl.qObject.QuestionLevelSequence[1].ID];
                    if (answer >= 0 && answer <= 6)
                        parentCtrl.SaveAnswer(hiddenVariable.Name, hiddenVariable.VariableType, enums.NPS.Detractor, false);
                    else if (answer == 7 || answer == 8)
                        parentCtrl.SaveAnswer(hiddenVariable.Name, hiddenVariable.VariableType, enums.NPS.Passive, false);
                    else
                        parentCtrl.SaveAnswer(hiddenVariable.Name, hiddenVariable.VariableType, enums.NPS.Promoter, false);
                }
            }

            //Args:- rank = Rank which is entered, rankVariables = All the rank variables of a particular group, variable = Numeric variable of the attribute in which rank is entered
            function saveRankAnswer(rank, rankVariables, variable) {
                var answer;
                var rankVariable = rankVariables[0][rank - 1];
                for (var i = 0; i < rankVariable.VariableLevelSequence.length; i++) {
                    if (variable.AnalysisText[scope.Language] == rankVariable.Options[rankVariable.VariableLevelSequence[i].ID].Text[scope.Language]) {
                        answer = rankVariable.Options[rankVariable.VariableLevelSequence[i].ID].Code;
                        break;
                    }
                }
                if (rankVariables[0][rank - 1]) {
                    scope.SaveAnswer(answer, rankVariables[0][rank - 1].Name, 1, true, true);
                }
            }

            function showSelectedSmiley(code) {
                for (var seq in scope.variable.VariableLevelSequence) {
                    var cd = parseInt(scope.variable.VariableLevelSequence[seq].ID);
                    scope.IsSelected[cd] = false;
                    if (cd == code) {
                        scope.IsSelected[cd] = true;
                    }
                }
            }

            function setDisplayedValues() {
                var optionsArray = [];
                for (var i = 0; i < scope.variable.VariableLevelSequence.length; i++) {
                    if (scope.variable.VariableLevelSequence[i].IsOption) {
                        var optionId = scope.variable.VariableLevelSequence[i].ID;
                        var optionCode = scope.variable.Options[optionId].Code;
                        optionsArray.push(optionCode);
                    } else {
                        var optionGroupId = scope.variable.VariableLevelSequence[i].ID;
                        for (var j = 0; j < scope.variable.OptionGroups[optionGroupId].OptionSequence.length; j++) {
                            var optionId = scope.variable.OptionGroups[optionGroupId].OptionSequence[j];
                            var optionCode = scope.variable.Options[optionId].Code;
                            optionsArray.push(optionCode);
                        }
                    }
                }

                if (parentCtrl.qObject.QuestionType == enums.QuestionType.NPS) {
                    optionsArray = [];
                    var extraVariable = parentCtrl.qObject.Variables[parentCtrl.qObject.QuestionLevelSequence[1].ID];
                    for (var i = 0; i < extraVariable.VariableLevelSequence.length; i++) {

                        var optionId = extraVariable.VariableLevelSequence[i].ID;
                        var optionCode = extraVariable.Options[optionId].Code;
                        optionsArray.push(optionCode);
                    }

                    respondentService.SetDisplayedValues(extraVariable.Name, extraVariable.VariableType, parentCtrl.qObject.ID, optionsArray);
                    NavigatorService.setListener = saveNPSAnswer;
                } else {
                    NavigatorService.setListener = SaveAnswer;
                    respondentService.SetDisplayedValues(scope.variable.Name, scope.variable.VariableType, parentCtrl.qObject.ID, optionsArray);
                }
                NavigatorService.focusListener = shiftFocus;
                NavigatorService.submit = submitFocused;
                NavigatorService.toggleSelection = toggleSelection;
                NavigatorService.numKeyListener = onNumPress;
            }

            function clearAnswer(data) {
                if (scope.variable.VariableType == 1) {
                    if (data.Answers.getIndexOf(scope.SelectedValues.single) > -1)
                        scope.SelectedValues.single = '';
                } else if (scope.variable.VariableType == 2) {
                    scope.answers = [];
                    for (var id in scope.SelectedValues) {
                        if (data.Answers.getIndexOf(id) > -1) {
                            scope.SelectedValues[id] = false;
                        }
                        if (scope.SelectedValues[id]) {
                            scope.answers.push(id);
                        }
                    }
                } else if (scope.variable.VariableType == 4 || scope.variable.VariableType == 3) {
                    scope.answerInput = undefined;
                    scope.SelectedValues.single = undefined;
                }
            }

            function RemoveAllAnswers() {
                scope.answers.length = 0;
                parentCtrl.SaveAnswer(scope.variable.Name, scope.variable.VariableType, scope.answers);
            }

            function populateAnswers() {

                //populate answers from answer Object
                var answers = scope.answers;
                if (answers && answers.length > 0) {
                    switch (scope.variable.VariableType) {
                        case 1:
                            if (parentCtrl.qObject.QuestionType == enums.QuestionType.NPS) {
                                scope.NPSAnswer = respondentService.GetVariableAnswers(scope.variable.Name);
                            } else if ((parentCtrl.qObject.QuestionType == enums.QuestionType.Stars ||
                                parentCtrl.qObject.QuestionType == enums.QuestionType.Distribution) &&
                                (scope.variable.Properties.ShapeType == '7' || parentCtrl.qObject.Properties.ShapeType == '7')) {
                                showSelectedSmiley(answers[0]);
                                scope.SelectedValues.single = answers[0].toString();
                            } else {
                                scope.SelectedValues.single = answers[0].toString();
                                //for drop down
                                if (scope.variable.Options[scope.SelectedValues.single]) {
                                    scope.filter.input = scope.variable.Options[scope.SelectedValues.single].Text[scope.Language] || scope.variable.Options[scope.SelectedValues.single].Text[scope.DefaultLanguage];
                                }
                                if (jsrcb.browser.indexOf('Microsoft Internet Explorer') >= 0) {
                                    scope.SelectedTextAnswer = scope.variable.Options[answers[0]].Text[scope.Language];
                                }
                                if (parentCtrl.qObject.QuestionType == enums.QuestionType.Stars) {
                                    if (parentCtrl.qObject.Properties.IncrementBy == 0.5) {
                                        scope.SelectedValues.single /= 2;
                                    }
                                }
                                for (var option in scope.variable.Options) {
                                    if(!answers.hasItem(option) && scope.variable.Options[option].IsOther == true){
                                        scope.maskOtherVariable(option);
                                    }
                                    if (scope.variable.Options[option].IsOther == true) {
                                        var otherVarName = parentCtrl.GetOtherVariableName(scope.variable.Options[option].OtherVariableID);
                                        var otherVarAnswer = respondentService.GetVariableAnswers(otherVarName);
                                        var otherVarType = scope.GetOtherVariableType(scope.variable.Options[option].OtherVariableID);
                                        scope.OtherAnswer.Value[scope.variable.Options[option].Code] = otherVarType == enums.VariableType.Numeric ? parseInt(otherVarAnswer) : otherVarAnswer;
                                    }
                                }
                            }
                            break;
                        case 2:
                            if (scope.displayType == "multiselectbox") {
                                for (var i in answers) {
                                    scope.data.SelectedValues.push(answers[i].toString());
                                }
                            } else {
                                for(var i in scope.variable.Options){
                                    if(answers.hasItem(i)){
                                        scope.SelectedValues[i] = true;
                                    }else if (scope.variable.Options[i].IsOther == true) {
                                            scope.maskOtherVariable(i);
                                    }
                                    if (scope.variable.Options[i].IsOther == true) {
                                        var otherVarName = parentCtrl.GetOtherVariableName(scope.variable.Options[i].OtherVariableID);
                                        var otherVarAnswer = respondentService.GetVariableAnswers(otherVarName);
                                        scope.OtherAnswer.Value[scope.variable.Options[i].Code] = otherVarAnswer;
                                    }
                                }
                            }
                            break;

                        case 4:
                            scope.answerInput = parseFloat(answers[0]);
                            scope.SelectedValues.single = parseFloat(answers[0]);
                            break;

                        case 5:
                            if (scope.showFallBackDate) {
                                var date = getStringFormattedDate(answers[0])
                                scope.dateAnswer.answerInput = date;
                            } else {
                                var dateTime = new Date(answers[0]);
                                scope.answerInput = dateTime;
                            }
                            break;

                        default:
                            //issue with leading zeroes
                            // if (scope.variable.Properties.RegexType == 'Telephone' || scope.variable.Properties.RegexType == 'Postal') {
                            //     scope.answerInput = parseFloat(answers[0]);
                            // }
                            // else
                            scope.answerInput = answers[0];
                            scope.SelectedValues.single = answers[0];
                        /*if (scope.variable.VariableType == enums.VariableType.Text) {
                            scope.SaveAnswer(scope.answerInput);
                        }*/
                    }
                }
                //polpulate answers from default property of option(if set true)
                else if (scope.defaultOptionCode.length > 0) {

                    switch (scope.variable.VariableType) {
                        case 1:
                            scope.SelectedValues.single = scope.defaultOptionCode[0].toString();
                            scope.SaveAnswer(scope.defaultOptionCode[0]);
                            break;
                        case 2:
                            if (scope.displayType == "multiselectbox") {
                                for (var i in scope.defaultOptionCode) {
                                    scope.data.SelectedValues.push(scope.defaultOptionCode[i].toString());
                                    scope.SaveAnswer(scope.defaultOptionCode[i]);
                                }
                            } else {
                                for (var i in scope.defaultOptionCode) {
                                    scope.SelectedValues[scope.defaultOptionCode[i]] = true;
                                    scope.SaveAnswer(scope.defaultOptionCode[i]);
                                }
                            }
                            break;
                    }

                } else if (parentCtrl.qObject.Properties.DefaultValue) {
                    if (scope.variable.VariableType == enums.VariableType.Numeric) {
                        scope.SaveAnswer(parseFloat(parentCtrl.qObject.Properties.DefaultValue), null, null, null, true);
                        scope.SelectedValues.single = parseFloat(parentCtrl.qObject.Properties.DefaultValue);
                    }
                }
            }

            function findSpecialCodes() {

                for (var key in scope.variable.Options) {
                    var option = scope.variable.Options[key];
                    if (option.IsExclusive) {

                        scope.ExclusiveCodes.push(option.Code);
                    }
                    if (option.IsDefault) {
                        scope.defaultOptionCode.push(option.Code);
                    }
                    if (option.IsExclusiveAcrossRows) {
                        scope.ExclusiveAcrossRowsCodes.push(option.Code);
                    }

                }
            }

            function focusAndBlink() {
                var hint = document.getElementById('blinkingHint');
                var questionContainer = document.getElementsByClassName('sq-container')[0];
                if (hint) {
                    if (!hint.classList.contains('manyOption')) {
                        hint.classList.add("manyOption");
                        questionContainer.scrollIntoView();
                    }
                }
            }
        }

        function controller($scope) {
            var Properties = $scope.variable.Properties;
            $scope.data = {
                SelectedValues: []
            };

            if ($scope.variable.Properties.Min) {
                $scope.variable.Properties.Min = parseInt($scope.variable.Properties.Min);
                $scope.variable.Properties.Max = parseInt($scope.variable.Properties.Max);
                $scope.variable.Properties.IncrementScaleBy = parseInt($scope.variable.Properties.IncrementScaleBy);
            }

            $scope.OptionsList = []; // $scope.variable.VariableLevelSequence;
            $scope.OptionInfo = {
                currentPage: 1,
                pageSequence: [],
                showPagination: false,
                optionsPerPage: 30,
                totalPages: 0,
                searchInput: ''
            };

            $scope.OtherAnswer = {
                Value: []
            };

            $scope.Answer = {};
            $scope.InputClicked = false;
            $scope.filter = {};
            $scope.filter.input = "";

            $scope.ShowDropDown = function () {
                $scope.OptionsList = $scope.variable.VariableLevelSequence;
                $scope.InputClicked = !$scope.InputClicked;
                $timeout(function () {
                    $scope.$emit('adjust-question-height');
                });
            }

            $scope.HideDropDown = function () {
                $scope.InputClicked = false;
            }


            $scope.filterOptions = function (char) {
                if (!char) {
                    var answers = respondentService.GetVariableAnswers($scope.variable.Name);
                    if (answers.length) {
                        $scope.FilteredOptions = $scope.variable.VariableLevelSequence.filter(function (d) {
                            return answers.indexOf($scope.variable.Options[d.ID].Code) != -1;
                        });
                    }
                } else {
                    $scope.FilteredOptions = $scope.variable.VariableLevelSequence.filter(function (d) {
                        return $scope.variable.Options[d.ID].Text[$scope.DefaultLanguage].toLowerCase().startsWith(char.toLowerCase());
                    });
                }
                if ($scope.displayType == 'dropdown') {
                    $scope.OptionsList = $scope.FilteredOptions;
                } else {
                    $scope.CalculatePages($scope.FilteredOptions);
                    $scope.onPageClick(1);
                }
                $timeout(function () {
                    $scope.$emit('adjust-question-height');
                });

            }

            $scope.CalculatePages = function (optionsSeq) {
                if (!optionsSeq)
                    return;
                $scope.OptionInfo.pageSequence = [];
                $scope.OptionInfo.totalPages = Math.ceil(optionsSeq.length / $scope.OptionInfo.optionsPerPage);
                if ($scope.OptionInfo.totalPages > 1) {
                    $scope.OptionInfo.showPagination = true;
                    if ($scope.OptionInfo.totalPages > 10) {
                        populatePageNumbers(1, 10);
                    } else {
                        populatePageNumbers(1, $scope.OptionInfo.totalPages);
                    }
                } else {
                    $scope.OptionInfo.showPagination = false;
                }
            }

            function populatePageNumbers(firstPageNumber, lastPageNumber) {
                $scope.OptionInfo.pageSequence = [];
                for (var i = firstPageNumber; i <= lastPageNumber; i++) {
                    $scope.OptionInfo.pageSequence.push(i);
                }
                $scope.OptionInfo.firstVisiblePage = firstPageNumber;
                $scope.OptionInfo.lastVisiblePage = lastPageNumber;
            }

            $scope.onPageClick = function (pageNumber) {
                if (!$scope.FilteredOptions)
                    return;
                $scope.OptionInfo.currentPage = pageNumber;
                var startIndex = ($scope.OptionInfo.currentPage - 1) * $scope.OptionInfo.optionsPerPage,
                    endIndex = $scope.OptionInfo.currentPage * $scope.OptionInfo.optionsPerPage;

                $scope.OptionsList = $scope.FilteredOptions.slice(startIndex, endIndex);
            }
            $scope.onPrevClick = function () {
                if ($scope.OptionInfo.currentPage == 1) {
                    return;
                }
                if ($scope.OptionInfo.currentPage - 1 < $scope.OptionInfo.firstVisiblePage) {
                    populatePageNumbers(getFirstPageNumber(), $scope.OptionInfo.currentPage - 1);
                }
                $scope.onPageClick($scope.OptionInfo.currentPage - 1);
            }
            $scope.onNextClick = function () {
                if ($scope.OptionInfo.currentPage == $scope.OptionInfo.pageSequence.length)
                    return;

                if ($scope.OptionInfo.currentPage + 1 > $scope.OptionInfo.lastVisiblePage) {
                    populatePageNumbers($scope.OptionInfo.currentPage + 1, getlastPageNumber());
                }
                $scope.onPageClick($scope.OptionInfo.currentPage + 1);
            }

            function getlastPageNumber() {
                if ($scope.OptionInfo.totalPages > $scope.OptionInfo.lastVisiblePage + 10) {
                    return $scope.OptionInfo.lastVisiblePage + 10;
                } else {
                    return $scope.OptionInfo.totalPages;
                }
            }

            function getFirstPageNumber() {
                if ($scope.OptionInfo.currentPage - 10 < 1) {
                    return 1;
                } else {
                    return $scope.OptionInfo.currentPage - 10;
                }
            }
            if (!$scope.OptionInfo.searchInput) {
                $timeout(function () {
                    $scope.filterOptions($scope.OptionInfo.searchInput);
                })
            }
        }
    }
})(angular);
