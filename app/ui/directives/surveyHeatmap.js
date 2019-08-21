(function (angular) {

    "use strict";

    angular
        .module('SurveyEngine')
        .directive('surveyHeatmap', ["SurveyEngine.Enums", "SurveyEngine.RespondentService", '$timeout', surveyHeatmap]);

    function surveyHeatmap(enums, respondentService, $timeout) {
        return {
            restrict: 'A',
            link: canvasLink,
            scope: false,
            controller: ['$scope', canvasController]
        }

        function canvasLink(scope, element, attrs) {
            var canvas,
                categoryVariable,
                lastCreatedObject,
                lastActiveObject,
                objectTy,
                mouseClickCounts = 0,
                variableAnalysisTextMapping = {},
                circles = [],
                answers = {},
                categoryAnswers = {},
                categoryAnswer = [],
                clickedSequence = [],
                regionSelected = {};

            var properties = scope.qObject.Properties;

            init();

            function init() {
                analysisTextVariableNameMapping();
                $timeout(function () {
                    canvas = new fabric.Canvas('mainCanvas' + scope.qObject.Name, { preserveObjectStacking: true });
                    categoryVariable = scope.qObject.Variables[scope.qObject.QuestionLevelSequence[0].ID];
                    populateHeatMapAnswers();
                    populateCategoryAnswers();

                    if (scope.qObject.Properties.MediaPath) {
                        setCanvasSize(scope.qObject.Properties.MediaPath);
                        canvas.setBackgroundImage(scope.qObject.Properties.MediaPath, canvas.renderAll.bind(canvas));
                    }

                    createRegions();

                    //registering events
                    canvas.on({
                        'mouse:down': mouseDownHandler,
                        'mouse:over': mouseHoverHandler,
                        'mouse:out': mouseOutEvent
                    });
                });
            }

            //Event Handling Functions
            function mouseDownHandler(event) {
                event.e.preventDefault();
                mouseClickCounts++;
                var requiredCanvas = document.getElementById('mainCanvas' + scope.qObject.Name);
                var rect = requiredCanvas.getBoundingClientRect();
                var x, y;
                if (!event.e.clientX) {
                    x = event.e.touches[0].clientX - rect.left;
                    y = event.e.touches[0].clientY - rect.top;
                }
                else {
                    x = event.e.clientX - rect.left;
                    y = event.e.clientY - rect.top;
                }
                var indexToInsert = mouseClickCounts % parseInt(properties.MaxClicks);
                if (indexToInsert == 0) {
                    indexToInsert = parseInt(properties.MaxClicks);
                }
                if (scope.qObject.QuestionType == enums.QuestionType.HeatMap) {
                    replaceSelectedPointCircles(x, y, mouseClickCounts);
                    var xAnalysisText = indexToInsert + '_' + 'X';
                    var yAnalysisText = indexToInsert + '_' + 'Y';
                    scope.SaveAnswer(variableAnalysisTextMapping[xAnalysisText], enums.VariableType.Numeric, x, true, false);
                    scope.SaveAnswer(variableAnalysisTextMapping[yAnalysisText], enums.VariableType.Numeric, y, true, false);
                }
                if (canvas.getActiveObject()) {
                    if (scope.qObject.QuestionType == enums.QuestionType.HeatZone) {
                        toggleOption();
                        replaceSelectedOption(indexToInsert);
                    }
                    else {
                        canvas.getActiveObject().setFill("green");
                    }
                    regionSelected[indexToInsert] = canvas.getActiveObject().ID;
                    saveCategoryAnswer();
                }
                else {
                    if (regionSelected[indexToInsert]) {
                        clearCategoryAnswer(indexToInsert);
                    }
                }
            }
            function replaceSelectedOption() {
                var selectedOptionsCount = 0;
                for (var id in categoryAnswers) {
                    if (categoryAnswers[id])
                        selectedOptionsCount++;
                }
                if (selectedOptionsCount > parseInt(properties.MaxClicks)) {
                    categoryAnswers[clickedSequence[0]] = false;
                    fillColor(clickedSequence[0], 'red');
                    clickedSequence.splice(0, 1);
                }
            }
            function toggleOption() {
                var target = canvas.getActiveObject();
                var id = target.ID;
                categoryAnswers[id] = !categoryAnswers[id];
                if (categoryAnswers[id]) {
                    // fillColor(id, 'green');
                    target.setFill("green");
                    clickedSequence.push(id);
                }
                else {
                    target.setFill("red");
                    var index = clickedSequence.indexOf(id);
                    clickedSequence.splice(index, 1);
                }
                canvas.renderAll();
            }
            function fillColor(objectID, color) {
                var objects = canvas.getObjects();
                for (var i in objects) {
                    if (objects[i].ID == objectID) {
                        objects[i].set({
                            'fill': color,
                            'opacity': 0.3
                        });
                        break;
                    }
                }
            }
            function mouseHoverHandler(event) {
                if (!event.target)
                    return;
                if (event.target.type == 'circle')
                    return;
                if (properties.Visibility == enums.HeatmapProperties.HiddenUntilHover && event.target && event.target.ID) {
                    if (scope.qObject.QuestionType == enums.QuestionType.HeatZone && categoryAnswers[event.target.ID]) {
                        event.target.setFill("green");
                    }
                    else {
                        event.target.setFill("red");
                    }
                    event.target.setStroke("black");
                    canvas.renderAll();
                }
            }

            function mouseOutEvent(event) {
                if (event.target && event.target.type == 'circle')
                    return;
                if (properties.Visibility == enums.HeatmapProperties.HiddenUntilHover && event.target) {
                    event.target.setFill("transparent");
                    event.target.setStroke("transparent");
                    canvas.renderAll();
                }
            }

            function saveCategoryAnswer() {
                if (scope.qObject.QuestionType == enums.QuestionType.HeatZone) {
                    var answers = [];
                    for (var key in categoryAnswers) {
                        if (categoryAnswers[key]) {
                            answers.push(parseInt(key));
                        }
                    }
                    scope.SaveAnswer(categoryVariable.Name, enums.VariableType.MultipleChoice, answers, true, true);
                }
                else {
                    var answers = respondentService.GetVariableAnswers(categoryVariable.Name);
                    var selectedAnswer = parseInt(canvas.getActiveObject().ID);

                    for (var i = 0; i < answers.length; i++) {
                        answers[i] = parseInt(answers[i]);
                    }

                    if (answers.indexOf(selectedAnswer) == -1) {
                        answers.push(selectedAnswer);
                        scope.SaveAnswer(categoryVariable.Name, enums.VariableType.MultipleChoice, answers, true, true);
                    }
                }
            }

            function clearCategoryAnswer(indexToInsert) {
                var answers = respondentService.GetVariableAnswers(categoryVariable.Name);
                var answerToRemove = parseInt(regionSelected[indexToInsert]);

                if (answers.indexOf(answerToRemove) > -1) {
                    answers.splice(answers.indexOf(regionSelected[indexToInsert]), 1);
                    scope.SaveAnswer(categoryVariable.Name, enums.VariableType.MultipleChoice, answers, true, true);
                }
                if (properties.Visibility == enums.HeatmapProperties.AlwaysHidden || properties.Visibility == enums.HeatmapProperties.HiddenUntilHover) {
                    fillColor(regionSelected[indexToInsert], 'transparent');
                }
                else {
                    fillColor(regionSelected[indexToInsert], 'red');
                }

            }

            function createRegions() {
                var region;
                for (var optId in categoryVariable.Options) {
                    var regionConfig = categoryVariable.Options[optId].heatMapConfig;
                    regionConfig.hoverCursor = "default";
                    regionConfig.lockMovementY = true;
                    regionConfig.lockMovementX = true;
                    regionConfig.hasControls = false;

                    if (properties.Visibility == enums.HeatmapProperties.AlwaysHidden || properties.Visibility == enums.HeatmapProperties.HiddenUntilHover) {
                        regionConfig.fill = "transparent";
                        regionConfig.borderColor = "transparent";
                        regionConfig.stroke = "transparent";
                    }

                    if (regionConfig.radius) {
                        region = new fabric.Circle(regionConfig)
                    }
                    else {
                        region = new fabric.Rect(regionConfig);
                    }
                    //if answered
                    if (categoryAnswer.indexOf(optId) > -1 || categoryAnswer.indexOf(parseInt(optId)) > -1) {
                        categoryAnswers[optId] = true;
                        if (properties.Visibility == enums.HeatmapProperties.AlwaysVisible) {
                            region.setFill("green");
                            region.setStroke("black");
                        }
                    }
                    else {
                        categoryAnswers[optId] = false;
                    }
                    canvas.add(region);
                }
            }

            function replaceSelectedPointCircles(x, y, count) {
                if (scope.qObject.QuestionType == enums.QuestionType.HeatZone && !canvas.getActiveObject()) {
                    return;
                }
                var target = canvas.getActiveObject();
                var maxClicksAllowed = parseInt(properties.MaxClicks);
                var position = count % maxClicksAllowed;

                if (position == 0) {
                    position = maxClicksAllowed;
                }

                if (circles[position - 1]) {
                    canvas.remove(circles[position - 1]);
                    circles[position - 1].left = x;
                    circles[position - 1].top = y;
                } else {
                    var circle = new fabric.Circle({
                        radius: 5,
                        stroke: '#0000cd',
                        strokeWidth: 1,
                        fill: 'transparent',
                        top: y,
                        left: x,
                        hoverCursor: 'default',
                        type: 'circle',
                        lockMovementX: true,
                        lockMovementY: true,
                        hasControls: false,
                    });
                    circles[position - 1] = circle;
                }

                for (var i = 0; i < circles.length; i++) {
                    canvas.add(circles[i]);
                }
            }

            function getLabelConfiguration(region) {
                var labelConfig = {};
                labelConfig.height = 30;
                labelConfig.width = region.width;
                labelConfig.top = region.width + region.top + 30;
                labelConfig.left = region.left - (region.width / 2);
                // labelConfig.fill = 'rgba(0,0,0,0)';
                // labelConfig.stroke = 'white';
                //labelConfig.strokeWidth = 2;
                // labelConfig.fontFamily = 'arial white';
                labelConfig.backgroundColor = 'white';
                labelConfig.borderColor = 'rgb(0,0,128,1.0)';
                labelConfig.fontSize = 20;
                labelConfig.hasControls = false;
                // labelConfig.hasRotatingPoint = false;
                labelConfig.lockMovementX = true;
                labelConfig.lockMovementY = true;
                // labelConfig.lockRotation = true;
                // labelConfig.lockScalingX = true;
                // labelConfig.lockScalingY = true;
                labelConfig.textAlign = 'center';
                labelConfig.ID = region.ID;
                return labelConfig;
            }
            function setCanvasSize(url) {
                var img = new Image();
                img.addEventListener("load", function () {
                    canvas.setHeight(this.naturalHeight);
                    canvas.setWidth(this.naturalWidth);
                });
                img.src = url;
            }

            function analysisTextVariableNameMapping() {
                for (var i = 0; i < scope.qObject.QuestionLevelSequence.length; i++) {
                    var variable = scope.qObject.Variables[scope.qObject.QuestionLevelSequence[i].ID];
                    if (variable.AnalysisText[scope.language].indexOf('_') > -1) {
                        var analysisText = variable.AnalysisText[scope.language].split('_')[1] + '_' + variable.AnalysisText[scope.language].split('_')[2];
                        variableAnalysisTextMapping[analysisText] = variable.Name;
                    }
                }
            }

            function populateHeatMapAnswers() {
                for (var i = 1; i < scope.qObject.QuestionLevelSequence.length; i++) {
                    var varName = scope.qObject.Variables[scope.qObject.QuestionLevelSequence[i].ID].Name;
                    var varAnalysisText = scope.qObject.Variables[scope.qObject.QuestionLevelSequence[i].ID].AnalysisText[scope.language];
                    var tempArray = varAnalysisText.split('_');
                    if (!answers[tempArray[1]]) {
                        answers[tempArray[1]] = {};
                    }

                    answers[tempArray[1]][tempArray[2]] = respondentService.GetVariableAnswers(varName)[0];
                }
                createCirclesArray();
            }
            function populateCategoryAnswers() {
                categoryAnswer = respondentService.GetVariableAnswers(categoryVariable.Name);
                clickedSequence = categoryAnswer;
            }
            function createCirclesArray() {
                var image = new Image();
                image.src = scope.qObject.Properties.MediaPath;
                image.onload = function () {
                    var requiredCanvas = document.getElementById('mainCanvas' + scope.qObject.Name);
                    var rect = requiredCanvas.getBoundingClientRect();
                    for (var index in answers) {
                        if (answers[index]['Y']) {
                            var position = parseInt(index);
                            var top = parseInt(answers[index]['Y']) + requiredCanvas.offsetTop;
                            var left = parseInt(answers[index]['X']) + requiredCanvas.offsetLeft;
                            var circle = new fabric.Circle({
                                radius: 5,
                                stroke: '#0000cd',
                                strokeWidth: 1,
                                fill: 'transparent',
                                top: top,
                                left: left,
                                type: 'circle',
                                lockMovementX: true,
                                lockMovementY: true,
                                hasControls: false,
                            });
                            circles[position - 1] = circle;
                        }
                    }

                    for (var i = 0; i < circles.length; i++) {
                        canvas.add(circles[i]);
                    }
                }
            }
        }

        function canvasController($scope) {
        }
    }
})(angular);