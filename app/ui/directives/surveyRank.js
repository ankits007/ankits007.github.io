(function (angular) {
    "use strict";

    angular
        .module('SurveyEngine')
        .directive('surveyRank', ['SurveyEngine.Enums', 'SurveyEngine.RespondentService', '$templateCache', '$timeout', '$compile', surveyRank]);

    function surveyRank(enums, respondentService, $templateCache, $timeout, $compile) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            require: ['surveyRank', '^surveyQuestion'],
            restrict: 'E',
            // template: '<ng-include src="GetTemplateUrl()">'
        };

        return directive;

        function link(scope, element, attrs, ctrls) {

            scope.GetTemplateUrl = function () {
                var html = "";
                if (scope.qObject.QuestionType == enums.QuestionType.Rank) {
                    html = $templateCache.get('rank.html');
                } else {
                    html = $templateCache.get('rankSort.html');
                }
                return html;
            }

            var parentController = ctrls[1];
            // var orderedValues = ['Red', 'Blue', 'Orange'];

            var attributeIds = [];

            for (var i = 0; i < scope.qObject.QuestionLevelSequence.length; i++) {
                attributeIds.push(scope.qObject.QuestionLevelSequence[i].ID);
            }

            scope.ExpandImage = function (event) {
                scope.ExpandedImage = true;
                scope.ExpandedImageSource = event.currentTarget.previousSibling.currentSrc;
                var leftPosition = event.pageX;
                var topPosition = event.pageY;
                var expandedImageDiv = document.getElementById('ExpandedImageDiv');
                var elmnt = document.getElementById("scrollable");
                var x = elmnt.scrollLeft;
                var y = elmnt.scrollTop;
                expandedImageDiv.style.display = "block";
                expandedImageDiv.style.top = topPosition + y - 50 + "px";
            }

            scope.RemoveExpandedImage = function () {
                var expandedImageDiv = document.getElementById('ExpandedImageDiv');
                scope.ExpandedImageSource = "";
                expandedImageDiv.style.display = "none";
            }

            function changeUIAfterRemoval(event, removedIndex) {
                // for (var i = removedIndex; i < event.target.children.length; i++) {
                //     var length = event.target.children[i].innerText.length;
                //     event.target.children[i].innerText = event.target.children[i].innerText.substr(0, length - 1);

                //     //angular.element(event.target.children[i]).append(angular.element("<span style='background-color: grey; padding: 5px; float: right; color: #fff;line-height: 10px;border-radius: 2px;margin-right: 0px;'>" + (i + 1) + "</span>"))
                // }
                var list = document.getElementById('rankList');
                if (list.children.length > 0)
                    var rankingSpan = list.children[0].lastChild
                if (rankingSpan)
                    rankingSpan.remove();
                // for (var i = 0; i < event.target.children.length; i++) {
                //     if (event.target.children[i].innerText.substr(1, 1).indexOf('.') > -1) {
                //         event.target.children[i].innerText = (i + 1) + '.' + event.target.children[i].innerText.substr(2);
                //     } else {
                //         angular.element(event.target.children[i]).append(angular.element("<span style='background-color: grey; padding: 5px; float: right; color: #fff;line-height: 10px;border-radius: 2px;margin-right: 0px;'>" + (i + 1) + "</span>"))
                //     }
                // }
            }

            scope.BuildLists = function (listNumber) {
                require(['sortable'], function (sortable) {
                    if (typeof window.Sortable != "function") {
                        window.Sortable = sortable;
                    }
                    switch (listNumber) {
                        case 0:
                            // scope.ShowList = true;
                            var list = document.getElementById('rankList');

                            if (scope.AnsweredValues[0].length > 0){
                                for(var i = 0; i< list.children.length;i++){
                                    if(scope.List1Attributes.indexOf(list.children[i].innerText) > -1){
                                        list.children[i].remove();
                                    }
                                }
                            }
                            new Sortable(list, {
                                group: "words"
                            });
                            break;
                        case 1:

                            //For Rank question(with no groups)
                            if (scope.qObject.QuestionType == enums.QuestionType.Rank) {
                                var list2 = document.getElementById('rankList1');
                                var orderedValues = [];
                                var imagePresent = [];

                                if (scope.AnsweredValues[0].length > 0) {
                                    scope.ShowList = false;
                                    for (var i = 0; i < scope.AnsweredValues[0].length; i++) {
                                        if (scope.qObject.Attributes[attributeIds[scope.AnsweredValues[0][i] - 1]].Media[scope.language]) {
                                            orderedValues.push(scope.qObject.Attributes[attributeIds[scope.AnsweredValues[0][i] - 1]].Media[scope.language]);
                                            imagePresent[i] = true;
                                        } else {
                                            orderedValues.push(scope.qObject.Attributes[attributeIds[scope.AnsweredValues[0][i] - 1]].Text[scope.language]);
                                        }

                                        var groupId = scope.qObject.Attributes[attributeIds[scope.AnsweredValues[0][i] - 1]].GroupSequence[0];
                                        var variableId = scope.qObject.Groups[groupId].VariableSequence[0];
                                        scope.SortedList[0].push(scope.qObject.Variables[variableId]);
                                    }
                                    // for (var i = 0; i < list2.children.length; i++) {
                                    //     if (list2.children[i].innerText == "Drag Here") {
                                    //         list2.children[i].remove();
                                    //     }
                                    // }
                                    for (var i = 0; i < orderedValues.length; i++) {
                                        var newLI = document.createElement("li"),
                                            newContent = ''; // create a new li
                                        var rankElement = document.createElement("span");
                                        rankElement.innerText = i + 1;
                                        rankElement.className += ' rank-position';
                                        if (imagePresent[i] == true) {
                                            newContent = document.createElement("img");
                                            newContent.src = orderedValues[i];
                                            newContent.style.maxWidth = "100%";
                                            newContent.style.width = "100px";
                                            newContent.style.height = "auto";
                                        } else {
                                            newContent = document.createElement("span");
                                            newContent.innerText = orderedValues[i];
                                            newContent.className += 'font-size-75';
                                            newLI.className += 'padding-5 font-size pos-rel rank-text';
                                            newLI.style.cursor = "move";
                                            newLI.style.backgroundColor = "rgba(233,244,250,0.5)";
                                        }
                                        newLI.style["list-style"] = "none";
                                        // add the spelling list item to the li
                                        newLI.appendChild(newContent);
                                        newLI.appendChild(rankElement);

                                        list2.appendChild(newLI);
                                    }
                                } else {
                                    for (var i = 0; i < scope.qObject.QuestionLevelSequence.length; i++) {
                                        //Populating SortedList when user first lands on DnD Rank Question
                                        var attribute = scope.qObject.Attributes[scope.qObject.QuestionLevelSequence[i].ID],
                                            group = scope.qObject.Groups[attribute.GroupSequence[0]],
                                            variable = scope.qObject.Variables[group.VariableSequence[0]];
                                        scope.SortedList[0].push(variable);
                                    }
                                    for (var i = 0; i < scope.SortedList[0].length; i++) {
                                        parentController.SaveAnswer(scope.SortedList[0][i].Name, 4, i + 1, true, true);
                                        parentController.SaveAnswer(scope.RankVariables[0][i].Name, 1, scope.OriginalIndices[scope.SortedList[0][i].Name], true, true);
                                    }
                                }

                                new Sortable(list2, {
                                    group: "words",
                                    scroll: false,
                                    create: function () {
                                        var order = list.sortable('serialize');
                                        alert(order);
                                    },

                                    onUpdate: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;

                                        // for (var i = 0; i < event.target.children.length; i++) {
                                        //     var length = event.target.children[i].innerText.length;
                                        //     event.target.children[i].innerText = event.target.children[i].innerText.substr(0, length - 1);
                                        // }
                                        for (var i = 0; i < event.target.children.length; i++) {
                                            //If condition is deprecated. Only else condition persists
                                            if (event.target.children[i].innerText.substr(1, 1).indexOf('.') > -1) {
                                                event.target.children[i].innerText = (i + 1) + '.' + event.target.children[i].innerText.substr(2);
                                            } else {
                                                var rankPosition = event.target.children[i].getElementsByClassName('rank-position');
                                                if (rankPosition.length > 0) {
                                                    event.target.children[i].removeChild(rankPosition[0]);
                                                }
                                                angular.element(event.target.children[i]).append(angular.element("<span class='rank-position'>" + (i + 1) + "</span>"))
                                            }
                                        }
                                        var item = scope.SortedList[0][index];
                                        scope.SortedList[0].splice(index, 1);
                                        scope.SortedList[0].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[0].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[0][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[0][i].Name, 1, scope.OriginalIndices[scope.SortedList[0][i].Name], true, true);
                                        }
                                    },

                                    onAdd: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;
                                        var item;

                                        for (var i = 0; i < event.target.children.length; i++) {
                                            if (event.target.children[i].innerText == "Drag Here") {
                                                event.target.children[i].remove();
                                            }
                                        }

                                        for (var i = 0; i < event.target.children.length; i++) {
                                            event.target.style["listStyle"] = "none";
                                            if (event.target.children[i].childNodes)
                                                if (event.target.children[i].innerText.substr(1, 1).indexOf('.') > -1) {
                                                    event.target.children[i].innerText = (i + 1) + '.' + event.target.children[i].innerText.substr(2);
                                                } else {
                                                    var rankPosition = event.target.children[i].getElementsByClassName('rank-position');
                                                    if (rankPosition.length > 0) {
                                                        event.target.children[i].removeChild(rankPosition[0]);
                                                    }
                                                    angular.element(event.target.children[i]).append(angular.element("<span class='rank-position' style='background-color: grey; padding: 5px; float: right; color: #fff;line-height: 10px;border-radius: 2px;margin-right: 0px;'>" + (i + 1) + "</span>"));
                                                    var dragIcon = event.target.children[i].getElementsByClassName('fa-ellipsis-v');
                                                    if (dragIcon.length > 0) {
                                                        event.target.children[i].removeChild(dragIcon[0]);
                                                    }
                                                }

                                        }


                                        if (scope.MovedFromList != null) {
                                            item = scope.SortedList[scope.MovedFromList][scope.IndexInList];
                                            parentController.SaveAnswer(item.Name, 4, [], true, true);
                                            parentController.SaveAnswer(scope.RankVariables[scope.MovedFromList][scope.IndexInList].Name, 1, [], true, true);
                                            scope.SortedList[scope.MovedFromList].splice(scope.IndexInList, 1);
                                            scope.MovedFromList = null;
                                        } else {
                                            item = scope.NumericVariables[0][index];
                                            for (var i = 0; i < scope.NumericVariables.length; i++) {
                                                scope.NumericVariables[i].splice(index, 1);
                                            }
                                        }
                                        scope.SortedList[0].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[0].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[0][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[0][i].Name, 1, scope.OriginalIndices[scope.SortedList[0][i].Name], true, true);
                                        }
                                    },

                                    // onRemove: function (event) {
                                    //     var index = event.oldIndex;
                                    //     var newIndex = event.newIndex;

                                    //     var item = scope.SortedList[0][index];
                                    //     scope.SortedList[0].splice(index, 1);
                                    //     // scope.SortedList[0].splice(newIndex, 0, item);

                                    // },

                                    onStart: function (event) {
                                        scope.MovedFromList = 0;
                                        scope.IndexInList = event.oldIndex;
                                    }
                                });
                            }

                            //For Rank and Sort Question
                            else {
                                var list2 = document.getElementById('rankList1');
                                var orderedValues = [];

                                if (scope.AnsweredValues[0].length > 0) {
                                    scope.ShowList = false;
                                    for (var i = 0; i < scope.AnsweredValues[0].length; i++) {
                                        orderedValues.push(scope.qObject.Attributes[attributeIds[scope.AnsweredValues[0][i] - 1]].Text['en-us']);

                                        var groupId = scope.qObject.Attributes[attributeIds[scope.AnsweredValues[0][i] - 1]].GroupSequence[0];
                                        var variableId = scope.qObject.Groups[groupId].VariableSequence[0];
                                        scope.SortedList[0].push(scope.qObject.Variables[variableId]);
                                    }
                                    scope.List1Attributes = orderedValues;
                                    for (var i = 0; i < orderedValues.length; i++) {
                                        var newLI = document.createElement("li"),
                                            newContent = ''; // create a new li
                                        var rankElement = document.createElement("span");
                                        rankElement.innerText = i + 1;
                                        rankElement.className += ' rank-position';
                                        newContent = document.createTextNode(orderedValues[i]);

                                        newLI.style["list-style"] = "none";
                                        newLI.className += ' ranked-element';
                                        // add the spelling list item to the li
                                        newLI.appendChild(newContent);
                                        newLI.appendChild(rankElement);

                                        list2.appendChild(newLI);
                                    }
                                }
                                new Sortable(list2, {
                                    group: "words",

                                    onUpdate: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;

                                        scope.ChangeUIAfterUpdate(event);

                                        if (scope.MovedFromList != null) {
                                            scope.MovedFromList = null;
                                        }

                                        var item = scope.SortedList[0][index];
                                        scope.SortedList[0].splice(index, 1);
                                        scope.SortedList[0].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[0].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[0][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[0][i].Name, 1, scope.OriginalIndices[scope.SortedList[0][i].Name], true, true);
                                        }
                                    },

                                    onAdd: function (event) {
                                        if (scope.qObject.Properties.MaxRankableItems && scope.SortedList[0].length == parseInt(scope.qObject.Properties.MaxRankableItems)) {
                                            this.option("disabled", true);
                                        }
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;
                                        var item;

                                        scope.ChangeUIAfterDrag(event, newIndex);

                                        // if (scope.qObject.Properties.MaxRankableItems && event.target.children.length >= scope.qObject.Properties.MaxRankableItems) {
                                        //     this.option("disabled", true);
                                        // }


                                        if (scope.MovedFromList != null) {
                                            item = scope.SortedList[scope.MovedFromList][scope.IndexInList];
                                            parentController.SaveAnswer(item.Name, 4, [], true, true);
                                            parentController.SaveAnswer(scope.RankVariables[scope.MovedFromList][scope.IndexInList].Name, 1, [], true, true);
                                            scope.SortedList[scope.MovedFromList].splice(scope.IndexInList, 1);
                                            scope.MovedFromList = null;
                                        } else {
                                            item = scope.NumericVariables[0][index];
                                            for (var i = 0; i < scope.NumericVariables.length; i++) {
                                                scope.NumericVariables[i].splice(index, 1);
                                            }
                                        }
                                        scope.SortedList[0].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[0].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[0][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[0][i].Name, 1, scope.OriginalIndices[scope.SortedList[0][i].Name], true, true);
                                        }
                                    },

                                    onRemove: function (event) {
                                        var index = event.oldIndex;
                                        var item = scope.SortedList[0][index];
                                        parentController.SaveAnswer(scope.SortedList[0][index].Name, 4, [], true, true);
                                        parentController.SaveAnswer(scope.RankVariables[0][index].Name, 1, [], true, true);
                                        scope.SortedList[0].splice(index, 1);
                                        changeUIAfterRemoval(event, index);
                                    },

                                    onStart: function (event) {
                                        scope.MovedFromList = 0;
                                        scope.IndexInList = event.oldIndex;
                                    }
                                });
                            }
                            break;
                        case 2:
                            var list3 = document.getElementById('rankList2');
                            if (list3) {

                                //For pre-populating answers when coming back to a Rank Question
                                var orderedValues = [];

                                if (scope.AnsweredValues[1].length > 0) {
                                    scope.ShowList = false;
                                    for (var i = 0; i < scope.AnsweredValues[1].length; i++) {
                                        orderedValues.push(scope.qObject.Attributes[attributeIds[scope.AnsweredValues[1][i] - 1]].Text['en-us']);
                                        var groupId = scope.qObject.Attributes[attributeIds[scope.AnsweredValues[1][i] - 1]].GroupSequence[0];
                                        var variableId = scope.qObject.Groups[groupId].VariableSequence[0];
                                        scope.SortedList[1].push(scope.qObject.Variables[variableId]);
                                    }
                                    for (var i = 0; i < orderedValues.length; i++) {
                                        var newLI = document.createElement("li"),
                                            newContent = ''; // create a new li
                                        var rankElement = document.createElement("span");
                                        rankElement.innerText = i + 1;
                                        rankElement.className += ' rank-position';
                                        newContent = document.createTextNode(orderedValues[i]);


                                        newLI.style["list-style"] = "none";
                                        newLI.className += ' ranked-element';
                                        // add the spelling list item to the li
                                        newLI.appendChild(newContent);
                                        newLI.appendChild(rankElement);

                                        list3.appendChild(newLI);
                                    }
                                }


                                new Sortable(list3, {
                                    group: "words",
                                    // forceFallback: true,
                                    onUpdate: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;

                                        scope.ChangeUIAfterUpdate(event);

                                        if (scope.MovedFromList != null) {
                                            scope.MovedFromList = null;
                                        }

                                        var item = scope.SortedList[1][index];
                                        scope.SortedList[1].splice(index, 1);
                                        scope.SortedList[1].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[1].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[1][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[1][i].Name, 1, scope.OriginalIndices[scope.SortedList[1][i].Name], true, true);
                                        }
                                    },
                                    onAdd: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;
                                        var item;

                                        if (scope.qObject.Properties.MaxRankableItems && event.target.children.length >= scope.qObject.Properties.MaxRankableItems) {
                                            this.option("disabled", true);
                                        }

                                        scope.ChangeUIAfterDrag(event, newIndex);

                                        if (scope.MovedFromList != null) {
                                            item = scope.SortedList[scope.MovedFromList][scope.IndexInList];
                                            parentController.SaveAnswer(item.Name, 4, [], true, true);
                                            parentController.SaveAnswer(scope.RankVariables[scope.MovedFromList][scope.IndexInList].Name, 1, [], true, true);
                                            scope.SortedList[scope.MovedFromList].splice(scope.IndexInList, 1);
                                            scope.MovedFromList = null;
                                        } else {
                                            item = scope.NumericVariables[1][index];
                                            for (var i = 0; i < scope.NumericVariables.length; i++) {
                                                scope.NumericVariables[i].splice(index, 1);
                                            }
                                        }
                                        scope.SortedList[1].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[1].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[1][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[1][i].Name, 1, scope.OriginalIndices[scope.SortedList[1][i].Name], true, true);
                                        }
                                    },

                                    onStart: function (event) {
                                        scope.MovedFromList = 1;
                                        scope.IndexInList = event.oldIndex;
                                    },

                                    onRemove: function (event) {
                                        var index = event.oldIndex;

                                        changeUIAfterRemoval(event, index);
                                    },
                                });
                            }
                            break;
                        case 3:
                            var list4 = document.getElementById('rankList3');
                            if (list4) {

                                //For pre-populating answers when coming back to a Rank Question
                                var orderedValues = [];

                                if (scope.AnsweredValues[2].length > 0) {
                                    scope.ShowList = false;
                                    for (var i = 0; i < scope.AnsweredValues[2].length; i++) {
                                        orderedValues.push(scope.qObject.Attributes[attributeIds[scope.AnsweredValues[2][i] - 1]].Text['en-us']);
                                    }
                                    for (var i = 0; i < orderedValues.length; i++) {
                                        var newLI = document.createElement("li"), // create a new li
                                            newContent = document.createTextNode((i + 1) + '.' + orderedValues[i]);

                                        newLI.appendChild(newContent);

                                        list4.appendChild(newLI);
                                    }
                                }

                                new Sortable(list4, {
                                    group: "words",
                                    // forceFallback: true,
                                    onUpdate: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;

                                        scope.ChangeUIAfterUpdate(event);

                                        var item = scope.SortedList[2][index];
                                        scope.SortedList[2].splice(index, 1);
                                        scope.SortedList[2].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[2].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[2][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[2][i].Name, 1, scope.OriginalIndices[scope.SortedList[2][i].Name], true, true);
                                        }
                                    },
                                    onAdd: function (event) {
                                        var index = event.oldIndex;
                                        var newIndex = event.newIndex;
                                        var item;

                                        if (scope.qObject.Properties.MaxRankableItems && event.target.children.length >= scope.qObject.Properties.MaxRankableItems) {
                                            this.option("disabled", true);
                                        }

                                        scope.ChangeUIAfterDrag(event, newIndex);

                                        if (scope.MovedFromList != null) {
                                            //Clearing the answer from the list from which it is removed
                                            item = scope.SortedList[scope.MovedFromList][scope.IndexInList];
                                            parentController.SaveAnswer(item.Name, 4, [], true, true);
                                            parentController.SaveAnswer(scope.RankVariables[scope.MovedFromList][scope.IndexInList].Name, 1, [], true, true);
                                            scope.SortedList[scope.MovedFromList].splice(scope.IndexInList, 1);
                                            scope.MovedFromList = null;
                                        } else {
                                            item = scope.NumericVariables[2][index];
                                            for (var i = 0; i < scope.NumericVariables.length; i++) {
                                                scope.NumericVariables[i].splice(index, 1);
                                            }
                                        }
                                        scope.SortedList[2].splice(newIndex, 0, item);
                                        for (var i = 0; i < scope.SortedList[2].length; i++) {
                                            parentController.SaveAnswer(scope.SortedList[2][i].Name, 4, i + 1, true, true);
                                            parentController.SaveAnswer(scope.RankVariables[2][i].Name, 1, scope.OriginalIndices[scope.SortedList[2][i].Name], true, true);
                                        }
                                    },

                                    onStart: function (event) {
                                        scope.MovedFromList = 2;
                                        scope.IndexInList = event.oldIndex;
                                    },

                                    onRemove: function (event) {
                                        var index = event.oldIndex;

                                        changeUIAfterRemoval(event, index);
                                    },
                                });
                            }
                    }
                });
            }

            $timeout(function () {
                element.html(scope.GetTemplateUrl());
                $compile(element.contents())(scope);
            });
        }

        function controller($scope) {

            $scope.OriginalIndices = {};
            $scope.ShowAs = $scope.qObject.Properties.ShowAs;
            //if (checkForMobileBrowser(navigator.userAgent || navigator.vendor || window.opera)) {
            //    $scope.ShowAs = 6;
            //}
            $scope.ShowList = true;
            $scope.ticks = (new Date()).getTime();

            $scope.ChangeUIAfterDrag = changeUIAfterDrag;
            $scope.ChangeUIAfterUpdate = changeUIAfterUpdate;

            var j = 0,
                i = 0;

            for (var index = 0; index < $scope.qObject.QuestionLevelSequence.length; index++) {
                var attr = $scope.qObject.QuestionLevelSequence[index].ID;

                if (j == 0) {
                    $scope.NumberOfLists = $scope.qObject.Attributes[attr].GroupSequence.length;
                    $scope.RankVariables = new Array($scope.NumberOfLists);
                    $scope.NumericVariables = new Array($scope.NumberOfLists);
                    $scope.SortedList = new Array($scope.NumberOfLists);
                    $scope.AnsweredValues = new Array($scope.NumberOfLists);
                    $scope.GroupNames = [];

                    for (var i = 0; i < $scope.qObject.Attributes[attr].GroupSequence.length; i++) {
                        $scope.NumericVariables[i] = [];
                        $scope.SortedList[i] = [];
                        $scope.AnsweredValues[i] = [];
                    }
                }

                i = 0;
                for (var group in $scope.qObject.Attributes[attr].GroupSequence) {
                    var groupId = $scope.qObject.Attributes[attr].GroupSequence[group];
                    var groupObject = $scope.qObject.Groups[groupId];
                    if (j == 0) {
                        $scope.GroupNames[i] = groupObject.Text['en-us'];
                    }

                    for (var vars in groupObject.VariableSequence) {
                        var variableId = groupObject.VariableSequence[vars];
                        $scope.NumericVariables[i].push($scope.qObject.Variables[variableId]);
                    }

                    i++;
                }

                j++;
            }

            for (var attr in $scope.qObject.Attributes) {

                if ($scope.qObject.Attributes[attr].Text['en-us'] == 'rank_holder') {
                    $scope.RankVariables = new Array($scope.NumberOfLists);
                    var i = 0;
                    for (var group in $scope.qObject.Attributes[attr].GroupSequence) {
                        $scope.RankVariables[i] = [];
                        var rankGroupId = $scope.qObject.Attributes[attr].GroupSequence[group];
                        var rankGroupObject = $scope.qObject.Groups[rankGroupId];

                        for (var rankVars in rankGroupObject.VariableSequence) {
                            var rankVariableId = rankGroupObject.VariableSequence[rankVars];
                            $scope.RankVariables[i].push($scope.qObject.Variables[rankVariableId]);
                        }

                        i++;
                    }
                }
            }

            //Get answers for preloading when a user comes back
            for (var i = 0; i < $scope.RankVariables.length; i++) {
                for (var j = 0; j < $scope.RankVariables[i].length; j++) {
                    var answer = respondentService.GetVariableAnswers($scope.RankVariables[i][j].Name);
                    if (answer && answer.length > 0) {
                        $scope.AnsweredValues[i][j] = answer[0];
                    }
                }
            }

            for (var i = 0; i < $scope.NumericVariables.length; i++) {
                for (var j = 0; j < $scope.NumericVariables[i].length; j++) {
                    $scope.OriginalIndices[$scope.NumericVariables[i][j].Name] = j + 1;
                }
            }

            function changeUIAfterDrag(event, elementIndex) {
                var lengthToIterate;

                for (var i = 0; i < event.target.children.length; i++) {
                    if (event.target.children[i].innerText == "Drag Here") {
                        if (typeof event.target.children[i].remove == 'function') {
                            //If support  is found 
                            event.target.children[i].remove()
                        } else {
                            //If not
                            event.target.children[i].outerHTML = '';
                        }
                    }
                }


                lengthToIterate = event.target.children.length;


                for (var i = 0; i < lengthToIterate; i++) {
                    if ($scope.MovedFromList == undefined && i == elementIndex) {
                        continue;
                    } else {
                        var length = event.target.children[i].innerText.length;
                        event.target.children[i].innerText = event.target.children[i].innerText.substr(0, length - 1);
                    }
                }

                for (var i = 0; i < event.target.children.length; i++) {
                    event.target.style["listStyle"] = "none";
                    if (event.target.children[i].childNodes)
                        if (event.target.children[i].innerText.substr(1, 1).indexOf('.') > -1) {
                            event.target.children[i].innerText = (i + 1) + '.' + event.target.children[i].innerText.substr(2);
                        } else {
                            angular.element(event.target.children[i]).append(angular.element("<span class='assigned-rank' style='background-color: grey; padding: 5px; float: right; color: #fff;line-height: 10px;border-radius: 2px;margin-right: 0px;'>" + (i + 1) + "</span>"));
                            var dragIcon = event.target.children[i].getElementsByClassName('fa-ellipsis-v');
                            if (dragIcon.length > 0) {
                                event.target.children[i].removeChild(dragIcon[0]);
                            }
                        }

                }
            }

            function changeUIAfterUpdate(event) {
                for (var i = 0; i < event.target.children.length; i++) {
                    var length = event.target.children[i].innerText.length;
                    event.target.children[i].innerText = event.target.children[i].innerText.substr(0, length - 1);
                }
                for (var i = 0; i < event.target.children.length; i++) {
                    if (event.target.children[i].innerText.substr(1, 1).indexOf('.') > -1) {
                        event.target.children[i].innerText = (i + 1) + '.' + event.target.children[i].innerText.substr(2);
                    } else {
                        angular.element(event.target.children[i]).append(angular.element("<span style='background-color: grey; padding: 5px; float: right; color: #fff;line-height: 10px;border-radius: 2px;margin-right: 0;'>" + (i + 1) + "</span>"))
                    }
                }
            }
        }
    }
})(angular);