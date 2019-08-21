/**
 * Created by AnkitS on 3/1/2018.
 */
(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("autoCode", ['SurveyEngine.Enums', 'SurveyEngine.RespondentService', 'SurveyEngine.PageRouteService', '$timeout', 'SurveyEngine.NavigatorService', option]);

    function option(enums, respondentService, PageRouteService, $timeout, NavigatorService) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'A'
        };

        return directive;

        function link(scope, element, attrs, cntrls) {
            var plainElement = element[0];
            NavigatorService.submit = submitFocused;
            NavigatorService.focusListener = shiftFocus;
            NavigatorService.tabPressListener = changeInputFocus;

            scope.currentInputBox = null;

            function submitFocused() {
                var isOtherType = false;
                var focusedOption = document.getElementsByClassName('ac-hover')[0];
                var allOptions = document.getElementsByClassName('auto-code-opts');
                Array.prototype.slice.call(allOptions).map(function (d) {
                    var i = d.getElementsByTagName('i')[0];
                    if (i) {
                        i.style.display = 'none';
                    }
                });
                var okButton = document.getElementsByClassName('modal-btn-hover')[0];
                if (okButton) {
                    okButton.click();
                    return;
                }
                if (focusedOption) {
                    var optCode = focusedOption.getAttribute('id');
                    isOtherType = optCode == 'ac-other';
                    if (isOtherType) {
                        scope.SaveAutocodeOtherAnswer(undefined, focusedOption);
                    } else if (optCode != null && optCode != undefined && optCode != '') {
                        scope.SaveConflictAnswer(parseInt(optCode), focusedOption);
                    }
                    focusSubmitButton();
                } else {
                    blurInputElement();
                }
            }

            function shiftFocus(dir) {
                removeFocusFromSubmitButton();
                var options = document.getElementsByClassName('auto-code-opts');
                var focusableList = Array.prototype.slice.call(options);
                var focusedOption = document.getElementsByClassName('ac-hover')[0];
                var focusedIndex = focusableList.indexOf(focusedOption);
                var nextFocusIndex = -1;
                switch (options.length > 0 && dir) {
                    case NavigatorService.Direction.UP:
                    case NavigatorService.Direction.LEFT:
                        if (focusedIndex > -1) {
                            nextFocusIndex = focusedIndex == 0 ? options.length - 1 : focusedIndex - 1;
                        } else {
                            nextFocusIndex = options.length - 1;
                        }
                        break;

                    case NavigatorService.Direction.DOWN:
                    case NavigatorService.Direction.RIGHT:
                        if (focusedIndex > -1) {
                            nextFocusIndex = focusedIndex + 1 == options.length ? 0 : focusedIndex + 1;
                        } else {
                            nextFocusIndex = 0;
                        }
                        break;

                }
                if (nextFocusIndex > -1) {
                    if (focusedOption) {
                        focusedOption.classList.remove('ac-hover');
                    }
                    options[nextFocusIndex].classList.add('ac-hover');
                }
            }

            function focusSubmitButton() {
                var footer = document.getElementsByClassName('modal-footer')[0];
                if (footer) {
                    var span = document.createElement('span');
                    span.textContent = "press Enter OR";
                    span.style.paddingRight = '15px';
                    span.style.fontSize = '1rem';
                    var button = footer.getElementsByTagName('button')[0];
                    if (footer) {
                        footer.prepend(span);
                    }
                    if (button) {
                        button.classList.add('modal-btn-hover');
                    }
                }
            }

            function removeFocusFromSubmitButton() {
                var footer = document.getElementsByClassName('modal-footer')[0];
                if (footer) {
                    var span = footer.getElementsByTagName('span')[0];
                    if (span) {
                        span.remove();
                    }
                    var okButton = footer.getElementsByTagName('button')[0];
                    if (okButton) {
                        okButton.classList.remove('modal-btn-hover');
                    }
                }
            }

            function blurInputElement() {
                $timeout(function () {
                    if (scope.currentInputBox == document.activeElement) {
                        scope.currentInputBox.blur();
                    } else if (document.activeElement) {
                        document.activeElement.blur();
                    }
                });
            }

            function changeInputFocus() {
                var inputElements = plainElement.querySelectorAll('.focusableInput:not(.ng-hide)');
                var focused = document.activeElement;
                for (var index = 0; index < inputElements.length; index++) {
                    if (inputElements[index] == focused) {
                        if (index >= (inputElements.length - 1)) {
                            scope.currentInputBox = inputElements[0];
                        } else {
                            scope.currentInputBox = inputElements[index + 1];
                            break;
                        }
                    }
                }
            }

            scope.focusInputElement = function () {
                // to focus input element
                $timeout(function () {
                    var inputElement = plainElement.querySelectorAll('.focusableInput:not(.ng-hide)');
                    var index = 0;
                    if (inputElement.length > 0) {
                        if (scope.currentInputBox) {
                            Array.prototype.slice.call(inputElement).map(function (d, i) {
                                if (d == scope.currentInputBox) {
                                    if (inputElement.length > (i + 1)) {
                                        index = i + 1;
                                    } else {
                                        index = -1;
                                    }
                                }
                            });
                        }
                        if (index > -1) {
                            scope.currentInputBox = inputElement[index];
                            scope.currentInputBox.focus();
                        } else {
                            scope.currentInputBox.blur();
                            scope.currentInputBox = null;
                        }
                    }
                });
            };
            if (!window.jsrcb.isMobile) {
                scope.focusInputElement();
            }
        }

        function controller($scope) {
            $scope.AutocodeTextbox = [];
            $scope.AutocodeAnswers = [];
            $scope.SaveAutocodeAnswer = saveAutocodeAnswer;
            $scope.AddTextbox = addTextbox;
            $scope.SaveAutocodeOtherAnswer = saveAutocodeOtherAnswer;
            $scope.SaveConflictAnswer = saveConflictAnswer;
            $scope.SaveAnswerAfterConflictResolved = saveAnswerAfterConflictResolved;

            if ($scope.qObject.QuestionType == enums.QuestionType.AutocodeText) {
                $scope.NumberOfTextboxes = parseInt($scope.qObject.Properties.AnswersAllowed);
                populateAutocodeAnswers();
            }
            //Handling Autocode text
            function populateAutocodeAnswers() {
                var answeredText;
                var variable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID];
                var answers = respondentService.GetVariableAnswers(variable.Name);
                $scope.AutocodeAnswers = answers;
                setAutocodeDisplayedValues(variable);
                // if (answers.length == 0) {
                // var textboxObject = {
                //     value: ''
                // }
                // $scope.AutocodeTextbox.push(textboxObject);
                addTextbox();
                //  } else {
                var otherAnsIndex = 0;
                for (var i = 0; i < answers.length; i++) {
                    //  $scope.NumberOfTextboxes++;
                    if (variable.Options[answers[i]].IsOther) {
                        var otherVariable = $scope.qObject.Variables[variable.Options[answers[i]].OtherVariableID];
                        answeredText = respondentService.GetVariableAnswers(otherVariable.Name);
                        $scope.AutocodeOtherAnswer = answeredText[0];
                        var otherAnswers = answeredText[0].split(',');
                        var answeredTextboxObject = {
                            value: otherAnswers[otherAnsIndex++]
                        }
                        $scope.AutocodeTextbox[i] = answeredTextboxObject;
                    } else {
                        answeredText = variable.Options[answers[i]].Text[$scope.language];
                        var answeredTextboxObject = {
                            value: answeredText
                        }
                        $scope.AutocodeTextbox[i] = answeredTextboxObject;
                    }
                }
                // }
            }

            //Setting Displayed values for autocode question
            function setAutocodeDisplayedValues(selectedVariable) {
                var optionsArray = [];

                //For multichoice variable
                for (var i = 0; i < selectedVariable.VariableLevelSequence.length; i++) {
                    if (selectedVariable.VariableLevelSequence[i].IsOption) {
                        var optionId = selectedVariable.VariableLevelSequence[i].ID;
                        var optionCode = selectedVariable.Options[optionId].Code;
                        optionsArray.push(optionCode);
                    }
                }

                respondentService.SetDisplayedValues(selectedVariable.Name, selectedVariable.VariableType, $scope.qObject.ID, optionsArray);
            }

            function saveAutocodeAnswer(textInput, index) {
                if (!textInput)
                    return;

                var topSelectedVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[1].ID];
                var selectedVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID];
                var lowercaseTextInput = textInput.toLowerCase().trim();
                var optionFound = false,
                    aliasConflict = false,
                    conflictLength = 0,
                    oldCode = $scope.AutocodeAnswers[index],
                    otherVariable = {},
                    AutocodeAnswersCopy = angular.copy($scope.AutocodeAnswers);

                $scope.AliasConflict = {};
                $scope.EditDistance = {};
                $scope.SimilarityText = {};
                // $scope.AutocodeOtherAnswer = '';
                $scope.ConflictText = textInput;
                $scope.ConflictIndex = index;
                for (var option in selectedVariable.Options) {
                    if (selectedVariable.Options[option].IsOther) {
                        otherVariable = $scope.qObject.Variables[selectedVariable.Options[option].OtherVariableID];
                        break;
                    }
                }

                for (var option in selectedVariable.Options) {
                    var optionAliases = getAllAliases(selectedVariable.Options[option].Aliases);
                    var optionText = selectedVariable.Options[option].Text[$scope.language].toLowerCase().trim();
                    //Check if it matches the text of option itself
                    if (!(optionText == 'other')) {
                        $scope.EditDistance[option] = similarity(textInput, optionText);
                        if (lowercaseTextInput == optionText) {
                            $scope.AutocodeAnswers[index] = selectedVariable.Options[option].Code;
                            optionFound = true;
                            break;
                        }
                        //Check it matches any of the aliases of the option
                        else if (optionAliases.length != 0) {
                            var editDistancesInALiases = {};
                            for (var j = 0; j < optionAliases.length; j++) {
                                editDistancesInALiases[j] = similarity(lowercaseTextInput, optionAliases[j].toLowerCase().trim());
                                if (lowercaseTextInput == optionAliases[j].toLowerCase().trim()) {
                                    //Push the option code in answers
                                    $scope.AliasConflict[selectedVariable.Options[option].Code] = selectedVariable.Options[option].Text[$scope.language];
                                    conflictLength++;
                                    if (conflictLength <= 1) {
                                        $scope.AutocodeAnswers[index] = selectedVariable.Options[option].Code;
                                    }
                                    optionFound = true;
                                    break;
                                }
                            }
                            var minEditDistanceInAliases = calculateMinEditDistance(editDistancesInALiases)
                            if (minEditDistanceInAliases < $scope.EditDistance[option])
                                $scope.EditDistance[option] = minEditDistanceInAliases;
                        }
                    }
                }
                // means there is a conflict between choices.. so emit the conflict to show dialog box
                if (conflictLength > 1) {
                    aliasConflict = true;
                    PageRouteService.RunPostValidation(enums.ValidationType.AutoCodeConflict, autoCodeConflictCallback);
                }
                if (!aliasConflict) {
                    if (!optionFound) {
                        $scope.SimilarityText = getOptionsSuggestion($scope.EditDistance);
                        PageRouteService.RunPostValidation(enums.ValidationType.AutoCodeSimilarity, autoCodeConflictCallback);
                    }
                }
                if (optionFound && oldCode == 2) {
                    var spiltedTexts = $scope.AutocodeOtherAnswer.split(',');
                    var oldTextIndex = 0;
                    for (var i = 0; i <= $scope.ConflictIndex; i++) {
                        if (AutocodeAnswersCopy[i] == 2) {
                            oldTextIndex++;
                        }
                    }
                    if (oldTextIndex) {
                        spiltedTexts.splice(oldTextIndex - 1, 1);
                    }
                    $scope.AutocodeOtherAnswer = spiltedTexts.join();
                    $scope.SaveAnswer(otherVariable.Name, enums.VariableType.Text, $scope.AutocodeOtherAnswer, true, false);
                }
                if ($scope.AutocodeAnswers.length > 0) {
                    $scope.SaveAnswer(selectedVariable.Name, selectedVariable.VariableType, $scope.AutocodeAnswers, true, false);
                    $scope.SaveAnswer(topSelectedVariable.Name, topSelectedVariable.VariableType, $scope.AutocodeAnswers[0], true, true);
                }
            }

            function getOptionsSuggestion(editDistances) {
                var minDistance = calculateMinEditDistance(editDistances);
                return searchObject(editDistances, minDistance);
            }

            function calculateMinEditDistance(editDistances) {
                var minDistance = 999,
                    minDistanceOptionID;
                for (var ID in editDistances) {
                    var editDistance = parseInt(editDistances[ID]);
                    if (editDistance < minDistance) {
                        minDistance = editDistance;
                        minDistanceOptionID = ID;
                    }
                }
                return minDistance;
            }

            function searchObject(object, value) {
                var codeText = {};
                var selectedVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID];
                for (var key in object) {
                    var val = object[key];
                    if (val == value) {
                        codeText[selectedVariable.Options[key].Code] = selectedVariable.Options[key].Text[$scope.language];
                    }
                }
                return codeText;
            }

            function getAllAliases(aliases) {
                var optionAliases = [];
                for (var alias in aliases) {
                    for (var i = 0; i < aliases[alias].length; i++) {
                        optionAliases.push(aliases[alias][i]);
                    }
                }
                return optionAliases;
            }

            function addTextbox() {
                for (var i = 0; i < $scope.qObject.Properties.AnswersAllowed; i++) {
                    var textboxObject = {};
                    $scope.AutocodeTextbox.push(textboxObject);
                    // $scope.NumberOfTextboxes++;
                }
            }

            function saveAutocodeOtherAnswer(text, optionSelected, index) {
                if (!text) {
                    var text = $scope.ConflictText;
                }
                var selectedVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID];

                for (var option in selectedVariable.Options) {
                    if (selectedVariable.Options[option].IsOther) {

                        //  if ($scope.AutocodeAnswers.indexOf(selectedVariable.Options[option].Code) == -1) {
                        if (optionSelected) {
                            $scope.ConflictAnswer = selectedVariable.Options[option].Code;
                        } else {
                            $scope.AutocodeAnswers[index] = selectedVariable.Options[option].Code;
                        }
                        //  }
                        var otherVariableName = $scope.qObject.Variables[selectedVariable.Options[option].OtherVariableID].Name;
                        // var otherAnswer = respondentService.GetVariableAnswers(otherVariableName);
                        if (!$scope.AutocodeOtherAnswer) {
                            $scope.AutocodeOtherAnswer = text;
                        } else {
                            var spiltedTexts = $scope.AutocodeOtherAnswer.split(',');
                            var oldTextIndex = 0;
                            if (Object.keys($scope.AutocodeAnswers).indexOf($scope.ConflictIndex.toString()) > -1) {
                                for (var i = 0; i <= $scope.ConflictIndex; i++) {
                                    if ($scope.AutocodeAnswers[i] == selectedVariable.Options[option].Code) {
                                        oldTextIndex++;
                                    }
                                }
                            }
                            if (oldTextIndex) {
                                spiltedTexts.splice(oldTextIndex - 1, 1, text);
                            } else if (Object.keys($scope.AutocodeAnswers).indexOf($scope.ConflictIndex.toString()) > -1) {
                                spiltedTexts.splice(0, 0, text);
                            } else {
                                spiltedTexts.push(text);
                            }
                            $scope.AutocodeOtherAnswer = spiltedTexts.join();
                        }
                        $scope.SaveAnswer(otherVariableName, enums.VariableType.Text, $scope.AutocodeOtherAnswer, true, false);
                        break;
                    }
                }
                //In case of conflict applying 'option-checked class to Other option to highlight it'
                if (optionSelected) {
                    var i = optionSelected.getElementsByTagName('i')[0];
                    if (i) {
                        i.style.display = 'block';
                    }
                }
            }

            function saveConflictAnswer(optionCode, optionSelected) {
                $scope.ConflictAnswer = optionCode;
                var i = optionSelected.getElementsByTagName('i')[0];
                if (i) {
                    i.style.display = 'block';
                }
            }

            function saveAnswerAfterConflictResolved() {
                $timeout(function () {
                    var selectedVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID];
                    var topSelectedVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[1].ID];
                    if ($scope.ConflictAnswer) {
                        //  $scope.AutocodeAnswers.push($scope.ConflictAnswer);
                        $scope.AutocodeAnswers[$scope.ConflictIndex] = $scope.ConflictAnswer;
                        $scope.AutocodeTextbox[$scope.ConflictIndex].value = selectedVariable.Options[$scope.ConflictAnswer].Text[$scope.language];
                    }
                    if ($scope.AutocodeAnswers.length > 0) {
                        $scope.SaveAnswer(selectedVariable.Name, selectedVariable.VariableType, $scope.AutocodeAnswers, true, false);
                        $scope.SaveAnswer(topSelectedVariable.Name, topSelectedVariable.VariableType, $scope.AutocodeAnswers[0], true, true);
                    }
                    $scope.focusInputElement();
                });
            }

            function similarity(s1, s2) {
                var longer = s1;
                var shorter = s2;
                if (s1.length < s2.length) {
                    longer = s2;
                    shorter = s1;
                }
                var longerLength = longer.length;
                if (longerLength == 0) {
                    return 1.0;
                }
                return calculateEditDistance(longer, shorter);
            }

            function calculateEditDistance(s1, s2) {
                s1 = s1.toLowerCase();
                s2 = s2.toLowerCase();

                var costs = new Array();
                for (var i = 0; i <= s1.length; i++) {
                    var lastValue = i;
                    for (var j = 0; j <= s2.length; j++) {
                        if (i == 0)
                            costs[j] = j;
                        else {
                            if (j > 0) {
                                var newValue = costs[j - 1];
                                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                                    newValue = Math.min(Math.min(newValue, lastValue),
                                        costs[j]) + 1;
                                costs[j - 1] = lastValue;
                                lastValue = newValue;
                            }
                        }
                    }
                    if (i > 0)
                        costs[s2.length] = lastValue;
                }
                return costs[s2.length];
            }

            function onMouseEnter(ele) {
                ele.classList.add('ac-hover');
            }

            function onMouseLeave(element) {
                if (element)
                    element.classList.remove('ac-hover');
            }

            function autoCodeConflictCallback(validationType) {
                document.activeElement.blur();
                NavigatorService.blockNavigation = true;
                window.save = $scope.SaveConflictAnswer;
                window.saveAutocodeOther = $scope.SaveAutocodeOtherAnswer;
                window.onMouseEnter = onMouseEnter;
                window.onMouseLeave = onMouseLeave;
                var xh = "";
                if (validationType == enums.ValidationType.AutoCodeConflict) {
                    for (var i in $scope.AliasConflict) {
                        xh += '<span id="' + i + '" class="auto-code-opts conflict-choices clickable option-as-label" onclick="save(' + i + ', this)" ' +
                            'onmouseenter="onMouseEnter(this)" onmouseleave="onMouseLeave(this)">' + $scope.AliasConflict[i] +
                            '<i class="icon icon-check pos-rel" style="top:4px;display: none;float: right;"></i>' +
                            ' </span>';
                    }
                } else {
                    for (var i in $scope.SimilarityText) {
                        xh += '<span id="' + i + '"  class="auto-code-opts conflict-choices clickable font-size-Xlg option-as-label" ' +
                            'onclick="save(' + i + ', this)" onmouseenter="onMouseEnter(this)" onmouseleave="onMouseLeave(this)">' +
                            $scope.SimilarityText[i] +
                            '<i class="icon icon-check pos-rel" style="top:4px;display: none;float: right;"></i>' +
                            ' </span>';
                    }
                }
                xh += '<span id="ac-other"  class="auto-code-opts conflict-choices clickable option-as-label" onclick="saveAutocodeOther(undefined, this)" ' +
                    'onmouseenter="onMouseEnter(this)" onmouseleave="onMouseLeave(this)">' +
                    'Other' +
                    '<i class="icon icon-check pos-rel" style="top:4px;display: none;float: right;"></i>' +
                    '</span>';
                window.closeModal = function () {
                    NavigatorService.blockNavigation = false;
                    $scope.SaveAnswerAfterConflictResolved();
                    $scope.ConflictPopupBroadcast = false;
                    var page = document.getElementById('page');
                    var modal = document.getElementById("modal");
                    page.removeChild(modal);
                    delete window.saveAutocodeOther;
                    delete window.save;
                    delete window.onMouseEnter;
                    delete window.onMouseLeave;
                }
                return xh;
            }
        }
    }
})(angular);