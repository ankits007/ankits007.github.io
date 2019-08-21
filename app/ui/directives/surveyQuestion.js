(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")


        .directive("surveyQuestion", ['SurveyEngine.RespondentService', 'SurveyEngine.Enums', 'SurveyEngine.SurveySettings',
            'EngineCore.TraversalListService', '$interpolate', '$sce', 'EngineCore.CommunicationService', '$timeout', '$interval',
            '$window', '$templateCache', '$compile', "SurveyEngine.NavigatorService", "SurveyEngine.PageRouteService", 'SurveyEngine.ValidatorService', question
        ]);


    function question(respondentService, enums, surveySettings, TraversalListService, $interpolate, $sce, CommunicationService,
                      $timeout, $interval, $window, $templateCache, $compile, NavigatorService, PageRouteService, ValidatorService) {
        var directive = {
            link: link,
            controller: ['$scope', '$rootScope', '$sce', '$compile', controller],
            restrict: 'E',
            scope: {
                qObject: '=',
                language: '@',
                default: '@',
                review: '=?'
            }
            // templateUrl: 'views/singleChoice.html'
        };
        return directive;

        function link(scope, element, attrs) {
            var interval;
            var fullScreenDivElement = null;
            var currentImg = null;

            scope.GetTemplateUrl = function () {
                var html = '';
                switch (scope.qObject && scope.qObject.QuestionType) {
                    case enums.QuestionType.SingleChoice:

                        if (scope.qObject.Properties.hasOwnProperty('Gamify') && scope.qObject.Properties.Gamify == 'true') {
                            html = $templateCache.get('singleChoiceGamify.html');
                        } else {
                            html = $templateCache.get('singleChoice.html');
                        }
                        break;
                    case enums.QuestionType.MultipleChoice:
                        html = $templateCache.get('singleChoice.html');
                        break;
                    case enums.QuestionType.Text:
                        html = $templateCache.get('text.html');
                        break;
                    case enums.QuestionType.Numeric:
                        html = $templateCache.get('numeric.html');
                        break;
                    case enums.QuestionType.DateTime:
                        html = $templateCache.get('datetime.html');
                        break;
                    case enums.QuestionType.ComplexGrid:
                    case enums.QuestionType.SimpleGrid:
                    case enums.QuestionType.TextGrid:
                    case enums.QuestionType.NumericGrid:
                    case enums.QuestionType.ConstantSumGrid:
                    case enums.QuestionType.Distribution:
                    case enums.QuestionType.Distribution2:
                    case enums.QuestionType.Slider:
                        html = $templateCache.get('GridQuestion.html');
                        break;
                    case enums.QuestionType.MaxDiff:
                        html = $templateCache.get('MaxDiffQuestion.html');
                        break;
                    case enums.QuestionType.NPS:
                        html = $templateCache.get('nps.html');
                        break;
                    case enums.QuestionType.Display:
                        scope.path = "";
                        if (scope.qObject.Properties.MediaPath) {
                            scope.path = $sce.trustAsResourceUrl(scope.qObject.Properties.MediaPath);
                        }
                        html = $templateCache.get('displayText.html');
                        break;
                    case enums.QuestionType.Rank:
                    case enums.QuestionType.RankAndSort:
                        html = $templateCache.get('RankQuestion.html');
                        break;
                    case enums.QuestionType.Smiley:
                    case enums.QuestionType.LikeDislike:
                    case enums.QuestionType.Stars:
                        html = $templateCache.get('RatingQuestion.html');
                        break;
                    case enums.QuestionType.MultimediaCapture:
                        html = $templateCache.get('CaptureQuestion.html');
                        break;
                    case enums.QuestionType.HeatMap:
                    case enums.QuestionType.HeatZone:
                        html = $templateCache.get('HeatMapQuestion.html');
                        break;
                    case enums.QuestionType.AutocodeText:
                        html = $templateCache.get('AutocodeQuestion.html');
                        break;
                    case enums.QuestionType.OTP:
                        html = $templateCache.get('otp.html');
                        break;
                }
                return html //; $sce.trustAsHtml(html);
            };
            scope.ShowFullScreen = function () {
                var parent = angular.element(element);
                var allImgages = parent.find('img');
                angular.forEach(allImgages, function (ele) {
                    currentImg = angular.element(ele);
                    if (currentImg.hasClass('rank-img-expand')) {
                        currentImg.attr('src', scope.qObject.Properties.MediaPath);
                        fullScreenDivElement = currentImg.parent();
                        fullScreenDivElement.css('display', 'block');
                        //currentImg.css('height', fullScreenDivElement[0].clientHeight - 50 + 'px');
                        scaleImg(currentImg);
                        angular.element($window).on('resize', resize);
                    }
                });
            };

            scope.HideFullScreen = function () {
                if (fullScreenDivElement != null) {
                    fullScreenDivElement.css('display', 'none');
                }
                if (currentImg != null) {
                    currentImg.css('height', '');
                    currentImg.css('width', '');
                    angular.element($window).off('resize', resize);
                }
            };

            //backward compatibility code for making grids mobile friendly
            if ((scope.qObject.QuestionType == enums.QuestionType.NumericGrid || scope.qObject.QuestionType == enums.QuestionType.TextGrid ||
                scope.qObject.QuestionType == enums.QuestionType.Distribution) && !scope.qObject.Properties.MobileFriendly) {
                scope.qObject.Properties.MobileFriendly = 'true';
            }

            function resize() {
                if (currentImg != null) {
                    scope.HideFullScreen();
                    scope.ShowFullScreen();
                }
            }

            function scaleImg() {
                var width = currentImg[0].width,
                    height = currentImg[0].height,
                    clientHeight = fullScreenDivElement[0].clientHeight - 50,
                    clientWidth = fullScreenDivElement[0].clientWidth - 30,
                    imgRatio = width / height;

                var cal_width = parseInt(clientHeight * imgRatio),
                    cal_height = parseInt(clientWidth / imgRatio);

                if (cal_height > clientHeight) {
                    currentImg.css('width', cal_width + 'px');
                } else {
                    currentImg.css('height', cal_height + 'px');
                }
                if (cal_width > clientWidth) {
                    currentImg.css('height', cal_height + 'px');
                } else {
                    currentImg.css('width', cal_width + 'px');
                }
                //currentImg.css('height',);
            }

            function compileQuestionHTML() {
                element.html(scope.GetTemplateUrl());
                var content = $compile(element.contents())(scope);
                content.addClass('animated');

                if (respondentService.GetAnimation()) {
                    content.addClass(respondentService.GetAnimation());
                }
                applyMarginLeftToSVContainer();
            }

            loadModules();

            function loadModules() {
                var requireHandsOnTable = scope.qObject.QuestionType == enums.QuestionType.SimpleGrid || scope.qObject.QuestionType == enums.QuestionType.ComplexGrid ||
                    scope.qObject.QuestionType == enums.QuestionType.TextGrid || scope.qObject.QuestionType == enums.QuestionType.NumericGrid ||
                    scope.qObject.QuestionType == enums.QuestionType.ConstantSumGrid ||
                    scope.qObject.QuestionType == enums.QuestionType.Slider || scope.qObject.QuestionType == enums.QuestionType.Distribution2;

                var requireGamify = scope.qObject.Properties.hasOwnProperty('Gamify') && scope.qObject.Properties.Gamify == 'true';
                var requireFabricJS = scope.qObject.QuestionType == enums.QuestionType.HeatMap ||
                    scope.qObject.QuestionType == enums.QuestionType.HeatZone;

                if (requireHandsOnTable && !scope.isMobileFriendlyEnabled()) {
                    require(['handsontable'], function (Handsontable) {
                        $timeout(function () {
                            compileQuestionHTML();
                        })
                    });
                } else if (requireFabricJS) {
                    require(['fabric'], function () {
                        $timeout(function () {
                            compileQuestionHTML();
                        })
                    });
                } else if (requireGamify) {
                    require(['winwheel'], function () {
                        $timeout(function(){
                            compileQuestionHTML();
                        });
                    })
                } else {
                    if (scope.qObject.Properties.MediaType == enums.MediaType.Picture && scope.qObject.Properties.MediaPath) {
                        var preloadImg = new Image;
                        preloadImg.onload = function () {
                            compileQuestionHTML();
                        };
                        preloadImg.onerror = function () {
                            compileQuestionHTML();
                        };
                        preloadImg.src = scope.qObject.Properties.MediaPath;
                    } else {
                        compileQuestionHTML();
                    }
                }
            }

            function applyMarginLeftToSVContainer() {
                $timeout(function () {
                    var quesCount = document.getElementsByClassName('sq-name');
                    for (var i = 0; i < quesCount.length; i++) {
                        var questionNameElement = document.getElementsByClassName('sq-name')[i];
                        var svContainer = document.getElementsByClassName('sv-container')[i];
                        if (questionNameElement && svContainer) {
                            questionNameElement = questionNameElement.clientWidth;
                            svContainer.style.marginLeft = questionNameElement + "px";
                        }
                    }
                    applyPaddingToQuestion();
                }, 200);
            }

            function applyPaddingToQuestion() {
                if (surveySettings.QuestionPerPage && surveySettings.QuestionPerPage != 1) {
                    return;
                }
                var surveyParent = document.getElementById("surveyParent");
                // var sectionHeader = document.getElementsByClassName("section-header")[0];
                var card = document.getElementsByClassName("card")[0];
                if (surveyParent && card) {
                    var surveyHeight = surveyParent.offsetHeight;
                    //  var sectionHeight = sectionHeader.offsetHeight;
                    var cardHeight = card.offsetHeight;
                    var diff = surveyHeight - cardHeight // - sectionHeight;
                    if (diff > 20) {
                        card.style.marginTop = (diff / 2) - 10 + 'px';
                        //  card.style.marginBottom = (diff / 2)-15 + 'px';
                    } else {
                        card.style.marginTop = 0 + 'px';
                    }
                }
            }

            function scrollInView() {
                if (!document.activeElement)
                    return;
                document.activeElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
                });
            }

            function onVideoEndListener() {
                scope.qObject.IsMandatory = enums.Mandatory.NotMandatory;
            }

            $timeout(function () {
                if (window.jsrcb.isMobile) {
                    var inputs = document.getElementsByClassName('input-txt');
                    angular.forEach(inputs, function (d) {
                        d.addEventListener('focus', scope.focusListener);
                        d.addEventListener('blur', scope.blurListener);
                    });
                }
            });

            scope.focusListener = function () {
                var card = document.getElementsByClassName("card")[0];
                if (surveySettings.QueryParameter.ProjectGUID == "eccaad3e-59b1-6af8-1407-4a3baf54c153" || surveySettings.QueryParameter.ProjectGUID =="667c7173-1f74-3df1-a120-300ed209a6f9"||surveySettings.QueryParameter.ProjectGUID == "f76d3305-cd28-097f-7201-d7548565b28e") {
                    var surveyParent = document.getElementById('surveyParent');
                    var footerHeight = document.getElementById("survey-bottomHdr").offsetHeight;
                    var footerLinks = document.getElementsByClassName('footerRTE')[0];
                    if (surveyParent) {
                        surveyParent.style.height = (surveyParent.offsetHeight) - footerHeight - 120 + 'px';
                    }
                    if (card) {
                        card.style.marginTop = 0 + 'px';
                    }                   
                    if (footerLinks) {
                        footerLinks.style.display = "none";
                    }
                }
                else {
                    var bottom = document.getElementById('survey-bottomHdr');
                    if (bottom) {
                        bottom.style.display = "none";
                    }
                    if (card) {
                        card.style.marginTop = 0 + 'px';
                    }
                }
                $timeout(function () {
                    scrollInView();
                });
            };

            window.onresize = function (event) {
                if (window.jsrcb.isMobile) {
                    event.preventDefault();
                    window.jsrcb.isKeypadOpen = ! window.jsrcb.isKeypadOpen;
                    if(document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")){
                        if (window.jsrcb.isKeypadOpen) {
                            scope.focusListener();
                        } else {
                            scope.blurListener();
                        }
                    }else{
                        scope.blurListener();
                    }
                }
            };

            scope.blurListener = function () {
                $timeout(function () {
                    if (surveySettings.QueryParameter.ProjectGUID == "eccaad3e-59b1-6af8-1407-4a3baf54c153" || surveySettings.QueryParameter.ProjectGUID =="667c7173-1f74-3df1-a120-300ed209a6f9"||surveySettings.QueryParameter.ProjectGUID == "f76d3305-cd28-097f-7201-d7548565b28e") {
                        var surveyParent = document.getElementById('surveyParent');
                        var footerLinks = document.getElementsByClassName('footerRTE')[0];
                        if (footerLinks)
                        {
                         footerLinks.style.display = "block";
                        }
                        var footerHeight = document.getElementById("survey-bottomHdr").offsetHeight;                       
                        if (surveyParent) {
                            surveyParent.style.height = (surveyParent.offsetHeight) + footerHeight + 120 + 'px';
                        }                        
                        
                    }
                   else {
                        var bottom = document.getElementById('survey-bottomHdr');
                        if (bottom) {
                            bottom.style.display = "block";
                        }
                    }
                    applyPaddingToQuestion();
                }, 100);
            };

            scope.$on('table-drawn', function () {
                applyPaddingToQuestion();
            });

            scope.$on("VideoLoaded", function (ev, ele) {
                ele.addEventListener('ended', onVideoEndListener, false);
                applyPaddingToQuestion();

            });

            scope.$on("adjust-question-height", function (ev, data) {
                applyPaddingToQuestion();
            });

            scope.$on("ResourceLoaded", function (ev, msge) {
                if (scope.qObject.Properties.AutoDisappear == "true" && scope.qObject.Properties.DisappearTime) {
                    scope.timeRemaining = parseInt(scope.qObject.Properties.DisappearTime);
                    if (!isNaN(scope.timeRemaining)) {
                        $timeout(function () {
                            NavigatorService.blockNavigation = false;
                            var footer = document.getElementById("survey-bottomHdr");
                            if (footer) {
                                footer.style.zIndex = 9999;
                            }
                            var header = document.getElementById("header_top");
                            if (header) {
                                header.style.zIndex = 0;
                            }
                            scope.HideFullScreen();
                            $interval.cancel(interval);
                            angular.element($window).off('resize', resize);
                            PageRouteService.RunPostValidation(enums.ValidationType.Valid);
                        }, scope.timeRemaining * 1000);
                        interval = $interval(function () {
                            scope.timeRemaining--;
                        }, 1000);
                        scope.ShowFullScreen();
                        NavigatorService.blockNavigation = true;
                        var footer = document.getElementById("survey-bottomHdr");
                        if (footer) {
                            footer.style.zIndex = -99999;
                        }
                        var header = document.getElementById("header_top");
                        if (header) {
                            header.style.zIndex = -99999;
                        }
                    }
                }
                applyPaddingToQuestion();
                if (surveySettings.IsSurveyVW()) {
                    require(['handsontable'], function (Handsontable) {
                    });
                }
            });
        }

        function controller($scope, $rootScope, $sce, $compile) {
            if ($scope.qObject == null || $scope.qObject == undefined) {
                console.error('question object cannot be null or undefined');
                return;
            }
            var Hints = surveySettings.GetHints();
            var Placeholders = surveySettings.GetPlaceholders();
            var processedSequence = [];
            $scope.ShowQuestionNumber = surveySettings.ShowQuestionNumber;
            $scope.ShowMandatoryStar = false;
            $scope.AnswerInvalid = false;
            $scope.IsImage = false,
                $scope.IsAudio = false,
                $scope.IsVideo = false;
            $scope.Total = {
                sum: [],
                conditionMet: []
            };
            $scope.EnteredOTP = ValidatorService.QuestionOTPMap[$scope.qObject.ID] || [];

            $scope.OtherAttributeAnswer = {};
            $scope.FirstClick = true;
            $scope.GenerateMobileGridHtml = generateMobileGridHtml;
            $scope.SaveImage = saveImage;
            $scope.EditMedia = editMedia;
            $scope.editMode = false;
            $scope.receivedMedia = '';
            $scope.isMobileDevice = window.jsrcb.isMobile;
            $scope.platform = CommunicationService.PLATFORM;
            $scope.rowVariables = {};

            $scope.StartRecording = startRecording;
            $scope.StopRecording = stopRecording;
            $scope.PlayRecording = playRecording;
            $scope.SaveOtherAttributeValue = saveOtherAttributeValue;
            $scope.isMobileFriendlyEnabled = isMobileFriendlyEnabled;

            $scope.ShiftFocus = shiftFocusForOTP;
            $scope.SendOTP = sendOTP;
            $scope.VerifyOTP = verifyOTP;
            $scope.VerifiedQuestionOTPMap = ValidatorService.VerifiedQuestionOTPMap;

            $scope.DataAvailable = false;
            $scope.StopButtonText = "Save data";
            var videoElement, audioElement, mediaRecorder, mimeType, blobs = [],
                allowSingleAnswerInRow = {},
                show = false;

            $scope.ErrorConfig = {
                'ShowError': false,
                'Message': '',
                'Style': {}
            };

            ValidatorService.AddErrorCallback(errorCallback, $scope.qObject.ID);
            ValidatorService.AddHideErrorCallback(hideErrorCallback, $scope.qObject.ID);

            //find exclusive variables
            if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid) {
                for (var attrId in $scope.qObject.Attributes) {
                    var attr = $scope.qObject.Attributes[attrId];
                    for (var grpIndex in attr.GroupSequence) {
                        var grp = $scope.qObject.Groups[attr.GroupSequence[grpIndex]];
                        for (var varIndex in grp.VariableSequence) {
                            var variable = $scope.qObject.Variables[grp.VariableSequence[varIndex]]
                            if (attr.IsExclusiveAcrossColumn)
                                allowSingleAnswerInRow[variable.Name] = variable;
                        }
                    }
                }
            }

            initialize();

            function initialize() {
                //Create Variable-Attribute Mapping
                createAtrributeVariableMapping();
            }

            if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid || $scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                $scope.AttributePointer = $scope.qObject.QuestionLevelSequence[0].ID;
            }
            if ($scope.qObject.QuestionType == enums.QuestionType.TextGrid || $scope.qObject.QuestionType == enums.QuestionType.NumericGrid) {
                $scope.ColumnIndexPointer = 0;
            }

            if ($scope.default) {
                $scope.DefaultLanguage = $scope.default;
            } else {
                $scope.DefaultLanguage = surveySettings.GetDefaultLanguage();
            }

            //Getting the media captured
            if ($scope.qObject.QuestionType == enums.QuestionType.MultimediaCapture) {

                var respID = respondentService.GetRespondentID(),
                    fileName = getMediaFileName();
                CommunicationService.GetMedia(fileName, respID).then(function (response) {
                    var blob, bloburl, byteCharacters;
                    if (!$scope.isMobileDevice) {
                        $scope.receivedMedia = $sce.trustAsResourceUrl(response);
                        loadMedia();
                        $scope.DataAvailable = true;
                    } else if (response) {
                        // $scope.receivedMedia = $sce.trustAsResourceUrl(response + '?wa=' + new Date().getTime());
                        $scope.receivedMedia = $sce.trustAsResourceUrl(response);
                    }
                }, function (err) {
                    console.log("media not found");
                });
            }

            var localInstance = this,
                shouldMimicNext = false;
            // localInstance.initValidationMap = initValidationMap;
            localInstance.Language = $scope.language;
            localInstance.DefaultLanguage = $scope.DefaultLanguage;
            localInstance.qObject = $scope.qObject;
            localInstance.shouldShiftFocus = false;

            //Functions for handling other variable types
            localInstance.GetOtherVariableName = function (id) {
                return $scope.qObject.Variables[id].Name;
            };
            localInstance.GetOtherVariableType = function (id) {
                return $scope.qObject.Variables[id].VariableType;
            };

            localInstance.getVariableFromName = function (variableName) {
                var variable = null;
                for(var i in $scope.qObject.Variables){
                    if($scope.qObject.Variables.hasOwnProperty(i) && $scope.qObject.Variables[i].Name === variableName){
                        variable = $scope.qObject.Variables[i];
                    }
                }
                return variable;
            };

            var isInMovement = false;
            //Saving Answer
            localInstance.SaveAnswer = function (variableName, variableType, answers, isOtherType, isExclusiveAcrossRows, exclusiveCodes, isDefaultAns) {
                var autoMoveAllowed = false;
                ValidatorService.HideError($scope.qObject.ID);
                if (answers != undefined && !Array.isArray(answers)) {
                    answers = [answers];
                }
                if (($scope.qObject.QuestionType == enums.QuestionType.Numeric || $scope.qObject.QuestionType == enums.QuestionType.Text) &&
                    $scope.qObject.QuestionLevelSequence.length > 1 && answers.length > 0) {
                    removeAnswerFromSecondVariable(variableType);
                }

                var previousAnswerSet = respondentService.GetVariableAnswers(variableName);
                autoMoveAllowed = answers.length > 0 && shouldAutoMove(variableName, findAnswerDiff(previousAnswerSet, answers), answers, variableType) && !NavigatorService.TOGGLE_BUTTON;
                //processing other variable
                if (variableType == enums.VariableType.Text || variableType == enums.VariableType.Numeric || variableType == enums.VariableType.DateTime || isOtherType) {
                    var ansObject = respondentService.GetAnswerObject(answers, variableType, variableName, $scope.qObject.ID);
                    respondentService.SaveAnswer(ansObject);
                    autoMoveAllowed = autoMoveAllowed && !NavigatorService.IS_BLUR_EVENT;

                } else {
                    //processing single answer in row
                    if (Object.keys(allowSingleAnswerInRow).length > 0 && allowSingleAnswerInRow.hasOwnProperty(variableName)) {
                        answers = removeOtherAnswers(variableName, answers);
                        var oldAns = respondentService.GetVariableAnswers(variableName);
                        $rootScope.$broadcast('updateAnswers', {
                            message: variableName,
                            AllowSingleAnswerInRow: allowSingleAnswerInRow,
                            Answers: oldAns
                        });
                    }
                    //processing single answer in column
                    if (isExclusiveAcrossRows) {
                        var currentChoice = findAnswerDiff(previousAnswerSet, answers);
                        removeAnswersFromOtherVariables(variableName, currentChoice[0]);
                        $rootScope.$broadcast('updateAnswers', {
                            message: variableName,
                            ExclusiveAcrossRows: isExclusiveAcrossRows,
                            Answers: currentChoice
                        });
                    }
                    var ansObject = respondentService.GetAnswerObject(answers, variableType, variableName, $scope.qObject.ID);
                    respondentService.SaveAnswer(ansObject);
                }

                if (surveySettings.IsAutoSubmitEnabled() && answers.length > 0 && !isDefaultAns) {
                    if (autoMoveAllowed) {
                        if (!isInMovement) {
                            isInMovement = true;
                            $timeout(function () {
                                NavigatorService.Next();
                            }, 700);
                        }
                    } else {
                        shiftFocus();
                    }
                }

                function findAnswerDiff(prev, curr) {
                    return curr.filter(function (d) {
                        return !prev.hasItem(d);
                    }).concat(prev.filter(function (d) {
                        return !curr.hasItem(d);
                    }));
                }
            }

            $scope.SaveAnswer = localInstance.SaveAnswer;

            function shiftFocus() {

            }

            function shouldAutoMove(variable, diff, currAns, variableType) {
                var isValidMove = false;
                switch ($scope.qObject.QuestionType) {
                    case enums.QuestionType.Stars:
                    case enums.QuestionType.LikeDislike:
                    case enums.QuestionType.SingleChoice: {
                        handleSingleChoice();
                        break;
                    }

                    case enums.QuestionType.MultipleChoice: {
                        handleMultiChoice();
                        break;
                    }

                    case enums.QuestionType.DateTime:
                    case enums.QuestionType.Numeric:
                    case enums.QuestionType.Text: {
                        if (currAns.length == 0 && diff.length == 0) {
                            isValidMove = false;
                        } else {
                            isValidMove = currAns.length > 0;
                        }
                        break;
                    }

                    case enums.QuestionType.SimpleGrid:
                    case enums.QuestionType.Distribution:
                        if (isMobileFriendlyEnabled()) {
                            if (variableType == enums.VariableType.SingleChoice) {
                                handleSingleChoice();
                            } else if (variableType == enums.VariableType.MultipleChoice) {
                                handleMultiChoice();
                            }
                        } else {
                            shiftFocus();
                        }
                        break;
                    case enums.QuestionType.Distribution2:
                        if (Object.keys($scope.qObject.Attributes).length == 1)
                            isValidMove = true;
                        break;

                    case enums.QuestionType.NPS:
                        var hiddenVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[1].ID].Name;
                        isValidMove = variable == hiddenVariable;
                        break;
                }
                return isValidMove;

                function handleSingleChoice() {
                    // Answer is removed
                    if (currAns.length == 0 && diff.length == 0) {
                        isValidMove = false;
                    } else if (currAns.length > 0 && diff.length > 0 && diff[0] == currAns[0]) {
                        // Double enter
                        isValidMove = true;
                        for (var vid in $scope.qObject.Variables) {
                            if ($scope.qObject.Variables[vid].Name == variable) {
                                if ($scope.qObject.Variables[vid].VariableType == enums.VariableType.SingleChoice) {
                                    isValidMove = !$scope.qObject.Variables[vid].Options[diff[0]].IsOther;
                                }
                                shiftFocus();
                                break;
                            }
                        }
                    }
                }

                function handleMultiChoice() {
                    // Answer is removed
                    if (currAns.length == 0 && diff.length == 0) {
                        isValidMove = false;
                    } else if (currAns.length > 0 && diff.length == 0) {
                        // Double enter
                        isValidMove = true;
                    } else if (currAns.length > 0 && diff.length > 0) {
                        for (var vid in $scope.qObject.Variables) {
                            if ($scope.qObject.Variables[vid].Name == variable) {
                                if ($scope.qObject.Variables[vid].VariableType == enums.VariableType.MultipleChoice && $scope.qObject.Variables[vid].Options[diff[0]].IsOther) {
                                    shiftFocus();
                                }
                                break;
                            }
                        }
                    }
                }
            }

            function removeAnswerFromSecondVariable(variableType) {
                var numericVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID],
                    singleChoiceVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[1].ID],
                    answers = [],
                    variableType,
                    variableName,
                    ansObject = {};
                if (variableType == enums.VariableType.Numeric || variableType == enums.VariableType.Text) {
                    answers = respondentService.GetVariableAnswers(singleChoiceVariable.Name);
                    variableType = enums.VariableType.SingleChoice;
                    variableName = singleChoiceVariable.Name;
                } else if (variableType == enums.VariableType.SingleChoice) {
                    variableType = numericVariable.VariableType;
                    variableName = numericVariable.Name;
                }
                ansObject = respondentService.GetAnswerObject([], variableType, variableName, $scope.qObject.ID);
                respondentService.SaveAnswer(ansObject);
                $rootScope.$broadcast('clearAnswer', {
                    Answers: answers,
                    VariableName: variableName
                });
            }

            //Handling Display Type Question
            $scope.displayedText = $scope.qObject.Text[$scope.language] ? $scope.qObject.Text[$scope.language] : $scope.qObject.Text[$scope.DefaultLanguage];

            //Handling Media Capture Question
            var media = $scope.qObject.Properties.MediaPath;
            if (media) {
                var mediaType = $scope.qObject.Properties.MediaType;
                $scope.imageWidth = "300px";
                $scope.imageHeight = "300px";
                if (mediaType == enums.MediaType.Picture.toString()) {
                    $scope.isImage = true;
                    if ($scope.qObject.Properties.Width && $scope.qObject.Properties.Width != "")
                        $scope.imageWidth = $scope.qObject.Properties.Width;
                    if ($scope.qObject.Properties.Height && $scope.qObject.Properties.Height != "")
                        $scope.imageHeight = $scope.qObject.Properties.Height;
                } else if (mediaType == enums.MediaType.Audio.toString()) {
                    $scope.isAudio = true;
                } else {
                    $scope.isVideo = true;
                }
            }

            //Capturing Audio and Video
            var captureUserMedia = function (mediaConstraints) {
                navigator.getUserMedia = navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia;

                var errorCallback = function (e) {
                    console.log('Reeeejected!', e);
                };
                var successCallback = function (localMediaStream) {
                    require(['MediaStreamRecorder'], function () {
                        mediaRecorder = new MediaStreamRecorder(localMediaStream);
                        mediaRecorder.mimeType = mimeType;
                        mediaRecorder.ondataavailable = function (e) {
                            $scope.StopButtonText = "Saving data..";
                            saveImage(e);
                        }
                        if ($scope.qObject.Properties.MediaType == 3) {
                            videoElement = document.querySelector('#captureVideo');
                            videoElement.srcObject = localMediaStream; // window.URL.createObjectURL(localMediaStream);
                            videoElement.play();
                        } else {
                            audioElement = document.querySelector('#captureAudio');
                            audioElement.srcObject = localMediaStream; // window.webkitURL.createObjectURL(localMediaStream);
                            audioElement.play();
                        }
                        mediaRecorder.start();
                    });
                };

                if (navigator.getUserMedia) {
                    navigator.getUserMedia(mediaConstraints, successCallback, errorCallback);
                } else {
                    console.log('Capture Video Not Supported!');
                }
            }

            function startRecording() {
                var mediaConstraints = {};
                document.querySelector('#start-recording').disabled = true;
                mimeType = $scope.qObject.Properties.MediaType == 3 ? "video/webm" : 'audio/ogg; codecs=opus';
                document.querySelector('#stop-recording').disabled = false;
                mediaConstraints = $scope.qObject.Properties.MediaType == 3 ? {
                    audio: true,
                    video: true
                } : {
                    audio: true
                };
                captureUserMedia(mediaConstraints);
            }

            function stopRecording() {
                document.querySelector('#stop-recording').disabled = true;
                mediaRecorder.stop();
                document.querySelector('#start-recording').disabled = false;
                if (audioElement)
                    audioElement.pause();
                if (videoElement)
                    videoElement.pause();
            }

            //Capturing Image
            function saveImage(mediaLocation) {
                var formData = new FormData(),
                    mediaBlob, url,
                    mediaType = parseInt($scope.qObject.Properties.MediaType),
                    qGuid = $scope.qObject.ID.replace('|', '-'), //splitting because when in loop, iteration gets appended
                    respID = respondentService.GetRespondentID(),
                    fileName = getMediaFileName();

                if (mediaLocation) {
                    if (typeof mediaLocation == 'string') {
                        mediaBlob = dataURItoFile(mediaLocation);
                    } else {
                        mediaBlob = mediaLocation;
                    }
                    formData.append('file', mediaBlob, getMediaFileName());
                } else if ($scope.isMobileDevice && $scope.platform == 2) {
                    //in case of mobile browsers
                    var f = document.getElementById('file').files[0];
                    formData.append('file', f, getMediaFileName());
                }
                CommunicationService.SaveMedia(formData, respID, mediaType, qGuid).then(function (mediaPath) {
                    $scope.StopButtonText = "Stop";
                    var variable = $scope.qObject.Variables[Object.keys($scope.qObject.Variables)[0]];
                    var answer = fileName;
                    localInstance.SaveAnswer(variable.Name, variable.VariableType, [answer], true);
                    $scope.receivedMedia = $sce.trustAsResourceUrl(mediaPath.data) || mediaLocation;
                    $scope.editMode = false;
                    loadMedia();
                    $scope.DataAvailable = true;
                }, function (err) {
                    console.log(err);
                })
            }

            function editMedia() {
                $scope.editMode = true;
            }

            function removeAnswersFromOtherVariables(variableName, exclusiveCode) {
                for (var varId in $scope.qObject.Variables) {
                    var variable = $scope.qObject.Variables[varId];
                    if (variable.Name == variableName)
                        continue;
                    var tempAns = respondentService.GetVariableAnswers(variable.Name);
                    if (tempAns.length) {
                        var exclusiveAnsIndex = tempAns.getIndexOf(exclusiveCode);
                        if (exclusiveAnsIndex > -1) {
                            tempAns.splice(exclusiveAnsIndex, 1);
                            var ansObject = respondentService.GetAnswerObject(tempAns, variable.VariableType, variable.Name, $scope.qObject.ID);
                            respondentService.SaveAnswer(ansObject);
                        }
                    }
                }
            }

            function removeAnswersFromExclusiveVariables(variableName, answers) {
                for (var varName in allowSingleAnswerInRow) {
                    var variable = allowSingleAnswerInRow[varName];

                    var tempAns = respondentService.GetVariableAnswers(varName);
                    if (tempAns) {
                        for (var i in answers) {
                            var index = tempAns.indexOf(answers[i]);
                            if (tempAns.indexOf(answers[i]) > -1) {
                                tempAns.splice(index, 1);
                            }
                        }
                        var ansObject = respondentService.GetAnswerObject(tempAns, variable.VariableType, varName, $scope.qObject.ID);
                        respondentService.SaveAnswer(ansObject);
                    }
                }
            }

            function removeOtherAnswers(variableName, answers) {
                var tempAns = respondentService.GetVariableAnswers(variableName);
                if (tempAns.length) {
                    for (var i in tempAns) {
                        var index = answers.indexOf(tempAns[i]);
                        if (index > -1) {
                            answers.splice(index, 1);
                        }
                    }
                }
                return answers;
            }

            function dataURItoFile(dataURI) {
                var hasArrayBufferView = new Blob([new Uint8Array(100)]).size == 100;
                var uri = dataURI.split(',')[1];
                var bytes = typeof atob === 'undefined' ? window.atob(uri) : atob(uri);
                var buf = new ArrayBuffer(bytes.length);
                var arr = new Uint8Array(buf);
                for (var i = 0; i < bytes.length; i++) {
                    arr[i] = bytes.charCodeAt(i);
                }

                if (!hasArrayBufferView) arr = buf;
                var blob = new Blob([arr], {
                    type: 'image/jpg'
                });
                blob.slice = blob.slice || blob.webkitSlice;

                return blob;
            }

            function getMediaFileName() {
                var mediaFileName = '';

                var qGuid = $scope.qObject.ID.replace('|', '-'); // splitting because in case of loop iteration gets append
                switch (parseInt($scope.qObject.Properties.MediaType)) {
                    case 1:
                        mediaFileName = qGuid + ".jpg";
                        break;
                    case 2:
                        mediaFileName = qGuid + ".mp3";
                        break;
                    case 3:
                        mediaFileName = qGuid + ".webm";
                        break;
                }
                return mediaFileName;
            }

            function LoadNPSAnswer(variableName) {
                $scope.NPSAnswer = respondentService.GetVariableAnswers(variableName);
            }

            PageRouteService.AddResetMovementCallback(function () {
                isInMovement = false;
            });
            //Validating a question on Next Click
            //respondentService.AddListener($scope.$on('ValidateQuestion', validateAndMove));
            PageRouteService.AddValidationCallback(validateAndMove);

            removeListeners();
            PageRouteService.AddBeforeBackMoveCallback(function () {
                var currentIndex = getCurrentIndexForMobileGrid();
                if ($scope.isMobileFriendlyEnabled() && currentIndex > 0) {
                    updateCurrentPointerForMobileGrid(false);
                    TraversalListService.setAttrPointer($scope.AttributePointer);
                    generateMobileGridHtml();
                    return false
                } else {
                    removeListeners();
                }
                return true;
            });

            respondentService.AddListener($scope.$on('$destroy', function () {
                removeListeners();
            }));

            function removeListeners() {
                var inputs = document.getElementsByClassName('input-txt');
                angular.forEach(inputs, function (d) {
                    d.removeEventListener('focus', $scope.focusListener);
                    d.removeEventListener('blur', $scope.blurListener);
                });
                if ($rootScope.$$listeners) {
                    var eventArr = $rootScope.$$listeners;
                    for (var eve in eventArr) {
                        if (eve != '$destroy') {
                            eventArr[eve] = [];
                        }
                    }
                }
            }

            function getValidVariables() {
                var validVariables = [];
                if ($scope.qObject.QuestionType === enums.QuestionType.HeatMap) {
                    for (var i = 1; i < $scope.qObject.QuestionLevelSequence.length; i++) {
                        validVariables.push($scope.qObject.QuestionLevelSequence[i].ID);
                    }
                } else {
                    if (isMobileFriendlyEnabled()) {
                        validVariables = getValidVariablesForMobileGrid();
                    } else {

                        for (var i = 0; i < $scope.qObject.QuestionLevelSequence.length; i++) {
                            switch ($scope.qObject.QuestionLevelSequence[i].ObjectType) {
                                case enums.ObjectType.AttributeHeader:
                                    var attrHeaderId = $scope.qObject.QuestionLevelSequence[i].ID;
                                    for (var j = 0; j < $scope.qObject.AttributeHeaders[attrHeaderId].AttributeSequence.length; j++) {
                                        var attrId = $scope.qObject.AttributeHeaders[attrHeaderId].AttributeSequence[j];
                                        if ($scope.qObject.Attributes[attrId].ShowInSurvey) {
                                            for (var k = 0; k < $scope.qObject.Attributes[attrId].GroupSequence.length; k++) {
                                                var groupId = $scope.qObject.Attributes[attrId].GroupSequence[k];
                                                for (var l = 0; l < $scope.qObject.Groups[groupId].VariableSequence.length; l++) {
                                                    validVariables.push($scope.qObject.Groups[groupId].VariableSequence[l]);
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case enums.ObjectType.Attribute:
                                    var attrId = $scope.qObject.QuestionLevelSequence[i].ID;
                                    if ($scope.qObject.Attributes[attrId].ShowInSurvey) {
                                        for (var j = 0; j < $scope.qObject.Attributes[attrId].GroupSequence.length; j++) {
                                            var groupId = $scope.qObject.Attributes[attrId].GroupSequence[j];
                                            for (var k = 0; k < $scope.qObject.Groups[groupId].VariableSequence.length; k++) {
                                                validVariables.push($scope.qObject.Groups[groupId].VariableSequence[k]);
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                    }
                }
                return validVariables;
            }

            function getValidVariablesForMobileGrid() {
                var validVariables = [];
                if ($scope.qObject.QuestionType == enums.QuestionType.TextGrid || $scope.qObject.QuestionType == enums.QuestionType.NumericGrid) {
                    var currentIndex = getCurrentIndexForMobileGrid();
                    for (var i = 0; i < $scope.qObject.QuestionLevelSequence.length; i++) {
                        var seq = $scope.qObject.QuestionLevelSequence[i];
                        if (seq.ObjectType == enums.ObjectType.Attribute) {
                            var attrID = $scope.qObject.QuestionLevelSequence[i].ID;
                            if ($scope.qObject.Attributes[attrID].ShowInSurvey) {
                                var grp = $scope.qObject.Groups[$scope.qObject.Attributes[attrID].GroupSequence[0]];
                                validVariables.push(grp.VariableSequence[currentIndex]);
                            }
                        }
                    }
                } else {
                    for (var j = 0; j < $scope.qObject.Attributes[$scope.AttributePointer].GroupSequence.length; j++) {
                        var groupId = $scope.qObject.Attributes[$scope.AttributePointer].GroupSequence[j];
                        for (var k = 0; k < $scope.qObject.Groups[groupId].VariableSequence.length; k++) {
                            validVariables.push($scope.qObject.Groups[groupId].VariableSequence[k]);
                        }
                    }
                }
                return validVariables;
            }

            $scope.validateTotal = function () {
                var valid = true;
                for (var total in $scope.Total.sum) {
                    if ($scope.qObject.Properties.TotalOperator) {
                        switch ($scope.qObject.Properties.TotalOperator) {
                            case '=':
                                if ($scope.Total.sum[total] != $scope.qObject.Properties.TotalCount) {
                                    valid = false;
                                }
                                break;

                            case '<':
                                if ($scope.Total.sum[total] >= $scope.qObject.Properties.TotalCount) {
                                    valid = false;
                                }
                                break;

                            case '>':
                                if ($scope.Total.sum[total] <= $scope.qObject.Properties.TotalCount) {
                                    valid = false;
                                }
                                break;

                            case '<=':
                                if ($scope.Total.sum[total] > $scope.qObject.Properties.TotalCount) {
                                    valid = false;
                                }
                                break;

                            case '>=':
                                if ($scope.Total.sum[total] < $scope.qObject.Properties.TotalCount) {
                                    valid = false;
                                }
                                break;
                        }
                        if (valid == false) {
                            $scope.Total.conditionMet[total] = valid;
                            break;
                        }
                    }
                    $scope.Total.conditionMet[total] = valid;
                }
                // if (!valid) {
                //     $scope.ErrorMessage = "Total should be " + $scope.qObject.Properties.TotalOperator + " " + $scope.qObject.Properties.TotalCount;
                // }
                return valid;

            }

            function checkWhetherMinOptionsFilled(validVariables) {
                return validVariables.reduce(function (prev, curr) {
                    var varName = $scope.qObject.Variables[curr].Name;
                    var answers = respondentService.GetVariableAnswers(varName);
                    return prev && answers && answers.length >= parseInt($scope.qObject.Properties.MinChoices);
                }, true);
            }

            function checkWhetherAnswered(validVariables) {
                return validVariables.reduce(function (prev, id) {
                    var answers = respondentService.GetVariableAnswers($scope.qObject.Variables[id].Name);
                    return prev && answers && answers.length > 0 && answers.reduce(
                        function (innerPrev, ans) {
                            if (isCategory(id) && $scope.qObject.Variables[id].Options[ans].IsOther) {
                                var otherVarId = $scope.qObject.Variables[id].Options[ans].OtherVariableID;
                                var otherVarName = localInstance.GetOtherVariableName(otherVarId);
                                var otherAns = respondentService.GetVariableAnswers(otherVarName);
                                return innerPrev && isNotNull(otherAns) && otherAns.length > 0;
                            }
                            return innerPrev && isNotNull(ans);
                        }, prev);
                }, true);

                function isCategory(id) {
                    return $scope.qObject.Variables[id].VariableType == enums.VariableType.SingleChoice ||
                        $scope.qObject.Variables[id].VariableType == enums.VariableType.MultipleChoice;
                }
            }

            function checkWhetherRankAnswerValid(validVariables) {
                if (($scope.qObject.QuestionType == enums.QuestionType.Rank && $scope.qObject.Properties.ShowAs == enums.ShowAsProperty.DragAndDrop) || $scope.qObject.QuestionType == enums.QuestionType.RankAndSort) {
                    var answerCounter = 0;
                    for (var variable in $scope.qObject.Variables) {
                        if (validVariables.indexOf(variable) != -1) {
                            var varName = $scope.qObject.Variables[variable].Name;
                            var answers = respondentService.GetVariableAnswers(varName);
                            if (answers && answers.length != 0) {
                                answerCounter++;
                            }
                        }
                    }
                    if ($scope.qObject.Properties.MaxRankableItems) {
                        //Number of answered items should be equal to Max Rankable Items + Number of Groups
                        var groupCount = calculateNumberOfGroups();
                        if (answerCounter == parseInt($scope.qObject.Properties.MaxRankableItems) * groupCount) {
                            return true;
                        }
                    }
                    if (answerCounter == $scope.qObject.QuestionLevelSequence.length) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    var answerCounter = 0;
                    for (var variable in $scope.qObject.Variables) {
                        if (validVariables.indexOf(variable) != -1) {
                            var varName = $scope.qObject.Variables[variable].Name;
                            var answers = respondentService.GetVariableAnswers(varName);
                            if (answers && answers.length != 0) {
                                answerCounter++;
                            }
                            if (answers && answers.length == 0 && !$scope.qObject.Properties.MinRankableItems) {
                                $scope.RankMessage = "All items are not ranked";
                                return false;
                            }
                            if (answers && answers.length != 0) {
                                if (answers[0] > $scope.qObject.QuestionLevelSequence.length) {
                                    $scope.ErrorAttribute = $scope.VariableParentMapping[$scope.qObject.Variables[variable].ID];
                                    $scope.RankMessage = "Incorrect value entered";
                                    return false;
                                }
                            }
                        }
                    }
                    if ($scope.qObject.Properties.MinRankableItems) {
                        //Number of answered items should be equal to Max Rankable Items + Number of Groups
                        if (answerCounter >= parseInt($scope.qObject.Properties.MinRankableItems)) {
                            return true;
                        } else {
                            $scope.RankMessage = "You need to rank atleast " + $scope.qObject.Properties.MinRankableItems + " items";
                            return false;
                        }
                    }
                    return true;
                }
            }

            function calculateNumberOfGroups() {
                var attrId = $scope.qObject.QuestionLevelSequence[0].ID;
                var groupCount = $scope.qObject.Attributes[attrId].GroupSequence.length;

                return groupCount;
            }

            function checkWhetherRanksRepeated(validVariables) {
                var numericAnswers = [];
                for (var variable in $scope.qObject.Variables) {
                    if (validVariables.indexOf(variable) != -1) {
                        if ($scope.qObject.Variables[variable].VariableType == enums.VariableType.Numeric) {
                            var varName = $scope.qObject.Variables[variable].Name;
                            var answer = respondentService.GetVariableAnswers(varName);
                            if (answer[0] != undefined) {
                                numericAnswers.push(answer[0]);
                            }
                        }
                    }
                }
                if (numericAnswers.length > 1) {
                    var sorted_arr = numericAnswers.sort();
                    var results = [];
                    for (var i = 0; i < numericAnswers.length - 1; i++) {
                        if (sorted_arr[i + 1] == sorted_arr[i]) {
                            $scope.RankMessage = "Rank cannot be repeated";
                            return false;
                        }
                    }
                    if ($scope.qObject.Properties.MinRankableItems && numericAnswers.length == parseInt($scope.qObject.Properties.MinRankableItems)) {
                        var index = sorted_arr.map(function (currentElement) {
                            if (currentElement <= parseInt($scope.qObject.Properties.MinRankableItems))
                                return true;
                            else
                                return false;
                        }).indexOf(false);
                        if (index > -1) {
                            $scope.RankMessage = "Rank should be within 1 to " + $scope.qObject.Properties.MinRankableItems;
                            return false;
                        }
                    }
                    if (i == numericAnswers.length - 1) {
                        return true;
                    }
                } else {
                    return true;
                }
            }

            function checkForNonMandatoryRankQuestion(validVariables) {
                for (var variable in $scope.qObject.Variables) {
                    if (validVariables.indexOf(variable) != -1) {
                        var varName = $scope.qObject.Variables[variable].Name;
                        var answers = respondentService.GetVariableAnswers(varName);
                        if (answers && answers.length != 0) {
                            if (answers[0] > $scope.qObject.QuestionLevelSequence.length) {
                                $scope.ErrorAttribute = $scope.VariableParentMapping[$scope.qObject.Variables[variable].ID];
                                $scope.RankMessage = "Incorrect value entered";
                                return false;
                            }
                        }
                    }
                }
                return true;
            }

            function checkWhetherMaxDiffValid(validVariables) {
                var answerCounter = 0;
                for (var variable in $scope.qObject.Variables) {
                    if (validVariables.indexOf(variable) != -1) {
                        var varName = $scope.qObject.Variables[variable].Name;
                        var answers = respondentService.GetVariableAnswers(varName);
                        if (answers && answers.length != 0) {
                            answerCounter++;
                        }
                    }
                }
                if (answerCounter == 2) {
                    return true;
                } else {
                    return false;
                }
            }

            function checkWhetherHeatMapValid(validVariables) {
                var answerCounter = 0;
                for (var variable in $scope.qObject.Variables) {
                    if (validVariables.indexOf(variable) != -1) {
                        var varName = $scope.qObject.Variables[variable].Name;
                        var answers = respondentService.GetVariableAnswers(varName);
                        if (answers && answers.length != 0) {
                            answerCounter++;
                        }
                    }
                }
                if (answerCounter >= 2) {
                    return true;
                } else {
                    return false;
                }
            }

            function checkWhetherTextValid(validVariables) {
                var answerCounter = 0;
                for (var variable in $scope.qObject.Variables) {
                    if (validVariables.indexOf(variable) != -1) {
                        var varName = $scope.qObject.Variables[variable].Name;
                        var answers = respondentService.GetVariableAnswers(varName);
                        if (answers && answers.length != 0) {
                            answerCounter++;
                        }
                    }
                }
                return answerCounter >= 1;
            }

            function getOtherVariables(variables) {
                var otherVariables = [];

                for (var varId in variables) {
                    for (var i in variables[varId].Options) {
                        if (variables[varId].Options[i].IsOther == true) {
                            otherVariables.push(variables[varId].Options[i].OtherVariableID);
                        }
                    }
                    if ($scope.qObject.QuestionType == enums.QuestionType.AutocodeText && otherVariables.length > 0) {
                        break;
                    }
                }
                return otherVariables;
            }

            //Generating the Mobile Grid
            function generateMobileGridHtml() {
                isInMovement = false;
                var html = "";
                switch ($scope.qObject.QuestionType) {
                    case enums.QuestionType.SimpleGrid:
                    case enums.QuestionType.Distribution:
                        if ($scope.qObject.Properties.MobileFriendly != 'true') {
                            html = GenerateMobileGridForDistribution();
                        } else {
                            html = GenerateMobileGridHtmlForSimpleGrids();
                        }
                        break;
                    case enums.QuestionType.TextGrid:
                    case enums.QuestionType.NumericGrid:
                        html = GenerateMobileGridHtmlForTextGrids();
                        break;
                    default:
                        return;
                }
                if (html) {
                    var container = angular.element(document.getElementById('mobileGridPage'));
                    container.empty();
                    container.append(html);
                    $compile(container.contents())($scope);

                }
            }

            function GenerateMobileGridHtmlForTextGrids() {
                $scope.ShowMandatoryStar = false;
                var html = "";
                var MasterGroup = $scope.qObject.Groups[$scope.qObject.MasterAttribute.GroupSequence[0]];
                var MasterVariable = $scope.qObject.Variables[MasterGroup.VariableSequence[$scope.ColumnIndexPointer]];
                var VariableText = MasterVariable.Text[$scope.language] || MasterVariable.Text[$scope.DefaultLanguage];
                var mediaUrl = MasterVariable.Media[$scope.language] || MasterVariable.Media[$scope.DefaultLanguage];
                var showMedia = false;
                VariableText = $interpolate(VariableText)($scope);
                var html = "<div id='mobile-grid-attr' class='animated " + respondentService.GetAnimation() + "'><div style='padding-bottom: 10px'>" +
                    "<img ng-if=" + showMedia + " src='" + mediaUrl + "' style='max-height:100px;max-width:100px;'/><span class='survey-option-text'>" + VariableText + "</span></div>";
                if (mediaUrl)
                    showMedia = true;
                html += "<ul>";
                for (var qseq in $scope.qObject.QuestionLevelSequence) {
                    html += "<li>";
                    var attr = $scope.qObject.QuestionLevelSequence[qseq].ID;
                    var attribute = $scope.qObject.Attributes[attr];
                    var attributeText = attribute.Text[$scope.language] || attribute.Text[$scope.DefaultLanguage];
                    attributeText = $interpolate(attributeText)($scope);
                    if (attributeText) {
                        html += "<div class='display-inline-block width-50 grid-txt'>" + attributeText;
                        if (attribute.IsOther) {
                            var variableName = $scope.qObject.Variables[attribute.OtherVariableID].Name;
                            $scope.OtherAttributeAnswer[attribute.ID] = respondentService.GetVariableAnswers(variableName);
                            html += '<input type="text" class="input-txt" placeholder="' + (Placeholders.Other[$scope.language] || Placeholders.Other[$scope.DefaultLanguage]) + '" ng-blur="SaveOtherAttributeValue(\'' + attribute.ID + '\',\'' + attribute.OtherVariableID + '\')" ng-model="OtherAttributeAnswer[\'' + attribute.ID + '\']">';
                        }
                        html += "</div>";
                    }
                    html += "<div class='display-inline-block width-50'>";
                    for (var grp in attribute.GroupSequence) {
                        var group = $scope.qObject.Groups[attribute.GroupSequence[grp]];
                        var variable = $scope.qObject.Variables[group.VariableSequence[$scope.ColumnIndexPointer]];
                        html += "<survey-variable variable='" + JSON.stringify(variable) + "'><div>";
                        if (variable.VariableType == 4) {
                            if (variable.Properties.Prefix)
                                html += "<span class='survey-option-text display-inline-block'>{{variable.Properties.Prefix}}</span>";
                            html += "<input ng-class='{\"border-all\":variable.Properties.ShowFullBorder, \"border-red\":(SelectedValues.single < variable.Properties.Min || SelectedValues.single > variable.Properties.Max) && SelectedValues.single }' placeholder={{Placeholder}} class='input-txt focusableInput' type='number' ng-model='SelectedValues.single' ng-init='addVariable(" + $scope.ColumnIndexPointer + ")' ng-blur='addVariable(" + $scope.ColumnIndexPointer + ")'  ng-change='SetDecimalPlaces(SelectedValues.single);OnBlurSave(SelectedValues.single)'>";
                            if (variable.Properties.Suffix)
                                html += "<span  class='survey-option-text display-inline-block'>{{variable.Properties.Suffix}}</span>";
                        } else {
                            if (variable.Properties.ShowAs == 12) {
                                html += "<input ng-class='{\"border-all\":variable.Properties.ShowFullBorder, \"border-red\":SelectedValues.single.length < variable.Properties.Min && SelectedValues.single }' variableName='{{variable.Name}}' placeholder='{{Placeholder}}' class='focusableInput darkBdr input-txt full-width' type='text' maxlength='{{variable.Properties.Max}}' ng-model='SelectedValues.single' ng-blur='OnBlurSave(SelectedValues.single)'/>";
                            } else {
                                html += "<textarea ng-class='{\"border-all\":variable.Properties.ShowFullBorder, \"border-red\":SelectedValues.single.length < variable.Properties.Min && SelectedValues.single }' variableName='{{variable.Name}}' placeholder='{{Placeholder}}' class='focusableInput input-txt darkBdr input-text-area' maxlength='{{variable.Properties.Max}}' ng-model='SelectedValues.single' ng-blur='OnBlurSave(SelectedValues.single)'></textarea>";
                            }
                        }
                        html += "</div>" +
                            "</survey-variable>";
                    }
                    html += "</div></li>";
                }
                if ($scope.qObject.Properties.Total == 'ColumnTotal') {
                    html += "<li><div class='display-inline-block width-50 grid-txt'>Total</div>" +
                        "<div  class='display-inline-block width-50'> <input type='number' readonly class='input-txt' ng-class='{\"color-green\":Total.conditionMet[" + $scope.ColumnIndexPointer + "]}'  ng-model='Total.sum[" + $scope.ColumnIndexPointer + "]'></div></li>";
                }
                html += "</ul>";
                return html;
            }

            function GenerateMobileGridHtmlForSimpleGrids() {
                processExclusiveAcrossRowsForMobileGrid($scope.qObject.Variables);
                var currentIndex = getCurrentIndexForMobileGrid();
                TraversalListService.setAttributePosition(currentIndex + 1);
                TraversalListService.setMaxAttributes($scope.qObject.QuestionLevelSequence.length);
                $scope.ShowMandatoryStar = false;
                var attribute = $scope.qObject.Attributes[$scope.AttributePointer];
                if (attribute == undefined)
                    return;
                $scope.r = window.r;
                var text = attribute.Text[$scope.language] || attribute.Text[$scope.DefaultLanguage];
                var mediaUrl = attribute.Media[$scope.language] || attribute.Media[$scope.DefaultLanguage];
                var showMedia = false;
                if (mediaUrl)
                    showMedia = true;
                text = $interpolate(text)($scope);
                var html = "<div id='mobile-grid-attr' class='animated " + respondentService.GetAnimation() + "'><div style='padding-bottom: 10px'>" +
                    "<img ng-if=" + showMedia + " src='" + mediaUrl + "' style='max-height:100px;max-width:100px;'/><span class='survey-option-text'>" + text + "</span></div>";
                if (attribute.IsOther) {
                    var variableName = $scope.qObject.Variables[attribute.OtherVariableID].Name;
                    $scope.OtherAttributeAnswer[attribute.ID] = respondentService.GetVariableAnswers(variableName);
                    html += '<input type="text" class="input-txt disply-inline" placeholder="' + (Placeholders.Other[$scope.language] || Placeholders.Other[$scope.DefaultLanguage]) + '" ng-blur="SaveOtherAttributeValue(\'' + attribute.ID + '\',\'' + attribute.OtherVariableID + '\')" ng-model="OtherAttributeAnswer[\'' + attribute.ID + '\']">';
                }
                // html += "</div>";
                for (var i = 0; i < attribute.GroupSequence.length; i++) {
                    for (var j = 0; j < $scope.qObject.Groups[attribute.GroupSequence[i]].VariableSequence.length; j++) {
                        var variable = $scope.qObject.Variables[$scope.qObject.Groups[attribute.GroupSequence[i]].VariableSequence[j]];
                        //variable.Properties.ShowAs = enums.ShowAsProperty.Radio;
                        variable.Properties.Orientation = 'Auto';
                        html += "<survey-variable variable='qObject.Variables[qObject.Groups[qObject.Attributes[AttributePointer].GroupSequence[" + i + "]].VariableSequence[" + j + "]]'><i id='blinkingHint' ng-if='HideHint != \"true\" && variable.VariableType == 2' class='survey-option-text font-bold'>Choose as many as you like....</i>";
                        if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid) {
                            html += "<survey-options></survey-options>";
                        } else if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                            if ($scope.qObject.Properties.ShapeType == '8') {
                                html += '<div class="display-inline-block fixedTable"><div  style="width:100%;border-spacing:2px;">';

                            } else {
                                html += '<div class="display-inline-block fixedTable"><div  style="display:table-caption!important;width:100%;border-spacing:2px;">';

                            }
                            for (var seq in variable.VariableLevelSequence) {
                                var sequence = variable.VariableLevelSequence[seq];
                                if (!variable.Options[sequence.ID].IsExclusive)
                                    html += '<div  style="display:table-cell"><survey-stars ng-class="' + variable.VariableLevelSequence.length + ' >= 8 ? \'smiley-big\' : \'smiley-small\'" ng-click="SaveAnswer(' + variable.Options[sequence.ID].Code + ')" class="pos-rel" ng-mouseenter="setHoverID(' + sequence.ID + ')"' +
                                        ' ng-mouseleave="removeHoverID()"  exclusive-id="{{RatingQuestionConfig.ExclusiveID}}" option-id="' + sequence.ID + '" style="margin-right:5px;"></survey-stars></div>';
                            }
                            // // for showing labels 
                            // if ($scope.qObject.Properties.ShowLabels == 'true') {
                            //     html += '<div class="padding-5 rating-label"><span class="text-left display-inline-block" style="width:31%">' +
                            //         '<i>' + ($scope.qObject.LeftLabel[$scope.language] || $scope.qObject.LeftLabel[$scope.DefaultLanguage]) + '</i></span>' +
                            //         '<span class="text-center display-inline-block" style="width:33%"><i>' + ($scope.qObject.MidLabel[$scope.language] || $scope.qObject.MidLabel[$scope.DefaultLanguage]) + '</i></span>' +
                            //         '<span class="text-right display-inline-block" style="width:34%"> <i>' + ($scope.qObject.RightLabel[$scope.language] || $scope.qObject.RightLabel[$scope.DefaultLanguage]) + '</i></span></div>';
                            // }
                            // for showing labels 

                            html += '</div>';
                            if ($scope.qObject.Properties.ShowLabels == 'true') {
                                html += '<div class="padding-5 rating-label">' +
                                    '<span class="text-left display-inline-block" style="width:31%;vertical-align:top">';
                                if (($scope.qObject.LeftLabel[$scope.language] || $scope.qObject.LeftLabel[$scope.DefaultLanguage]))
                                    html += '<i>' + ($scope.qObject.LeftLabel[$scope.language] || $scope.qObject.LeftLabel[$scope.DefaultLanguage]) + '</i>';
                                html += '</span>';
                                html += '<span class="text-center display-inline-block" style="width: 36%;vertical-align: top;margin-left: 1%;">';
                                if (($scope.qObject.MidLabel[$scope.language] || $scope.qObject.MidLabel[$scope.DefaultLanguage]))
                                    html += '<i>' + ($scope.qObject.MidLabel[$scope.language] || $scope.qObject.MidLabel[$scope.DefaultLanguage]) + '</i>';
                                html += '</span><span class="text-right display-inline-block" style="width:31%;vertical-align:top"> ';
                                if (($scope.qObject.RightLabel[$scope.language] || $scope.qObject.RightLabel[$scope.DefaultLanguage]))
                                    html += '<i>' + ($scope.qObject.RightLabel[$scope.language] || $scope.qObject.RightLabel[$scope.DefaultLanguage]) + '</i>';
                                html += '</span></div>';

                            }

                            //for showing no answer option 
                            html += '<div ng-if="RatingQuestionConfig.ExclusiveID" class="noAnswer">' +
                                '<survey-option option-id="{{RatingQuestionConfig.ExclusiveID}}"></survey-option>'
                            '</div>';
                            html += '</div>';
                        }
                        html += "</survey-variable>";
                    }
                }
                html += "</div>";
                return html;
            }

            function GenerateMobileGridForDistribution() {
                $scope.ShowMandatoryStar = false;
                $scope.r = window.r;
                var html = "<div id='mobile-grid-attr' class='animated " + respondentService.GetAnimation() + "'>";
                //for loop
                for (var seq in $scope.qObject.QuestionLevelSequence) {
                    if ($scope.qObject.QuestionLevelSequence[seq].ObjectType != enums.ObjectType.Attribute)
                        return;
                    var attrId = $scope.qObject.QuestionLevelSequence[seq].ID;
                    var attribute = $scope.qObject.Attributes[attrId];
                    if (attribute == undefined)
                        continue;

                    var text = attribute.Text[$scope.language] || attribute.Text[$scope.DefaultLanguage];
                    var mediaUrl = attribute.Media[$scope.language] || attribute.Media[$scope.DefaultLanguage];
                    var showMedia = false;
                    if (mediaUrl)
                        showMedia = true;
                    text = $interpolate(text)($scope);
                    html += "<div style='padding-bottom: 10px'>" +
                        "<img ng-if=" + showMedia + " src='" + mediaUrl + "' style='max-height:100px;max-width:100px;'/><span class='survey-option-text'>" + text + "</span></div>";
                    if (attribute.IsOther) {
                        var variableName = $scope.qObject.Variables[attribute.OtherVariableID].Name;
                        $scope.OtherAttributeAnswer[attribute.ID] = respondentService.GetVariableAnswers(variableName);
                        html += '<input type="text" class="input-txt disply-inline" placeholder="' + (Placeholders.Other[$scope.language] || Placeholders.Other[$scope.DefaultLanguage]) + '" ng-blur="SaveOtherAttributeValue(\'' + attribute.ID + '\',\'' + attribute.OtherVariableID + '\')" ng-model="OtherAttributeAnswer[\'' + attribute.ID + '\']">';
                    }
                    // html += "</div>";
                    for (var i = 0; i < attribute.GroupSequence.length; i++) {
                        for (var j = 0; j < $scope.qObject.Groups[attribute.GroupSequence[i]].VariableSequence.length; j++) {
                            var variable = $scope.qObject.Variables[$scope.qObject.Groups[attribute.GroupSequence[i]].VariableSequence[j]];
                            //variable.Properties.ShowAs = enums.ShowAsProperty.Radio;
                            variable.Properties.Orientation = 'Auto';
                            html += "<survey-variable variable='qObject.Variables[qObject.Groups[qObject.Attributes[\"" + attribute.ID + "\"].GroupSequence[" + i + "]].VariableSequence[" + j + "]]'><i id='blinkingHint' ng-if='HideHint != \"true\" && variable.VariableType == 2' class='survey-option-text font-bold'>Choose as many as you like....</i>";

                            html += '<div class="display-inline-block pull-left" ng-class="{\'noAnswerShape\':RatingQuestionConfig.ExclusiveID}"><div  style="display:table!important;width:100%;border-spacing:2px;">';
                            for (var seq in variable.VariableLevelSequence) {
                                var sequence = variable.VariableLevelSequence[seq];
                                if (!variable.Options[sequence.ID].IsExclusive)
                                    html += '<div  style="display:table-cell"><survey-stars ng-class="' + variable.VariableLevelSequence.length + ' >= 8 ? \'smiley-big\' : \'smiley-small\'" ng-click="SaveAnswer(' + variable.Options[sequence.ID].Code + ')" class="pos-rel" ng-mouseenter="setHoverID(' + sequence.ID + ')"' +
                                        ' ng-mouseleave="removeHoverID()" exclusive-id="{{RatingQuestionConfig.ExclusiveID}}" option-id="' + sequence.ID + '"></survey-stars></div>';
                            }
                            html += '</div>';
                            // for showing labels 
                            if ($scope.qObject.Properties.ShowLabels == 'true') {
                                html += '<div class="padding-5 rating-label">' +
                                    '<span class="text-left display-inline-block" style="width:31%;vertical-align:top">';
                                if (($scope.qObject.LeftLabel[$scope.language] || $scope.qObject.LeftLabel[$scope.DefaultLanguage]))
                                    html += '<i>' + ($scope.qObject.LeftLabel[$scope.language] || $scope.qObject.LeftLabel[$scope.DefaultLanguage]) + '</i>';
                                html += '</span>';
                                html += '<span class="text-center display-inline-block" style="width:36%;vertical-align:top;margin-left:1%">';
                                if (($scope.qObject.MidLabel[$scope.language] || $scope.qObject.MidLabel[$scope.DefaultLanguage]))
                                    html += '<i>' + ($scope.qObject.MidLabel[$scope.language] || $scope.qObject.MidLabel[$scope.DefaultLanguage]) + '</i>';
                                html += '</span><span class="text-right display-inline-block" style="width:31%;vertical-align:top"> ';
                                if (($scope.qObject.RightLabel[$scope.language] || $scope.qObject.RightLabel[$scope.DefaultLanguage]))
                                    html += '<i>' + ($scope.qObject.RightLabel[$scope.language] || $scope.qObject.RightLabel[$scope.DefaultLanguage]) + '</i>';
                                html += '</span></div>';

                            }
                            html += '</div>';
                            //for showing no answer option 
                            html += '<div ng-if="RatingQuestionConfig.ExclusiveID" class=" no-answer ratingNoAns pull-left">' +
                                '<survey-option option-id="{{RatingQuestionConfig.ExclusiveID}}"></survey-option>' +
                                '</div><span class="clearfix"></span>';

                            html += "</survey-variable>";

                        }
                    }

                }
                html += "</div>";
                html += "</div>";
                return html;
            }

            function processExclusiveAcrossRowsForMobileGrid(variables) {
                var excludedOptions = [];
                var categoryVariables = [];
                for (var vid in variables) {
                    if (excludedOptions.length == 0) {
                        for (var optCode in variables[vid].Options) {
                            if (variables[vid].Options[optCode].IsExclusiveAcrossRows) {
                                excludedOptions.push(optCode);
                            }
                        }
                    }
                    if (variables[vid].VariableType == enums.VariableType.SingleChoice || variables[vid].VariableType == enums.VariableType.MultipleChoice) {
                        categoryVariables.push(vid);
                    }
                }
                for (var vid in variables) {
                    if (processedSequence.length == 0 && variables[vid].VariableLevelSequence.length) {
                        processedSequence = angular.copy(variables[vid].VariableLevelSequence);
                        break;
                    } else {
                        variables[vid].VariableLevelSequence = angular.copy(processedSequence);
                    }
                }

                for (var i = 0; i < categoryVariables.length; i++) {
                    var resp = respondentService.GetVariableAnswers(variables[categoryVariables[i]].Name);
                    for (var j = 0; j < resp.length; j++) {
                        if (excludedOptions.hasItem(resp[j])) {
                            for (var vid in variables) {
                                if (vid != categoryVariables[i]) {
                                    for (var k = 0; k < variables[vid].VariableLevelSequence.length; k++) {
                                        if (variables[vid].VariableLevelSequence[k].ID == resp[j]) {
                                            variables[vid].VariableLevelSequence.splice(k, 1);
                                            break;
                                        }
                                    }
                                    for (var grpId in variables[vid].OptionGroups) {
                                        var index = variables[vid].OptionGroups[grpId].indexOf(resp[j]);
                                        if (index > -1) {
                                            variables[vid].VariableLevelSequence.splice(index, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            //Handling Other Attribute values in grid
            function saveOtherAttributeValue(attributeId, otherVariableId) {
                var otherVariableName = $scope.qObject.Variables[otherVariableId].Name;
                if (ValidatorService.IsNotNullOrEmpty($scope.OtherAttributeAnswer[attributeId])) {
                    $scope.SaveAnswer(otherVariableName, enums.VariableType.Text, $scope.OtherAttributeAnswer[attributeId], true);
                } else {
                    $scope.OtherAttributeAnswer[attributeId] = [];
                    $scope.SaveAnswer(otherVariableName, enums.VariableType.Text, $scope.OtherAttributeAnswer[attributeId], true);
                }
            }

            function createAtrributeVariableMapping() {
                $scope.VariableParentMapping = {};
                for (var attribute in $scope.qObject.Attributes) {
                    for (var i = 0; i < $scope.qObject.Attributes[attribute].GroupSequence.length; i++) {
                        var groupId = $scope.qObject.Attributes[attribute].GroupSequence[i];
                        for (var j = 0; j < $scope.qObject.Groups[groupId].VariableSequence.length; j++) {
                            $scope.VariableParentMapping[$scope.qObject.Groups[groupId].VariableSequence[j]] = attribute;
                        }
                    }
                }
            }

            function playRecording() {
                if (!$scope.receivedMedia)
                    return;
                if ($scope.qObject.Properties.MediaType == 3) {
                    videoElement = document.querySelector('#captureVideo');
                    videoElement.play();
                } else {
                    audioElement = document.querySelector('#captureAudio');
                    audioElement.play();
                }
            }

            function loadMedia() {
                if ($scope.qObject.Properties.MediaType == 3) {
                    videoElement = document.querySelector('#captureVideo');
                    videoElement.src = $scope.receivedMedia;
                    videoElement.load();
                } else if ($scope.qObject.Properties.MediaType == 2) {
                    audioElement = document.querySelector('#captureAudio');
                    audioElement.src = $scope.receivedMedia;
                    audioElement.load();
                }
            }

            function validateAndMove() {
                var valid = false;
                var otherVariables = getOtherVariables($scope.qObject.Variables);
                var validVariables = getVariableToValidate().filter(function (d) {
                    return otherVariables.indexOf(d) == -1 && d != $scope.qObject.Properties.RecordingVariable && d != $scope.qObject.Properties.TimerVariable;
                });

                var IsDataValid = ValidatorService.IsDataValid;
                if ($scope.qObject.QuestionType == enums.QuestionType.OTP) {

                    verifyOTP();
                    IsDataValid &= IsOTPValid();

                }
                valid = containsAllValidatedVariable(validVariables);
                $scope.AnswerInvalid = valid;


                //get error message from survey setting service
                var errors = surveySettings.GetErrors();
                var message = "";
                if ($scope.qObject.Properties["ShowAs"] == enums.ShowAsProperty.ConstantSum && $scope.qObject.Properties.Total != "None") {
                    move(valid, false);
                } else if ($scope.qObject.QuestionType == enums.QuestionType.MultipleChoice && $scope.qObject.Properties.MinChoices) {
                    message = (errors['MinCategory'][$scope.language] || errors['MinCategory'][$scope.DefaultLanguage]).replace('_', $scope.qObject.Properties.MinChoices);
                    move(valid, false, message);
                } else if ($scope.qObject.IsMandatory == enums.Mandatory.WarnAndContinue) {
                    message = errors['WarnAndContinue'][$scope.language] || errors['WarnAndContinue'][$scope.DefaultLanguage];
                    move(valid, true, message);
                } else if ($scope.qObject.IsMandatory == enums.Mandatory.Mandatory) {
                    message = errors['Mandatory'][$scope.language] || errors['Mandatory'][$scope.DefaultLanguage];
                    move(valid, false, message);
                } else {
                    move(IsDataValid);
                }

                function getVariableToValidate() {
                    var variables = [];
                    switch ($scope.qObject.QuestionType) {
                        case enums.QuestionType.ComplexGrid:
                        case enums.QuestionType.TextGrid:
                        case enums.QuestionType.NumericGrid:
                        case enums.QuestionType.ConstantSumGrid:
                        case enums.QuestionType.Distribution:
                        case enums.QuestionType.Distribution2:
                        case enums.QuestionType.Slider:
                        case enums.QuestionType.MaxDiff:
                        case enums.QuestionType.Rank:
                        case enums.QuestionType.RankAndSort:
                        case enums.QuestionType.HeatMap:
                        case enums.QuestionType.SimpleGrid:
                            variables = getValidVariables();
                            break;
                        case enums.QuestionType.AutocodeText:
                            variables.push($scope.qObject.QuestionLevelSequence[0].ID);
                            break;
                        default:
                            for (var variable in $scope.qObject.Variables) {
                                variables.push($scope.qObject.Variables[variable].ID);
                            }
                    }
                    return variables;
                }

                function containsAllValidatedVariable(validVariables) {
                    var hasValidVariables = false;

                    switch ($scope.qObject.QuestionType) {
                        case enums.QuestionType.RankAndSort:
                            hasValidVariables = checkWhetherRankAnswerValid(validVariables);
                            break;

                        case enums.QuestionType.Rank:
                            if ($scope.qObject.Properties.ShowAs != enums.ShowAsProperty.DragAndDrop) {
                                hasValidVariables = checkWhetherRankAnswerValid(validVariables) && checkWhetherRanksRepeated(validVariables);
                            }
                            break;
                        case enums.QuestionType.MaxDiff:
                            hasValidVariables = checkWhetherMaxDiffValid(validVariables);
                            break;
                        case enums.QuestionType.HeatMap:
                            hasValidVariables = checkWhetherHeatMapValid(validVariables);
                            break;
                        case enums.QuestionType.Text:
                        case enums.QuestionType.Numeric:
                            hasValidVariables = checkWhetherTextValid(validVariables);
                            break;
                        default:
                            if ($scope.qObject.Properties.MinChoices) {
                                hasValidVariables = checkWhetherMinOptionsFilled(validVariables);
                            } else {
                                hasValidVariables = checkWhetherAnswered(validVariables);
                                //Checking for Total Property in case of Constant Sum Grid
                                if ($scope.qObject.Properties["ShowAs"] == enums.ShowAsProperty.ConstantSum && $scope.qObject.Properties.Total != "None") {
                                    hasValidVariables &= $scope.validateTotal();
                                }
                                if ($scope.qObject.QuestionType == enums.QuestionType.OTP) {
                                    hasValidVariables = hasValidVariables && ValidatorService.VerifiedQuestionOTPMap[$scope.qObject.ID];
                                }
                            }
                            break;
                    }

                    return hasValidVariables;
                }

                function move(isValid, isWarn, errorMessage) {
                    //Calculating index of current attribute in case of Mobile Grid
                    if (isValid && isMobileFriendlyEnabled() && isNotLastIndex()) {
                        updateCurrentPointerForMobileGrid(true);
                        generateMobileGridHtml();
                        $scope.$emit('OnNextClickProcessed');
                        return;
                    }
                    if (isValid) {
                        PageRouteService.RunPostValidation(enums.ValidationType.Valid);
                    } else {
                        if (isWarn) {
                            if ($scope.FirstClick) {
                                if (errorMessage)
                                    ValidatorService.ShowError(isWarn, errorMessage, $scope.qObject.ID);
                                $scope.FirstClick = false;
                            } else {
                                PageRouteService.RunPostValidation(enums.ValidationType.Valid);
                            }
                        } else {
                            if (errorMessage)
                                ValidatorService.ShowError(isWarn, errorMessage, $scope.qObject.ID);
                            ValidatorService.ShakeMe();
                            PageRouteService.RunPostValidation(enums.ValidationType.InValid);
                        }

                    }
                }
            }

            function isMobileFriendlyEnabled() {
                return ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid || $scope.qObject.QuestionType == enums.QuestionType.NumericGrid ||
                    $scope.qObject.QuestionType == enums.QuestionType.TextGrid || $scope.qObject.QuestionType == enums.QuestionType.Distribution) &&
                    $scope.qObject.Properties.MobileFriendly == 'true';
            }

            function isNotLastIndex() {
                var currentIndex = getCurrentIndexForMobileGrid();
                if (currentIndex == -1) {
                    return false;
                }
                if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid || $scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                    return currentIndex != $scope.qObject.QuestionLevelSequence.length - 1;
                } else {
                    return currentIndex != $scope.qObject.Groups[$scope.qObject.MasterAttribute.GroupSequence[0]].VariableSequence.length - 1;
                }
            }

            function isNotNull(value) {
                return value != null && value != undefined;
            }

            function getCurrentIndexForMobileGrid() {
                var currentIndex = -1;
                if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid || $scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                    currentIndex = $scope.qObject.QuestionLevelSequence.map(function (x) {
                        return x.ID;
                    }).indexOf($scope.AttributePointer);
                } else if ($scope.qObject.QuestionType == enums.QuestionType.TextGrid || $scope.qObject.QuestionType == enums.QuestionType.NumericGrid) {
                    currentIndex = $scope.ColumnIndexPointer;
                }
                return currentIndex;
            }

            function updateCurrentPointerForMobileGrid(forward) {
                var currentIndex = getCurrentIndexForMobileGrid();
                if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid || $scope.qObject.QuestionType == enums.QuestionType.Distribution) {
                    if (forward && isNotLastIndex()) {
                        $scope.AttributePointer = $scope.qObject.QuestionLevelSequence[currentIndex + 1].ID;
                    } else if (currentIndex >= 0) {
                        $scope.AttributePointer = $scope.qObject.QuestionLevelSequence[currentIndex - 1].ID;
                    }
                } else if ($scope.qObject.QuestionType == enums.QuestionType.TextGrid || $scope.qObject.QuestionType == enums.QuestionType.NumericGrid) {
                    if (forward && isNotLastIndex())
                        $scope.ColumnIndexPointer = currentIndex + 1;
                    else if (currentIndex >= 0)
                        $scope.ColumnIndexPointer = currentIndex - 1;
                }
            }

            function autoCodeConflictCallback(validationType) {
                window.save = $scope.SaveConflictAnswer;
                window.saveAutocodeOther = $scope.SaveAutocodeOtherAnswer;
                var xh = "";
                if (validationType == enums.ValidationType.AutoCodeConflict) {
                    for (var i in $scope.AliasConflict) {
                        xh += '<span class="conflict-choices clickable" onclick="save(' + i + ', this)">' +
                            $scope.AliasConflict[i] + ' </span>';
                    }
                } else {
                    for (var i in $scope.SimilarityText) {
                        xh += '<span class="conflict-choices clickable font-size-Xlg" onclick="save(' + i + ', this)">' +
                            $scope.SimilarityText[i] + ' </span>';
                    }
                }
                xh += '<span class="conflict-choices clickable" onclick="saveAutocodeOther(undefined, this)">Other</span>';
                window.closeModal = function () {
                    $scope.SaveAnswerAfterConflictResolved();
                    $scope.ConflictPopupBroadcast = false;
                    var page = document.getElementById('page');
                    var modal = document.getElementById("modal");
                    page.removeChild(modal);
                }
                return xh;
            }

            function errorCallback(IsWarning, message) {
                $scope.ErrorConfig.Message = message;
                $scope.ErrorConfig.Style = IsWarning ? {
                    'background-color': '#e65c00'
                } : {
                    'background-color': '#990000'
                };
                $scope.ErrorConfig.CaretStyle = IsWarning ? {
                    'border-bottom': '5px solid #e65c00'
                } : {
                    'border-bottom': '5px solid #990000'
                };
                $scope.ErrorConfig.ShowError = true;
            }

            function hideErrorCallback() {
                $scope.ErrorConfig.ShowError = false;
            }

            function shiftFocusForOTP(event) {
                if (!event)
                    return;
                if ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105))
                    document.getElementById(parseInt(event.currentTarget.id) + 1).focus();

            }

            function sendOTP() {
                $scope.SendClicked = true;
                var variableName = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID].Name;
                var mobileNumber = respondentService.GetVariableAnswers(variableName)[0];
                var respID = respondentService.GetVariableAnswers('ID')[0];
                if (mobileNumber && respID) {
                    var mode = respondentService.IsTest === enums.SurveyType.Live ? "live" : "test";
                    CommunicationService.SendOTP(mobileNumber, respID, mode).then(function () {
                        $scope.otpMessage = "OTP sent successfully!";
                    }, function (err) {
                        $scope.otpMessage = err.data ? err.data.Message + "!" : err.Message + "!";
                    });
                }
            }

            function verifyOTP() {
                //setOTPVerificationAnswer(false);
                var enteredOtp = $scope.EnteredOTP.join('');
                var variableName = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[0].ID].Name;
                var mobileNumber = respondentService.GetVariableAnswers(variableName)[0];
                var respID = respondentService.GetVariableAnswers('ID')[0];
                if (mobileNumber && respID && $scope.EnteredOTP.length > 0) {
                    if (ValidatorService.VerifyOTP(mobileNumber, respID, enteredOtp)) {
                        ValidatorService.VerifiedQuestionOTPMap[$scope.qObject.ID] = true;
                        setOTPVerificationAnswer(true);
                        $scope.otpMessage = "OTP valid, click next to continue!";
                    } else {
                        ValidatorService.VerifiedQuestionOTPMap[$scope.qObject.ID] = false;
                        setOTPVerificationAnswer(false);
                        $scope.otpMessage = "Invalid OTP, enter correct OTP or try resend OTP!";

                    }
                    ;
                    ValidatorService.QuestionOTPMap[$scope.qObject.ID] = $scope.EnteredOTP;
                }
                var surveyMode = respondentService.GetSurveyMode();
                if (surveyMode != enums.SurveyMode.New && surveyMode != enums.SurveyMode.Resume) {
                    ValidatorService.VerifiedQuestionOTPMap[$scope.qObject.ID] = true;
                    ValidatorService.QuestionOTPMap[$scope.qObject.ID] = $scope.EnteredOTP;
                    //setOTPVerificationAnswer(true);
                    $scope.otpMessage = "OTP valid, click next to continue!";
                }
            }

            function setOTPVerificationAnswer(isOTPVerified) {
                var targetVariable = $scope.qObject.Variables[$scope.qObject.QuestionLevelSequence[1].ID];
                if (targetVariable) {
                    var answer = isOTPVerified ? targetVariable.Options[targetVariable.VariableLevelSequence[0].ID].Code : targetVariable.Options[targetVariable.VariableLevelSequence[1].ID].Code;
                    var ansObject = respondentService.GetAnswerObject([answer], enums.VariableType.SingleChoice, targetVariable.Name, $scope.qObject.ID);
                    respondentService.SaveAnswer(ansObject);
                }
            }

            function IsOTPValid() {
                var non_blank_digits = $scope.EnteredOTP.filter(function (item, index) {
                    return item != "";
                });
                if (non_blank_digits.length) {
                    return ValidatorService.VerifiedQuestionOTPMap[$scope.qObject.ID];
                } else {
                    return true;
                }
            }


        }
    }

    angular
        .module("SurveyEngine").filter('trusted', ['$sce', function ($sce) {
        return function (url) {
            return $sce.trustAsResourceUrl(url);
        };
    }]);
})(angular);
