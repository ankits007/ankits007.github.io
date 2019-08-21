(function (angular) {
    'use strict';
    /**
     * @ngdoc object
     * @name SurveyEngineCore.controller:EngineCore.FlowController
     * @description This controller is responsible for managing the flow of the survey engine.
     **/
    angular.module('SurveyEngineCore').controller('EngineCore.FlowController', FlowController);

    FlowController.$inject = ['$scope', '$compile', '$q', 'EngineCore.SurveyTreeService',
        'EngineCore.TraversalListService', 'SurveyEngine.Enums', "SurveyEngine.RespondentService",
        "SurveyEngine.SurveySettings", "EngineCore.TestGenerator", "SurveyInitializationService",
        "EngineCore.CommunicationService", "SurveyEngine.UIService", "EngineCore.ReviewScrollService", "$sce",
        "SurveyEngine.NavigatorService", "$timeout", "SurveyEngine.PageRouteService", "SurveyEngine.ValidatorService", 'insights'
    ];

    function FlowController($scope, $compile, $q, SurveyTreeService, TraversalListService, Enums,
        RespondentService, SurveySettings, TestGenerator, SurveyInitializationService, CommunicationService,
        UIService, ReviewScrollService, $sce, NavigatorService, $timeout, PageRouteService, ValidatorService, insights) {

        $scope.PageBufferObject = [{}];
        $scope.IsReviewedAtEnd = false;
        $scope.ReviewScrollService = new ReviewScrollService();
        $scope.AppliedTheme = "";
        $scope.progressBar = {
            Callbacks: {}
        };
        $scope.ShowProgress = true;
        $scope.autoTest = {
            text: "Initializing Testing Environment",
            progress: 0
        };

        // Set IsTest Property in Respondent Service
        RespondentService.IsTest = TestGenerator.isTestEnabled ? Enums.SurveyType.Test : Enums.SurveyType.Live;

        var vm = this;
        var isBackMoved = false;

        $scope.Navigation = {
            isBackDisabled: true,
            isNextDisabled: false,
            isSubmitDisabled: false
        };
        $scope.UserSelected = {
            Password: '',
            Language: ''
        };

        vm.RuntimeError = {};
        vm.RuntimeError.isEnabled = false;
        vm.RuntimeError.script = {};
        vm.RuntimeError.message = "";

        $scope.ValidationMessage = {};
        $scope.ShowSectionName = false;

        var pageBuffer = new PageBuffer();
        vm.SurveyStatus = null;
        vm.SurveyMode = null;
        vm.SECTION_ID = null;

        $scope.TestCount = 1;


        //Detecting Browser
        UIService.DetectBrowser();

        SurveyInitializationService.InitSurvey().then(function () {
            $scope.showAutoProgress = TestGenerator.isTestEnabled;
            $scope.autoTest.max = TestGenerator.MaxTestCount;
            var promises = [];
            SurveySettings.ApplyChanges();
            $scope.showProgressBar = SurveySettings.ShowProgressBar();
            promises.push(RespondentService.load(SurveySettings.QueryParameter.ProjectGUID));
            promises.push(SurveyTreeService.load());
            $q.all(promises).then(function (response) {
                // Set Language when survey is resumed
                var lang = r("CLang").GetValue();
                var allLang = SurveySettings.GetAllLanguages();
                for (var i in allLang) {
                    if (lang == RespondentService.GetLanguageCode(i)) {
                        SurveySettings.SetSurveyLanguage(i);
                    }
                }
                vm.SurveyMode = RespondentService.GetSurveyMode();
                $scope.UserSelected.Language = SurveySettings.GetSurveyLanguage();

                //doing because of a bug that is not letting default language set properly
                overwriteLanguageKey();

                UIService.SurveyMode = vm.SurveyMode;
                // If survey mode is preview then initiate preview survey
                if (vm.SurveyMode === Enums.SurveyMode.Preview) {
                    $scope.$emit('OnInitPreview');
                    SurveyTreeService.resetSurveyTree();
                }
                $scope.progressBar.Properties = SurveySettings.GetProgressBarProperties();
                TraversalListService.initTraversalList(response[0], vm.SurveyMode);
                SurveyTreeService.setSurveyTreePointer(TraversalListService.getLastTNode());
                if (vm.SurveyMode == Enums.SurveyMode.Review || vm.SurveyMode == Enums.SurveyMode.View) {
                    SurveyTreeService.setProgress(0);
                } else {
                    SurveyTreeService.initProgress(TraversalListService.getLastAnsweredQuestionID());
                }
                if (vm.SurveyMode == Enums.SurveyMode.New) {
                    // hit api
                    CommunicationService.HitApi(SurveySettings.GetSurveyLaunchApiPath());
                }
                pageBuffer.setStartupPage();
                pageBuffer.updateSurveyTitle();
                if (pageBuffer.isAuthEnabled()) {
                    pageBuffer.authView();
                } else if (pageBuffer.isLanguageSelectEnabled()) {
                    pageBuffer.languageSelectorView();
                } else {
                    var lastNode = TraversalListService.getTraversalListPointer();
                    if (vm.SurveyMode == Enums.SurveyMode.Resume && lastNode && lastNode.ParentNodeID) {
                        var seqNode = SurveyTreeService.getSequencerNode(lastNode.ParentNodeID);
                        if (seqNode) {
                            if (seqNode.SequenceType != Enums.SequenceType.InOrder) {
                                processSequencer(seqNode, Enums.ObjectType.Sequencer);
                            }
                            seqNode.SequenceType = Enums.SequenceType.InOrder;
                        }
                    }
                    startFlow();
                }
            });
        });

        $scope.OnPassKeyUp = function (ev) {
            if (ev.keyCode === 13) {
                $scope.Authenticate();
            }
        }

        $scope.Authenticate = function () {
            var deferred = $q.defer();
            CommunicationService.Authenticate($scope.UserSelected.Password).then(function (resp) {
                if (pageBuffer.isLanguageSelectEnabled()) {
                    pageBuffer.languageSelectorView();
                } else {
                    startFlow();
                }
                deferred.resolve();
            }, function (reject) {
                // Show Auth Error
                $scope.UserSelected.isFailed = true;
                deferred.reject();
            });
            return deferred.promise;
        };

        $scope.SelectLanguage = function () {
            onChangeLanguage();
            startFlow();
        };

        $scope.SetLanguage = function (lang) {
            $scope.UserSelected.Language = lang;
        }
        $scope.ShowLanguages = function (args) {
            pageBuffer.showLanguageSelector();

            // update only in preview mode
            if (vm.SurveyMode === Enums.SurveyMode.Preview && window.frameElement && args != "DoNotRefresh") {
                postMessageCase("showLang", window.frameElement.id);
            }
        };

        $scope.GoBack = function () {
            if (NavigatorService.blockNavigation) {
                return;
            }
            RespondentService.SetAnimation('fadeInDownBig');
            isBackMoved = true;
            if (SurveySettings.IsLanguageSelectorEnabled() && pageBuffer.isLanguageSelectEnabled()) {
                pageBuffer.setLanguageSelector(false);
                pageBuffer.languageSelectorView();
            } else {
                // subtract questions when moved back
                // var distance =
                //  SurveyTreeService.setProgress(-pageBuffer.getBuffer().length);
                // Get Last node from traversal list and set it as the currentNode in SurveyTreeService.
                var lastNode = TraversalListService.getTraversalListPointer();
                SurveyTreeService.setSurveyTreePointer(lastNode);
                SurveyTreeService.moveSurveyTreePointer(TraversalListService.MOVE_BACKWARD);
                // Delete the visited Node from the traversal list
                try {
                    TraversalListService.deleteFromList();
                    if (vm.SurveyMode == Enums.SurveyMode.Resume && lastNode.ParentNodeID) {
                        var seqNode = SurveyTreeService.getSequencerNode(lastNode.ParentNodeID);
                        if (seqNode) {
                            if (seqNode.SequenceType != Enums.SequenceType.InOrder) {
                                processSequencer(seqNode, Enums.ObjectType.Sequencer);
                            }
                            seqNode.SequenceType = Enums.SequenceType.InOrder;
                        }
                    }
                    startFlow();
                } catch (e) {
                    $scope.Navigation.isBackDisabled = true;
                }
            }
        };

        $scope.GoNext = function () {
            RespondentService.SetAnimation('fadeInUpBig');
            // If mode is not preview or review then only save the respondent
            if (vm.SurveyMode !== Enums.SurveyMode.Preview && vm.SurveyMode !== Enums.SurveyMode.Review &&
                vm.SurveyMode !== Enums.SurveyMode.View && !TestGenerator.isTestEnabled) {
                RespondentService.SaveRespondent("InterimSave");
            } else if (vm.SurveyMode == Enums.SurveyMode.Review && RespondentService.IsOffline()) {
                RespondentService.SaveRespondent("InterimSave");
            }
            isBackMoved = false;
            if ($scope.PageBufferObject.length > 0) {
                var traversalNode = new TraversalNode(vm.SECTION_ID, $scope.PageBufferObject);
                TraversalListService.addToList(traversalNode, vm.SECTION_ID);
            }
            SurveyTreeService.moveSurveyTreePointer(TraversalListService.MOVE_FORWARD);
            startFlow();
            console.log(RespondentService.GetAnswers());
        };

        $scope.Accept = function () {
            RespondentService.SetBackCheck(Enums.BackCheckStatus.Accepted);
            onBackCheckChange(Enums.BackCheckStatus.Accepted);
        };

        $scope.Reject = function () {
            var modifiedBy = RespondentService.GetVariableAnswers("ModifiedBy");
            RespondentService.RollbackRespondent();
            RespondentService.CreateSystemVariable("ModifiedBy", modifiedBy, Enums.VariableType.Text);
            RespondentService.SetBackCheck(Enums.BackCheckStatus.Rejected);
            onBackCheckChange(Enums.BackCheckStatus.Rejected);
        };

        function onBackCheckChange(backCheck) {
            $scope.$emit('OnBackCheckStatusChange');
            if (SurveySettings.IsBackCheckChangeJumpEnabled()) {
                var jumpNode = SurveySettings.GetBackCheckJumpNode(backCheck);
                if (jumpNode != null) {
                    SurveyTreeService.setNextSurveyTreePointer(getJumpNodePointer(jumpNode, null, true));
                    $scope.GoNext();
                    CommunicationService.CloseWebview(backCheck, false);
                } else {
                    parent.postMessage("loader###", "*");
                    RespondentService.SaveRespondent("ReviewSave").then(function () {
                        parent.postMessage("review###" + backCheck, "*");
                        CommunicationService.CloseWebview(backCheck, true);
                    });
                }
            } else {
                parent.postMessage("loader###", "*");
                RespondentService.SaveRespondent("ReviewSave").then(function () {
                    parent.postMessage("review###" + backCheck, "*");
                    CommunicationService.CloseWebview(backCheck, true);
                });
            }
        }

        $scope.ValidateBeforeNext = function (args) {

            document.getElementById("page").scrollTop = 0;
            if (NavigatorService.blockNavigation) {
                return;
            }
            TraversalListService.setMovement(TraversalListService.MOVE_FORWARD);
            pageBuffer.resetValidation();
            if ($scope.IsReviewedAtEnd) {
                $scope.GoNext();
            } else if (isMobileFriendlyGrid(pageBuffer.getBuffer())) {
                if (isLastAttribute()) {
                    if (pageBuffer.validate()) {
                        PageRouteService.RunValidation();
                    } else {
                        $scope.$broadcast('ResetMimic');
                    }
                } else {
                    PageRouteService.RunValidation();
                }
            } else if (pageBuffer.validate()) {
                PageRouteService.RunValidation();
            } else {
                $scope.$broadcast('ResetMimic');
            }
            /*
                        // update only in preview mode
                        if (vm.SurveyMode === Enums.SurveyMode.Preview && window.frameElement && args!="DoNotRefresh") {
                            postMessageCase("moveNext", window.frameElement.id);
                        }*/
        };

        $scope.BroadcastBeforeBack = function (args) {
            TraversalListService.setMovement(TraversalListService.MOVE_BACKWARD);
            if (PageRouteService.RunBeforeBack()) {
                $scope.GoBack();
            } else if (SurveySettings.IsBackButtonDisable) {
                $scope.Navigation.isBackDisabled = true;
            }
            // update only in preview mode
            if (vm.SurveyMode === Enums.SurveyMode.Preview && window.frameElement && args != "DoNotRefresh") {
                postMessageback(window.frameElement.id);
            }
        };

        function postMessageback(frameID) {
            if (frameID == 'receiver2') {
                var frame1 = parent.document.getElementById('receiver').contentWindow;
                frame1.postMessage("moveback###" + JSON.stringify(TraversalListService.MOVE_BACKWARD), window.location.href);
            } else {
                var frame2 = parent.document.getElementById('receiver2').contentWindow;
                frame2.postMessage("moveback###" + JSON.stringify(TraversalListService.MOVE_BACKWARD), window.location.href);
            }
        }

        function startFlow() {
            var headNode = null;
            $scope.Navigation.isBackDisabled = SurveySettings.IsBackButtonDisable;
            if (TraversalListService.getTraversalList().length === 0) {
                $scope.Navigation.isBackDisabled = true;
            } else {
                $scope.Navigation.isBackDisabled = SurveySettings.IsBackButtonDisable || false;
            }
            PageRouteService.Flush();
            ValidatorService.ResetErrorCallbacks();
            NavigatorService.removeListeners();
            SurveyTreeService.getCurrentSurveyTreeNode().then(function (node) {
                pageBuffer.destroyView();
                vm.SECTION_ID = null;
                $scope.PageBufferObject = [];
                headNode = node;
                if (!headNode) {
                    return processBeforeEnd();
                }
                // If Survey Tree Item is deleted then go next ignoring the path
                if (headNode.IconFlag && (headNode.IconFlag & Enums.DisplayFlag.Deleted) === Enums.DisplayFlag.Deleted ||
                    (headNode.IconFlag & Enums.DisplayFlag.Hidden) === Enums.DisplayFlag.Hidden) {
                    moveToNextNode();
                    return;
                }
                var nodeType = headNode.SurveyObjectType || headNode.ObjectType;
                var nodeId = headNode.SurveyObjectID || headNode.ID;
                switch (nodeType) {
                    case Enums.ObjectType.Sequencer:
                        {
                            $scope.IsReviewedAtEnd = false;
                            if (node.SequenceType != Enums.SequenceType.InOrder) {
                                processSequencer(node, nodeType);
                            }
                            node.SequenceType = Enums.SequenceType.InOrder;
                            var firstChild = node.Children.length > 0 ? node.Children[0] : null;
                            var nextNodePointer, nextNodeID;
                            if (firstChild == null) {
                                var nextNode = SurveyTreeService.getNextSurveyTreeNode();
                                nextNodeID = nextNode.SurveyObjectID || nextNode.ID;
                                var nextParentNodeID = SurveyTreeService.getParentNodeID(nextNodeID);
                                nextNodePointer = new NodePointer(nextParentNodeID, nextNodeID, null)
                            } else {
                                nextNodeID = firstChild.SurveyObjectID || firstChild.ID;
                                nextNodePointer = new NodePointer(nodeId, nextNodeID, null);
                            }
                            SurveyTreeService.setNextSurveyTreePointer(nextNodePointer);
                            $scope.GoNext();
                            // process sequencer
                            break;
                        }
                    // All types scripts at Root Level
                    case Enums.ObjectType.SetValue:
                    case Enums.ObjectType.Jump:
                        {
                            // process logic;
                            $scope.IsReviewedAtEnd = false;
                            SurveyTreeService.getSurveyTreeScript(nodeId).then(function (script) {
                                // If script is string (GUID) then it is not found. So ignore that script and move to next node.
                                if (typeof script === "object") {
                                    var nextNodePointer = processLogic(script);
                                    SurveyTreeService.setNextSurveyTreePointer(nextNodePointer);
                                    $scope.GoNext();
                                } else {
                                    moveToNextNode();
                                }
                            });
                            break;
                        }
                    // After Deep loading survey tree its nodes properties gets changed
                    case Enums.ObjectType.Section:
                        {
                            // process section
                            $scope.IsReviewedAtEnd = false;
                            processSection(nodeId);
                            break;
                        }
                    case Enums.ObjectType.SurveyEnd:
                        {
                            processBeforeEnd(nodeId);
                            break;
                        }

                    case Enums.ObjectType.Quota:
                        {
                            SurveyTreeService.getQuotaNode(nodeId).then(function (quota) {
                                processQuota(quota.Quota);
                            });
                        }
                }
            });

            function moveToNextNode() {
                var nextNode = SurveyTreeService.getNextSurveyTreeNode();
                var nextNodeId = nextNode.SurveyObjectID || nextNode.ID;
                var parentOfNextNode = SurveyTreeService.getParentNodeID(nextNodeId);
                var nextNodePointer = new NodePointer(parentOfNextNode, nextNodeId, null);
                SurveyTreeService.setNextSurveyTreePointer(nextNodePointer);
                $scope.GoNext();
            }
        }

        function processBeforeEnd(nodeId) {
            if ((SurveySettings.IsEndReviewEnabled() || vm.SurveyMode == Enums.SurveyMode.View) && !TestGenerator.isTestEnabled) {
                if ($scope.IsReviewedAtEnd) {
                    SurveyTreeService.getSurveyEndNode(nodeId).then(function (endNode) {
                        processEndOfSurvey(endNode, pageBuffer.setSubmitButtonOnEnd(SurveySettings.IsSubmitButtonEnabled()));
                    });
                } else {
                    pageBuffer = new PageBuffer();
                    pageBuffer.reviewResponses();
                }
            } else {
                SurveyTreeService.getSurveyEndNode(nodeId).then(function (endNode) {
                    processEndOfSurvey(endNode, pageBuffer.setSubmitButtonOnEnd(SurveySettings.IsSubmitButtonEnabled()));
                });
            }
        }

        function processSection(nodeId) {
            var deferred = $q.defer();
            SurveyTreeService.getSection(nodeId).then(function (section) {
                // If the section is deleted then go to next node in the flow
                if (section.IconFlag && (section.IconFlag === Enums.DisplayFlag.Deleted ||
                    (section.IconFlag & Enums.DisplayFlag.Deleted) === Enums.DisplayFlag.Deleted)) {

                    setNextNodePointer();
                    $scope.GoNext();
                    deferred.resolve();
                    return;
                }


                SurveyTreeService.setCurrentSectionName(section.Name);
                // Boolean : to show section title
                $scope.ShowSectionName = section.ShowTitle;
                var sectionNode = section;
                vm.SECTION_ID = sectionNode.ID;
                var sectionChildNodes = [];
                var startingIndex = SurveyTreeService.getChildIndex();
                RespondentService.SetPossibleLoopIterations([]);
                if (sectionNode.Sequencer.SequenceType != Enums.SequenceType.InOrder) {
                    //sectionNode = angular.copy(section);
                    processSequencer(sectionNode, Enums.ObjectType.Section);
                    sectionNode.Sequencer.SequenceType = Enums.SequenceType.InOrder;
                }
                if (sectionNode.IsLoopEnabled) {
                    sectionNode = angular.copy(sectionNode);
                    processLoop(sectionNode, startingIndex);
                    // sectionNode.IsLoopEnabled = false;
                }

                sectionChildNodes = sectionNode.Children;
                pageBuffer = new PageBuffer();
                if (TraversalListService.getTraversalList().length === 0 && SurveySettings.IsLanguageSelectorEnabled() && !pageBuffer.isLanguageSelectEnabled()) {
                    $scope.Navigation.isBackDisabled = SurveySettings.IsBackButtonDisable || false;
                    pageBuffer.setLanguageSelector(true);
                }
                var nodePointer = null;
                var SECTION_PARENT_ID = SurveyTreeService.getParentNodeID(sectionNode.ID);
                // Add Questions to PageBuffer
                for (var i = startingIndex; i < sectionChildNodes.length; i++) {
                    var childNode = sectionChildNodes[i];
                    var childNodeType = childNode.SurveyObjectType || childNode.ObjectType;
                    // Node conditions checked on priority basis
                    // ******Do not change orders of these condition checks*******
                    // Priority Levels : 1. Page break ------    2. Question Per Page ------    3. Script ------   4. Question
                    if (childNodeType == Enums.SurveyObjectType.PageBreak) {
                        nodePointer = processPageBreak(sectionNode.ID, sectionChildNodes, i, pageBuffer.size());
                        if (nodePointer == null) {
                            continue;
                        }
                        break;
                    }

                    if (pageBuffer.size() == SurveySettings.QuestionPerPage) {
                        nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, childNode.ID || childNode.SurveyObjectID);
                        break;
                    }

                    if (childNodeType == Enums.ObjectType.Script) {
                        // Get the variable on which script is based to check if the variable is on the same pageBuffer
                        // then no need to execute the script as the data for that variable is not punched yet.
                        var tarVariables = getVariablesFromScriptBody(childNode.Body);
                        if (childNode.Type === Enums.ScriptType.Jump) {
                            if (pageBuffer.containsAny(tarVariables)) {
                                nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, sectionChildNodes[i].ID);
                            } else {
                                nodePointer = processLogic(childNode, null, i + 1);
                                if (!nodePointer && i + 1 < sectionChildNodes.length) {
                                    nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, sectionChildNodes[i].ID);
                                }
                            }
                            break;
                        } else if (childNode.Type === Enums.ScriptType.SetValue) {
                            if (pageBuffer.containsAny(tarVariables)) {
                                nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, sectionChildNodes[i].ID);
                                break;
                            } else {
                                processLogic(childNode);
                            }
                        }
                    }

                    // Check for Quota
                    if (typeof childNode.Quota == "object" && childNode.Quota.ObjectType == Enums.ObjectType.Quota) {
                        if (pageBuffer.size() > 0) {
                            nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, sectionChildNodes[i].ID);
                            break;
                        } else {
                            if (i < (sectionChildNodes.length - 1)) {
                                var childNodeId = sectionChildNodes[i + 1].ID || sectionChildNodes[i + 1].SurveyObjectID;
                                // Means Next Node is Quota node and it the node has been fetched
                                if (!childNodeId && typeof sectionChildNodes[i + 1].Quota == "object") {
                                    childNodeId = sectionChildNodes[i + 1].ID;
                                }
                                nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, childNodeId);
                            } else {
                                i++;
                                nodePointer = getNextSiblingNode();
                            }
                            SurveyTreeService.setNextSurveyTreePointer(nodePointer);
                            processQuota(childNode.Quota);
                            deferred.resolve();
                            return;
                        }
                    }

                    if (childNodeType == Enums.ObjectType.Question) {
                        if (childNode.hasOwnProperty('ObjectType')) {
                            var ques = angular.copy(childNode);
                            var iter = ques.Name.split('.')[1];
                            if (iter) {
                                RespondentService.SetCurrentIteration(iter);
                            }
                            pageBuffer.initializeMaskingBit(ques);
                            var isMasked = processQuestion(ques);
                            // Set carry forward question so that changes made in the question can be handle.
                            SurveyTreeService.setCfQuestion(ques);
                            var containsCfQues = false;
                            if (ques.hasOwnProperty("CarryForwardConfiguration") && Array.isArray(ques.CarryForwardConfiguration.ParentQuestions)) {
                                for (var cfi = 0; cfi < ques.CarryForwardConfiguration.ParentQuestions.length; cfi++) {
                                    containsCfQues = containsCfQues ||
                                        pageBuffer.containsQuestionByID(ques.CarryForwardConfiguration.ParentQuestions[cfi].QuestionGUID);
                                }
                            }
                            if (childNode.ShowInSurvey) {
                                if (pageBuffer.containsAny(ques.MaskingVariableIDs) || containsCfQues) {
                                    nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, ques.ID);
                                    break;
                                } else {
                                    if (isMasked) {
                                        continue;
                                    }
                                    pageBuffer.add(ques);
                                    if (!ques.Properties.MobileFriendly) {
                                        ques.Properties.MobileFriendly = "false";
                                    }
                                    if (ques.QuestionType == Enums.QuestionType.SimpleGrid && ques.Properties.MobileFriendly == "true" && window.jsrcb.isMobile) {
                                        processAttributeMovement(ques);
                                        if (i < (sectionChildNodes.length - 1)) {
                                            var childNodeId = sectionChildNodes[i + 1].ID || sectionChildNodes[i + 1].SurveyObjectID;
                                            nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, childNodeId);
                                        } else {
                                            i++;
                                            nodePointer = null;
                                        }
                                        break;
                                    }
                                }
                            }
                        } else {
                            var nodeId = childNode.SurveyObjectID;
                            nodePointer = new NodePointer(SECTION_PARENT_ID, sectionNode.ID, nodeId);
                            break;
                        }
                    }
                } // END LOOP

                setNextNodePointer();

                // Set Progress based on the number of questions present in the section.
                if (!isBackMoved) {
                    //SurveyTreeService.setProgress(pageBuffer.getBuffer().length);
                }

                if (pageBuffer.hasQuestions()) {
                    // As the question display, set the masking bit to false.
                    $scope.PageBufferObject = pageBuffer.getBuffer();
                    vm.SECTION_ID = sectionNode.ID;
                    if (vm.SurveyMode == Enums.SurveyMode.View) {
                        for (var c = 0; c < $scope.PageBufferObject.length; c++) {
                            $scope.ReviewScrollService.addQuestion($scope.PageBufferObject[c]);
                        }
                        $scope.GoNext();
                    } else {
                        if (TestGenerator.isTestEnabled) {
                            pageBuffer.runTest();
                        } else {
                            pageBuffer.renderView();
                        }
                        deferred.resolve();
                    }
                } else {
                    $scope.GoNext();
                }

                function getNextSiblingNode() {
                    var nextNode;
                    if (sectionChildNodes.length == 0) {
                        nextNode = SurveyTreeService.getNextSurveyTreeNode(999999);
                    } else {
                        nextNode = SurveyTreeService.getNextSurveyTreeNode(i);
                    }
                    var nextNodeID = nextNode.SurveyObjectID || nextNode.ID;
                    var parentNodeID = SurveyTreeService.getParentNodeID(nextNodeID);
                    return new NodePointer(parentNodeID, nextNodeID, null);
                }

                function setNextNodePointer() {
                    if (nodePointer == null) {
                        nodePointer = getNextSiblingNode();
                    }
                    SurveyTreeService.setNextSurveyTreePointer(nodePointer);
                }
            });
            return deferred.promise;

            function processAttributeMovement(ques) {
                if (TraversalListService.getMovement() == TraversalListService.MOVE_BACKWARD) {
                    var currentPtr = ques.QuestionLevelSequence[ques.QuestionLevelSequence.length - 1].ID;
                    if (TraversalListService.getTraversalList().length === 0 && ques.QuestionLevelSequence.length == 1) {
                        $scope.Navigation.isBackDisabled = true;
                    } else {
                        $scope.Navigation.isBackDisabled = false;
                    }
                    TraversalListService.setAttrPointer(currentPtr);
                } else {
                    TraversalListService.setAttrPointer(ques.QuestionLevelSequence[0].ID);
                }
            }
        }

        function processLoop(section, qIndex) {
            var maxIterationsNumbers = [];
            var iterations = [],
                maxIteration;
            var maskedIteration = [];
            var count = 0;

            var sectionChildren = section.Children;
            section.Children = [];

            if (section.LoopChoice === Enums.LoopChoice.QuestionBased) {
                var baseVar = section.LoopVariableName;
                var baseVarAnswers = getLoopIterations();
                var baseVarType = RespondentService.GetVariableType(baseVar);
                // variable type equals null in case of grid question and exec condition on all variables.
                if (baseVarType == Enums.VariableType.SingleChoice || baseVarType == Enums.VariableType.MultipleChoice || baseVarType == null) {
                    maxIterationsNumbers.filter(function (n) {
                        if (baseVarAnswers.hasItem(n)) {
                            return true;
                        }
                        maskedIteration.push(n);
                        return false;
                    });
                    iterations = baseVarAnswers.slice(0);
                    maxIteration = maxIterationsNumbers.length;
                } else if (baseVarType == Enums.VariableType.Numeric) {
                    for (var i = 1; i <= baseVarAnswers[0]; i++) {
                        iterations.push(i);
                    }
                    maxIteration = section.MaxIterations;
                    for (var i = 1; i <= maxIteration; i++) {
                        maxIterationsNumbers.push(i);
                    }
                    maskedIteration = maxIterationsNumbers.filter(function (n) {
                        return !iterations.hasItem(n);
                    });
                } else { // If loop is based on some variable & that variable doesn't exist ignore the loop.
                    console.log("Skipping Loop either variable is non categorical or it is not present in the respondent.");
                    return;
                }
            } else {
                for (var i = 1; i <= section.LoopChoiceCount; i++) {
                    iterations.push(i);
                }
            }
            if (iterations.length > maxIteration) {
                count = maxIteration;
            } else {
                count = iterations.length;
            }

            if (section.LoopChoiceSelection == Enums.LoopChoiceSelection.Randomly) {
                var seed = RespondentService.GetSeed();
                var chance = new Chance(seed);
                iterations = chance.shuffle(iterations);
            }

            // Set the loop count for each loop section
            window.r(section.LoopCountVariable).SetValue(section.LoopCountQuestionID, Enums.VariableType.Numeric, count);
            RespondentService.SetPossibleLoopIterations(iterations);
            for (var x = 0; x < count; x++) {
                for (var y = 0; y < sectionChildren.length; y++) {
                    var newQuestion = angular.copy(sectionChildren[y]);
                    var nodeID = (newQuestion.SurveyObjectID || newQuestion.ID) + "|" + iterations[x];
                    var objType = sectionChildren[y].ObjectType || sectionChildren[y].SurveyObjectType;
                    if (objType === Enums.ObjectType.Question) {
                        var quesText = newQuestion.Text[SurveySettings.GetSurveyLanguage()] || newQuestion.Text[SurveySettings.GetDefaultLanguage()];
                        var queSplits = quesText.split(/\{\{(.*?)\}\}/);
                        var finalScript = ""
                        for (var r = 0; r < queSplits.length; r++) {
                            var callback = "";
                            if (r % 2 == 1) {
                                var scriptText = queSplits[r];
                                var splits = scriptText.split('.');
                                var resp = splits[0];
                                var callback;
                                if (splits.length > 1)
                                    callback = resp + "." + splits[1].split('(')[0] + "(" + iterations[x] + ")";
                                else
                                    callback = resp;
                                finalScript += ' {{' + callback + '}} ';
                            } else {
                                finalScript += queSplits[r];
                            }
                        }
                        newQuestion.Text[SurveySettings.GetSurveyLanguage()] = finalScript;
                        newQuestion.Name = sectionChildren[y].Name + "." + iterations[x];
                        newQuestion.ID = nodeID;
                        for (var v in newQuestion.Variables) {
                            newQuestion.Variables[v].Name = sectionChildren[y].Variables[v].Name + "." + iterations[x];
                            //RespondentService.SetMaskingBit(newQuestion.Variables[v].Name, false);
                            // Set masking bit for masked loop iteration
                            for (var mx = 0; mx < maskedIteration.length; mx++) {
                                var maskedVar = sectionChildren[y].Variables[v].Name + "." + maskedIteration[mx];
                                RespondentService.SetMaskingBit(maskedVar, true);
                            }
                        }
                    } else if (objType === Enums.ObjectType.PageBreak) {
                        newQuestion.SurveyObjectID = nodeID;
                    } else if (objType == Enums.ObjectType.Script) {
                        newQuestion.ID = nodeID;
                    } else if (newQuestion.hasOwnProperty("Quota") && newQuestion.Quota.ObjectType == Enums.ObjectType.Quota) {
                        newQuestion.ID = nodeID;
                        newQuestion.Quota.ID = nodeID;
                        SurveyTreeService.setQuotaNode(nodeID, newQuestion);
                    } else {
                        continue;
                    }
                    SurveyTreeService.addQuestionIndex(nodeID, section.Children.length);
                    section.Children.push(newQuestion);
                }
                var pageBreak = new PageBreak();
                // Add Page Break
                SurveyTreeService.addQuestionIndex(pageBreak.SurveyObjectID, section.Children.length);
                section.Children.push(pageBreak);
            }

            for (var x = qIndex; x < section.Children.length; x++) {
                if (section.Children[x].ObjectType == Enums.ObjectType.Question) {
                    var splits = section.Children[x].Name.split('.');
                    if (splits.length > 1) {
                        RespondentService.SetCurrentIteration(splits[1]);
                        break;
                    }
                }
            }
            SurveyTreeService.createIndexes(section.Children, section.ID, true);
            // mask loop variables

            function getLoopIterations() {
                var iterations = [];
                var question = SurveyTreeService.getQuesObject(section.LoopQuestionGUID);
                var baseVar = section.LoopVariableName; // If variable specified then call callback on that variable else iterate over all the variables of the
                // question and call callback for each variable.
                var callBack = section.LoopFunctionName;
                var callbackParam = section.LoopOptionCode; // Pass callback parameter only when it is defined.
                if (baseVar == "all" && typeof question == "object") {
                    var itr = [];
                    if (Object.keys(question.Attributes)) {
                        var variableCount = 0;
                        for (var i = 0; i < question.QuestionLevelSequence.length; i++) {
                            var attr = question.Attributes[question.QuestionLevelSequence[i].ID];
                            for (var j = 0; j < attr.GroupSequence.length; j++) {
                                var grp = question.Groups[attr.GroupSequence[j]];
                                for (var k = 0; k < grp.VariableSequence.length; k++) {
                                    variableCount++;
                                    var result = execCallback(question.Variables[grp.VariableSequence[k]].Name, callBack, callbackParam);
                                    if (callBack == "") {
                                        result.push(variableCount);
                                        itr = RespondentService.Union(itr, result);
                                        maxIterationsNumbers = window.r(question.Variables[grp.VariableSequence[k]].Name).AllValues();
                                        continue;
                                    }
                                    if (typeof result[0] == "boolean") {
                                        if ((section.FunctionNegation && !result[0]) || (!section.FunctionNegation && result[0])) {
                                            itr = RespondentService.Union(itr, [variableCount]);
                                            maxIterationsNumbers = window.r(question.Variables[grp.VariableSequence[k]].Name).AllValues();
                                        }
                                    } else {
                                        if (callBack == "UnSelectedValues") {
                                            if (itr.length == 0) {
                                                itr = result;
                                            }
                                            itr = RespondentService.Intersect(itr, result);
                                        } else {
                                            itr = RespondentService.Union(itr, result);
                                        }
                                        maxIterationsNumbers = window.r(question.Variables[grp.VariableSequence[k]].Name).AllValues();
                                    }
                                }
                            }
                        }
                    } else {
                        for (var vid in question.Variables) {
                            maxIterationsNumbers = window.r(question.Variables[vid].Name).AllValues(); // all options
                            itr = RespondentService.Union(itr, execCallback(question.Variables[vid].Name, callBack, callbackParam));
                        }
                    }
                    iterations = itr;
                } else {
                    maxIterationsNumbers = window.r(baseVar).AllValues(); // all options
                    iterations = execCallback(baseVar, callBack, callbackParam);
                }
                return iterations;
            }

            function execCallback(baseVar, callBack, callbackParam) {
                var iterations = [];
                if (typeof window.r(baseVar)[callBack] == "function") {
                    if (callbackParam) {
                        iterations = window.r(baseVar)[callBack](callbackParam);
                    } else {
                        iterations = window.r(baseVar)[callBack]();
                    }
                } else {
                    // For backward compatibility ...
                    // If no callback is passed then execute
                    iterations = RespondentService.GetVariableAnswers(baseVar);
                }
                if (!Array.isArray(iterations)) {
                    iterations = [iterations];
                }
                return iterations;
            }
        }

        function processQuotaLogic(scriptNode) {
            var returnedValue;
            try {
                returnedValue = (0, eval)(script);
                if (returnedValue instanceof $q) {
                    returnedValue.then(function (callback) {
                        if (typeof callback == "function") {
                            callback();
                        }
                    });
                }
            } catch (r) { }
        }

        function processLogic(scriptNode, question, childIndex) {
            var logicType = scriptNode.Type;
            var script = scriptNode.Body;
            // ALl the expression will return  something
            var returnedValue;
            if (scriptNode.hasOwnProperty("ScriptResult")) {
                returnedValue = scriptNode.ScriptResult;
            } else {
                try {
                    returnedValue = (0, eval)(script);
                    if (returnedValue instanceof $q) {
                        returnedValue.then(function (callback) {
                            if (typeof callback == "function") {
                                callback();
                            }
                        });
                    }
                } catch (e) {
                    console.log("Error while evaluating script (ID : " + scriptNode.ID + "). Check for syntax errors.");
                    if (vm.SurveyMode == Enums.SurveyMode.Preview) {
                        pageBuffer.enableRuntimeAlert(scriptNode, e);
                        returnedValue = {};
                        if (logicType === Enums.ScriptType.QuestionMasking)
                            return false;
                        if (logicType === Enums.ScriptType.OptionMasking)
                            return [];

                        var next = SurveyTreeService.getNextSurveyTreeNode(childIndex);
                        // For Page break ObjectType will be in 'SurveyObjectType' property of the next node.
                        if (next.hasOwnProperty("ObjectType") ||
                            (next.hasOwnProperty("SurveyObjectType") && next.SurveyObjectType == Enums.SurveyObjectType.PageBreak)) {
                            returnedValue.ID = next.ID || next.SurveyObjectID;
                            returnedValue.Type = next.ObjectType || next.SurveyObjectType;
                        } else {
                            var nexId = next.SurveyObjectID || next.ID;
                            var parentId = SurveyTreeService.getParentNodeID(nexId);
                            return new NodePointer(parentId, nexId, null);
                        }
                    } else {
                        if (logicType === Enums.ScriptType.QuestionMasking)
                            return false;
                        if (logicType === Enums.ScriptType.OptionMasking)
                            return [];

                        return new NodePointer(null, null, null);
                    }
                }
            }
            switch (logicType) {

                case Enums.ScriptType.QuestionMasking:
                    {
                        // If Question has been masked return true else false
                        // If the masked item is question then mask its variables also (set masking bit : true)
                        if (returnedValue && question) {
                            for (var i = 0; i < question.MaskingVariableIDs.length; i++) {
                                var varSplits = question.MaskingVariableIDs[i].split('.');
                                // means the variable is loop variable
                                if (varSplits.length > 1) {
                                    var iterationNumber = varSplits[varSplits.length - 1];
                                    var quesSplits = question.Name.split('.');
                                    var quesIteration = quesSplits[quesSplits.length - 1];
                                    // if the masking is for current iteration then mask else return false;
                                    if (iterationNumber !== quesIteration)
                                        return false;
                                }
                                var variables = [];
                                for (var i in question.Variables) {
                                    variables.push(question.Variables[i].Name);
                                }
                                maskVariables(variables);
                            }
                        }
                        return returnedValue;
                    }
                case Enums.ScriptType.OptionMasking:
                    return returnedValue || [];

                case Enums.ScriptType.OptionShow:
                    return returnedValue || [];

                case Enums.ScriptType.Jump:
                    return getJumpNodePointer(returnedValue, childIndex);

                case Enums.ScriptType.SetValue:
                    {
                        var nextNode = SurveyTreeService.getNextSurveyTreeNode(childIndex);
                        var nextNodeId = nextNode.SurveyObjectID || nextNode.ID;
                        var parentOfNextNode = SurveyTreeService.getParentNodeID(nextNodeId);
                        return new NodePointer(parentOfNextNode, nextNodeId, null);
                    }
                case Enums.ScriptType.AttributeMasking:
                    return returnedValue;

                case Enums.ScriptType.GroupMasking:
                    return returnedValue;

                case Enums.ScriptType.VariableMasking:
                    return returnedValue;

                case Enums.ScriptType.Validation:
                    return returnedValue;

                case Enums.ScriptType.AttributeCarryForwardScript:
                    return returnedValue;

                case Enums.ScriptType.OptionCarryForwardScript:
                    return returnedValue;
            }
            return null;
        }

        function getAllOrphanQuestions(startNodeId, endNodeId, childId) {
            var allQuestions = TraversalListService.getOrphanVariables(startNodeId, endNodeId, childId) || [];
            return allQuestions;
        }

        function maskVariables(orphanQuestions) {
            var answers = RespondentService.GetAnswers();
            for (var variable in answers) {
                if (orphanQuestions.indexOf(variable) > -1) {
                    RespondentService.SetMaskingBit(variable, true);
                }
            }
        }

        function getJumpNodePointer(destinationNode, childIndex, ignoreMasking) {
            //If no jump get the next node and set it as next node pointer
            if (!destinationNode.ID) {
                var next = SurveyTreeService.getNextSurveyTreeNode(childIndex, TraversalListService.getLoopIterations(vm.SECTION_ID));
                // For Page break ObjectType will be in 'SurveyObjectType' property of the next node.
                if (next.hasOwnProperty("ObjectType") ||
                    (next.hasOwnProperty("SurveyObjectType") && next.SurveyObjectType == Enums.SurveyObjectType.PageBreak)) {
                    destinationNode.ID = next.ID || next.SurveyObjectID;
                    destinationNode.Type = next.ObjectType || next.SurveyObjectType;
                } else {
                    var nexId = next.SurveyObjectID || next.ID;
                    var parentId = SurveyTreeService.getParentNodeID(nexId);
                    return new NodePointer(parentId, nexId, null);
                }
            }
            // Cannot Jump into the Loop so, ignore the Jump
            if (destinationNode.IconFlag === Enums.DisplayFlag.IsLoop) {
                return null;
            }
            var nextNodePointer = new NodePointer(null, null, null),
                startNodePointer = TraversalListService.getTraversalListPointer();
            var parentID = SurveyTreeService.getParentNodeID(destinationNode.ID);
            // Set masking bit of all the orphan variables
            if (startNodePointer != null && !ignoreMasking) {
                maskVariables(getAllOrphanQuestions(startNodePointer.NodeID, destinationNode.ID, startNodePointer.ChildNodeID));
            }

            if (destinationNode.Type == Enums.ObjectType.Section ||
                destinationNode.Type == Enums.ObjectType.Sequencer || destinationNode.Type == Enums.ObjectType.SurveyEnd) {
                nextNodePointer = new NodePointer(parentID, destinationNode.ID, null);
            } else {
                nextNodePointer = new NodePointer(null, parentID, destinationNode.ID);
            }
            return nextNodePointer;
        }

        function processSequencer(node, objectType) {
            var isPickRand = node.Sequencer && node.Sequencer.SequenceType === Enums.SequenceType.PickNInRandomOrder;
            var seedValue = RespondentService.GetSeed();
            var chance = new Chance(seedValue);
            var sequencedNodes = [];
            // Sequencer based on
            switch (objectType) {
                case Enums.ObjectType.Sequencer:
                case Enums.SurveyObjectType.Sequencer:
                    var sequencerID = node.SurveyObjectID || node.ID;
                    var nodesToSequence = node.Children;
                    // If it contains Logic or End Node then ignore the sequencer.
                    for (var i = 0; i < nodesToSequence.length; i++) {
                        var objectType = nodesToSequence[i].ObjectType || nodesToSequence[i].SurveyObjectType;
                        if (objectType === Enums.ObjectType.SurveyEnd || objectType === Enums.ObjectType.Jump) {
                            return;
                        }
                    }
                    sequencedNodes = chance.shuffle(nodesToSequence); // Randomized
                    if (isPickRand) {
                        sequencedNodes.length = node.Sequencer.PickCount;
                    }
                    SurveyTreeService.shuffleNodes(sequencerID, sequencedNodes);
                    SurveyTreeService.createIndexes(sequencedNodes, sequencerID);
                    node.Children = sequencedNodes;
                    break;

                case Enums.SurveyObjectType.Section:
                case Enums.ObjectType.Section:
                    sequenceSection();
                    break;

                case Enums.ObjectType.Question:
                    var nodesToSequence = node.QuestionLevelSequence;
                    var fixedIndexes = [],
                        otherIndexes = [];
                    for (var i = 0; i < nodesToSequence.length; i++) {
                        // check if node is attribute then only go for IsFixed
                        if (nodesToSequence[i].ObjectType == Enums.ObjectType.Attribute) {
                            var attribute = node.Attributes[nodesToSequence[i].ID];
                            if (attribute.hasOwnProperty("IsFixed") && attribute.IsFixed) {
                                fixedIndexes.push(i);
                            } else {
                                otherIndexes.push(i);
                            }
                        } else {
                            otherIndexes.push(i);
                        }
                    }
                    var randoms = chance.shuffle(otherIndexes);
                    sequencedNodes = merge(nodesToSequence, randoms, fixedIndexes);
                    if (isPickRand) {
                        sequencedNodes.length = node.Sequencer.PickCount;
                    }
                    node.QuestionLevelSequence = sequencedNodes;
                    break;

                case Enums.ObjectType.Variable:
                    sequenceVariables();
                    break;

                case Enums.ObjectType.AttributeHeader:
                    var nodesToSequence = node.AttributeSequence;
                    sequencedNodes = chance.shuffle(nodesToSequence);
                    if (isPickRand) {
                        sequencedNodes.length = node.Sequencer.PickCount;
                    }
                    node.AttributeSequence = sequencedNodes;
                    break;
            }

            // -------------------------------------------

            function sequenceSection() {
                var nodesToSequence = node.Children;
                var fixedIndexes = [],
                    otherIndexes = [];
                // If it contains Page Break then ignore page break.
                // If logic present then ignore sequencer
                for (var i = 0; i < nodesToSequence.length; i++) {
                    if (nodesToSequence[i].ObjectType === Enums.ObjectType.Script) {
                        return;
                    }
                    if (nodesToSequence[i].SurveyObjectType === Enums.SurveyObjectType.PageBreak) {
                        fixedIndexes.push(i);
                    } else {
                        otherIndexes.push(i);
                    }
                }
                var randomIndexes = chance.shuffle(otherIndexes);
                sequencedNodes = merge(nodesToSequence, randomIndexes, fixedIndexes);
                if (isPickRand) {
                    sequencedNodes.length = node.Sequencer.PickCount;
                }
                SurveyTreeService.adjustPositionsAfterSequencing(node.ID, sequencedNodes);
                node.Children = sequencedNodes;
                // Update Question Indexes
                SurveyTreeService.updateQIndexes(sequencedNodes);
            }

            // use to sequence options of a variable
            function sequenceVariables() {
                var nodesToSequence = node.VariableLevelSequence;
                var fixedIndexes = [],
                    otherIndexes = [];
                for (var i = 0; i < nodesToSequence.length; i++) {
                    if (!nodesToSequence[i].IsOption) {
                        var optionGroup = node.OptionGroups[nodesToSequence[i].ID];
                        optionGroup.OptionSequence = sequenceGroup(optionGroup);
                        otherIndexes.push(i);
                    } else if (node.Options[nodesToSequence[i].ID].IsFixed) {
                        fixedIndexes.push(i);
                    } else {
                        otherIndexes.push(i);
                    }
                }
                if (node.Sequencer.SequenceType == Enums.SequenceType.InRandomOrder || node.Sequencer.SequenceType == Enums.SequenceType.PickNInRandomOrder) {
                    var randoms = chance.shuffle(otherIndexes);
                    node.VariableLevelSequence = merge(nodesToSequence, randoms, fixedIndexes);
                    if (isPickRand) {
                        node.VariableLevelSequence.length = node.Sequencer.PickCount;
                    }
                    node.Sequencer.SequenceType = Enums.SequenceType.InOrder;
                }
            }

            function sequenceGroup(optionGroup) {
                var groupFixedIndexes = [],
                    otherGroupIndexes = [];
                if (optionGroup.Sequencer.SequenceType != Enums.SequenceType.InOrder) {
                    for (var j = 0; j < optionGroup.OptionSequence.length; j++) {
                        if (node.Options[optionGroup.OptionSequence[j]].IsFixed) {
                            groupFixedIndexes.push(j);
                        } else {
                            otherGroupIndexes.push(j);
                        }
                    }
                    var randomGroupIndexes = chance.shuffle(otherGroupIndexes);
                    optionGroup.OptionSequence = merge(optionGroup.OptionSequence, randomGroupIndexes, groupFixedIndexes);
                    if (optionGroup.Sequencer.SequenceType == Enums.SequenceType.PickNInRandomOrder) {
                        optionGroup.OptionSequence = optionGroup.Sequencer.PickCount;
                    }
                    optionGroup.Sequencer.SequenceType = Enums.SequenceType.InOrder;
                }
                return optionGroup.OptionSequence;
            }
        }

        function processPageBreak(sectionID, sectionChildren, index, bufferLength) {
            var isPageBreak = bufferLength > 0;
            var nodePointer = null;
            var nextIndex = index + 1;
            if (isPageBreak && nextIndex < sectionChildren.length) {
                var parentId = SurveyTreeService.getParentNodeID(sectionID);
                var nextNodeID = sectionChildren[nextIndex].ID || sectionChildren[nextIndex].SurveyObjectID;
                nodePointer = new NodePointer(parentId, sectionID, nextNodeID);
            }
            return nodePointer;
        }

        function processEndOfSurvey(endNode) {
            if (TestGenerator.isTestEnabled) {
                if (TestGenerator.AllowSync) {
                    RespondentService.CloseRespondent(Enums.SurveyStatus.Completed).then(function () {
                        updateTestEnvironment();
                    });
                } else {
                    updateTestEnvironment();
                }
            } else {
                var pageBuffer = new PageBuffer();
                pageBuffer.setSubmitButtonOnEnd(SurveySettings.IsSubmitButtonEnabled());
                var message = SurveySettings.GetSurveyEndText();
                var surveyStatus = Enums.SurveyStatus.Completed;
                var IsSubmitButtonEnabled = pageBuffer.isSubmitButtonEnabled();
                // Close respondent only when it is not preview and survey status is set.
                if (endNode) {
                    message = endNode.Message.Messages[SurveySettings.GetSurveyLanguage()] || message;
                    surveyStatus = endNode.SurveyStatus;
                } else {
                    endNode = new EndNode(surveyStatus);
                }
                if (vm.SurveyMode !== Enums.SurveyMode.Preview && vm.SurveyMode !== Enums.SurveyMode.View && endNode.SurveyStatus) {
                    if (IsSubmitButtonEnabled) {
                        pageBuffer.setEndNode(endNode);
                        pageBuffer.setSurveyEndMessage(message);
                        pageBuffer.setSurveyFooterMessage(message);
                        pageBuffer.renderView();
                    } else {
                        var callback = function (message) {
                            pageBuffer.setSurveyEndMessage(message);
                            pageBuffer.renderView();
                        }
                        $scope.OnSubmitResponse(encodeURIComponent(message), endNode, callback);
                    }
                } else {
                    // Only for preview and View
                    pageBuffer.setSurveyEndMessage(message);
                    pageBuffer.setSurveyFooterMessage(message);
                    pageBuffer.renderView();
                }
                //SurveyTreeService.setProgress(null);
            }
        }

        function updateTestEnvironment() {
            $scope.TestCount++;
            $scope.autoTest.progress++;
            $scope.autoTest.text = $scope.autoTest.progress + " test respondent(s) generated out of " + $scope.autoTest.max;
            if (!TestGenerator.AllowSync) {
                TestGenerator.TestResponses.push(RespondentService.GetAnswers());
            }
            RespondentService.InitRespondent(SurveySettings.QueryParameter, SurveySettings.GetSurveyLanguage(), SurveySettings.GetQuesVersion());
            SurveyTreeService.resetSurveyTree(true);

            if (TestGenerator.AllowSync) {
                RespondentService.CreateRespondent().then(function (data) {
                    RespondentService.GetRespondent(data).then(function () {
                        updateRespCount();
                    });
                });
            } else {
                RespondentService.SetRespondentID($scope.TestCount);
                updateRespCount();
            }

            function updateRespCount() {
                if ($scope.TestCount <= TestGenerator.MaxTestCount) {
                    startFlow();
                    console.log($scope.TestCount);
                } else {
                    $scope.ShowProgress = false;
                    $scope.autoTest.text = "All the test respondents generated successfully.";
                    if (!TestGenerator.AllowSync) {
                        // Show Result
                        var newWindow = window.open();
                        newWindow.document.write(TestGenerator.GenerateReport());
                        newWindow.document.close();
                    }
                }
            }
        }

        /*
         *  Process each type of questions
         */

        function processQuestion(question) {
            if (question.QuestionMaskingScriptID) {
                var script = SurveyTreeService.getScript(question.QuestionMaskingScriptID);
                question.MaskingVariableIDs = getVariablesFromScriptBody(script.Body);
                var isMasked = processLogic(script, question);
                if (isMasked)
                    return isMasked;
            }

            switch (question.QuestionType) {
                case Enums.QuestionType.SingleChoice:
                    return processCategoryQuestion(question);
                    break;
                case Enums.QuestionType.MultipleChoice:
                    return processCategoryQuestion(question);
                    break;
                case Enums.QuestionType.Text:
                    processTextQuestion(question);
                    break;

                case Enums.QuestionType.SimpleGrid:
                case Enums.QuestionType.NumericGrid:
                case Enums.QuestionType.TextGrid:
                case Enums.QuestionType.ComplexGrid:
                case Enums.QuestionType.Rank:
                case Enums.QuestionType.RankAndSort:
                case Enums.QuestionType.Distribution:
                case Enums.QuestionType.Distribution2:
                case Enums.QuestionType.ConstantSumGrid:
                case Enums.QuestionType.Slider:
                case Enums.QuestionType.MaxDiff:
                    return processGridQuestion(question);
                    break;
                default:
                    // statements_def
                    break;
            }
        }

        function processCategoryQuestion(question) {
            var isQuestionMasked = false;
            // Sequence options of each variable
            for (var i = 0; i < question.QuestionLevelSequence.length; i++) {
                var variable = question.Variables[question.QuestionLevelSequence[i].ID];
                var carryForwardOptions = getCarryForwardOptions(variable, Enums.CarryForwardReferenceType.Option);
                insertCfOptions(variable, carryForwardOptions);
                // If Sequence type is not in order then apply sequencer and change the
                // sequence type to prevent sequencing again while coming back to this question.
                processSequencer(variable, question.QuestionLevelSequence[i].ObjectType);
                isQuestionMasked = isQuestionMasked || maskOptions(variable, question);
            }

            if (question.Sequencer.SequenceType !== Enums.SequenceType.InOrder) {
                processSequencer(question, Enums.ObjectType.Question);
                question.Sequencer.SequenceType = Enums.SequenceType.InOrder;
            }

            return isQuestionMasked;
        }

        function getCarryForwardOptions(source, referenceType) {
            var linkIds = [];
            // Carry Forward attributes

            if (referenceType == Enums.CarryForwardReferenceType.Option) {
                if (source.hasOwnProperty("OptionCarryForwardScriptID") && source.OptionCarryForwardScriptID != null) {
                    var script = SurveyTreeService.getScript(source.OptionCarryForwardScriptID);
                    if (script != null) {
                        linkIds = processLogic(script);
                    }
                }
            } else if ((referenceType == Enums.CarryForwardReferenceType.Attribute) && source.hasOwnProperty("AttributeCarryForwardScriptID") && source.AttributeCarryForwardScriptID != null) {
                var script = SurveyTreeService.getScript(source.AttributeCarryForwardScriptID);
                if (script != null) {
                    linkIds = processLogic(script);
                }
            }
            return linkIds;
        }

        function insertCfAttributes(question, linkIds) {
            var attributes = question.Attributes;
            for (var i in attributes) {
                var attr = attributes[i];
                if (attr.LinkID != null && Array.isArray(attr.LinkID) && Array.isArray(linkIds)) {
                    for (var x = 0; x < attr.LinkID.length; x++) {
                        if (!linkIds.hasItem(attr.LinkID[x])) {
                            attr.ShowInSurvey = false;
                        } else {
                            attr.ShowInSurvey = true;
                        }
                        break;
                    }
                }
            }
        }

        function insertCfOptions(variable, linkIds) {
            for (var i in variable.Options) {
                if (variable.Options[i].LinkID != null && Array.isArray(variable.Options[i].LinkID) && Array.isArray(linkIds)) {
                    for (var x = 0; x < variable.Options[i].LinkID.length; x++) {
                        if (!linkIds.hasItem(variable.Options[i].LinkID[x])) {
                            variable.Options[i].ShowInSurvey = false;
                        } else {
                            variable.Options[i].ShowInSurvey = true;
                        }
                        break;
                    }
                }
            }
        }

        function processTextQuestion(question) {
            // if not mask then show
        }

        function processGridQuestion(question) {
            runSequencer();
            var carryForwardOptions = getCarryForwardOptions(question, Enums.CarryForwardReferenceType.Attribute);
            insertCfAttributes(question, carryForwardOptions);

            var maskedGroups = maskGroups().concat(maskAttributes());

            setVariableMaskingBit(maskedGroups);

            return isGridMasked(maskedGroups.length);


            // Mask Attributes and return array of masked Groups inside all the masked Attributes.
            function maskAttributes() {
                question.MaskingVariableIDs = question.MaskingVariableIDs || [];
                var maskedAttr = [];
                for (var i in question.Attributes) {
                    var script = SurveyTreeService.getScript(question.Attributes[i].AttributeMaskingScriptID);
                    var isHidden = !question.Attributes[i].ShowInSurvey;
                    if (!script && !isHidden) {
                        continue;
                    }

                    try {
                        var isMasked;
                        if (isHidden) {
                            isMasked = isHidden;
                        } else {
                            question.MaskingVariableIDs = question.MaskingVariableIDs.concat(getVariablesFromScriptBody(script.Body));
                            isMasked = processLogic(script, question);
                        }
                        if (isMasked) {
                            var quesLevelSequence = [];
                            for (var j = 0; j < question.QuestionLevelSequence.length; j++) {
                                var quesSeqItem = question.QuestionLevelSequence[j];
                                // Check if the masked attribute is in Attribute header.
                                if (quesSeqItem.ObjectType === Enums.ObjectType.AttributeHeader) {
                                    var attrIndex = question.AttributeHeaders[quesSeqItem.ID].AttributeSequence.indexOf(i);
                                    if (attrIndex > -1) {
                                        // remove the attribute from attribute header.
                                        maskedAttr = maskedAttr.concat(question.AttributeHeaders[quesSeqItem.ID].AttributeSequence.splice(attrIndex, 1));
                                    }
                                    if (question.AttributeHeaders[quesSeqItem.ID].AttributeSequence.length > 0) {
                                        quesLevelSequence.push(quesSeqItem);
                                    } else {
                                        // Remove if attribute header already present is QuestionLevelSequence.
                                        quesLevelSequence = quesLevelSequence.filter(function (d) {
                                            return d.ID !== quesSeqItem.ID;
                                        });
                                    }
                                } else if (quesSeqItem.ObjectType === Enums.ObjectType.Attribute) {
                                    if (quesSeqItem.ID !== i) {
                                        quesLevelSequence.push(quesSeqItem);
                                    } else {
                                        // Masked Attribute
                                        maskedAttr.push(quesSeqItem.ID);
                                    }
                                }
                            }
                            question.QuestionLevelSequence = quesLevelSequence;
                        }
                    } catch (e) {
                        console.log("Error while getting variable from script (ID : " + script.ID + "). Check for syntax errors.");
                    }
                }

                var maskedGroups = [];
                for (var i = 0; i < maskedAttr.length; i++) {
                    maskedGroups = maskedGroups.concat(question.Attributes[maskedAttr[i]].GroupSequence);
                }

                return maskedGroups;
            }

            // Mask Groups and return array of masked Groups.
            function maskGroups() {
                var maskedGroups = [];
                question.MaskingVariableIDs = question.MaskingVariableIDs || [];
                for (var i in question.Groups) {
                    var script = SurveyTreeService.getScript(question.Groups[i].GroupMaskingScriptID);
                    if (script) {

                        try {
                            question.MaskingVariableIDs = question.MaskingVariableIDs.concat(getVariablesFromScriptBody(script.Body));
                            var isMasked = processLogic(script, question);
                            if (isMasked) {
                                for (var j in question.Attributes) {
                                    var grpI = question.Attributes[j].GroupSequence.indexOf(i);
                                    if (grpI > -1) {
                                        maskedGroups = maskedGroups.concat(question.Attributes[j].GroupSequence.splice(grpI, 1));
                                    }
                                }
                                if (question.MasterAttribute && Array.isArray(question.MasterAttribute.GroupSequence)) {
                                    var grpI = question.MasterAttribute.GroupSequence.indexOf(i);
                                    if (grpI > -1) {
                                        maskedGroups = maskedGroups.concat(question.MasterAttribute.GroupSequence.splice(grpI, 1));
                                    }
                                }
                            }
                        } catch (e) { }
                    }
                    if (maskedGroups.indexOf(i) === -1) {
                        var varSeq = angular.copy(question.Groups[i].VariableSequence);
                        var removedVariables = [];
                        for (var j = 0; j < varSeq.length; j++) {
                            var variable = question.Variables[varSeq[j]];
                            // insert carry forwarded options in each variable of the grid
                            carryForwardOptions = getCarryForwardOptions(variable, Enums.CarryForwardReferenceType.Option);
                            insertCfOptions(variable, carryForwardOptions);
                            if (((variable.VariableType == Enums.VariableType.SingleChoice || variable.VariableType == Enums.VariableType.MultipleChoice) &&
                                maskOptions(variable, question)) || (variable.VariableMaskingScriptID && maskVariable(variable, question))) {
                                removedVariables.push(j);
                                continue;
                            }
                        }
                        question.Groups[i].VariableSequence = varSeq.filter(function (d, i) {
                            return removedVariables.indexOf(i) === -1;
                        });
                        if (removedVariables.length === varSeq.length) {
                            for (var j in question.Attributes) {
                                var grpI = question.Attributes[j].GroupSequence.indexOf(i);
                                if (grpI > -1) {
                                    maskedGroups = maskedGroups.concat(question.Attributes[j].GroupSequence.splice(grpI, 1));
                                }
                            }

                            if (question.MasterAttribute && Array.isArray(question.MasterAttribute.GroupSequence)) {
                                var grpI = question.MasterAttribute.GroupSequence.indexOf(i);
                                if (grpI > -1) {
                                    maskedGroups = maskedGroups.concat(question.MasterAttribute.GroupSequence.splice(grpI, 1));
                                }
                            }
                        }
                    }
                }

                return maskedGroups;
            }

            function maskVariable(variable, question) {
                var script = SurveyTreeService.getScript(variable.VariableMaskingScriptID);
                if (script) {
                    if (!Array.isArray(question.MaskingVariableIDs)) {
                        question.MaskingVariableIDs = [];
                    }
                    question.MaskingVariableIDs = question.MaskingVariableIDs.concat(getVariablesFromScriptBody(script.Body));
                    return processLogic(script);
                }
                return false;
            }

            // Set isMasked flag for all the masked variables inside groups.
            function setVariableMaskingBit(groups) {
                for (var i in question.Groups) {
                    for (var j = 0; j < question.Groups[i].VariableSequence.length; j++) {
                        var varName = question.Variables[question.Groups[i].VariableSequence[j]].Name;
                        if (groups.indexOf(i) > -1) {
                            RespondentService.SetMaskingBit(varName, true);
                        } else {
                            RespondentService.SetMaskingBit(varName, false);
                        }
                    }
                }
            }

            function runSequencer() {
                if (question.Sequencer.SequenceType !== Enums.SequenceType.InOrder) {
                    processSequencer(question, Enums.ObjectType.Question);
                    question.Sequencer.SequenceType = Enums.SequenceType.InOrder;
                }
                for (var grp in question.Groups) {
                    var group = question.Groups[grp];
                    if (typeof group.Sequencer == "object" && group.Sequencer.SequenceType != Enums.SequenceType.InOrder) {
                        for (var x = 0; x < group.VariableSequence.length; x++) {
                            var variable = question.Variables[group.VariableSequence[x]];
                            variable.Sequencer.SequenceType = group.Sequencer.SequenceType;
                            variable.Sequencer.PickCount = group.Sequencer.PickCount;
                            processSequencer(variable, Enums.ObjectType.Variable);
                        }
                        group.Sequencer.SequenceType = Enums.SequenceType.InOrder;
                    }
                }
                for (var i in question.AttributeHeaders) {
                    var attributeHeader = question.AttributeHeaders[i];
                    if (attributeHeader.Sequencer.SequenceType !== Enums.SequenceType.InOrder) {
                        processSequencer(attributeHeader, Enums.ObjectType.AttributeHeader);
                    }
                }
            }

            // Check if there is any Attribute or Attribute Header present in the Grid
            // if no then return true (masked).
            function isGridMasked(mGroups) {
                if (question.MasterAttribute) {
                    return mGroups == Object.keys(question.Groups).length - question.MasterAttribute.GroupSequence.length;
                }

                // For backward compatibility when master attribute was not present in the question object.
                return mGroups == Object.keys(question.Groups).length;
            }


        }

        function getVariablesFromScriptBody(body) {
            var vars = [];
            try {
                var subSplits = body.substring(body.indexOf('r(')).split('"');
                if (subSplits.length == 1) {
                    subSplits = body.substring(body.indexOf('r(')).split("'");
                }
                if (subSplits.length > 1) {
                    for (var x = 1; x < subSplits.length; x = x + 2) {
                        vars.push(subSplits[x].replace(new RegExp("\"", 'g'), '').split('.')[0]);
                    }
                }
            } catch (e) {

            }
            return vars;
        }

        function getVariablesFromQuotaNode(qBreak) {
            var vars = [];
            try {
                if (Array.isArray(qBreak)) {
                    for (var i = 0; i < qBreak.length; i++) {
                        vars.push(qBreak[i].SelectedVariable);
                        if (Array.isArray(qBreak[i].Children) && qBreak[i].Children.length > 0) {
                            vars = vars.concat(getVariablesFromQuotaNode(qBreak[i].Children));
                        }
                    }
                }
            } catch (e) { }
            return vars;
        }

        function maskOptions(variable, question) {
            var script = SurveyTreeService.getScript(variable.OptionMaskingScriptID);
            var maskedOptions = [];
            if (script) {
                question.MaskingVariableIDs = getVariablesFromScriptBody(script.Body);
                maskedOptions = processLogic(script) || [];
                if (script.Type == Enums.ScriptType.OptionShow) {
                    if (showOptionsOnly(variable, maskedOptions)) {
                        for (var vid in question.Variables) {
                            question.Variables[vid].IsMasking = true;
                            question.Variables[vid].ShowInSurvey = false;
                            RespondentService.SetMaskingBit(question.Variables[vid].Name, true);
                        }
                        return true;
                    }

                    return false;
                }
            }
            var options = variable.VariableLevelSequence || [];
            var optionsToShow = [];
            for (var i = 0; i < options.length; i++) {
                if (options[i].IsOption) {
                    if (maskedOptions.hasItem(options[i].ID)) {
                        continue;
                    }
                    if (variable.Options[options[i].ID].ShowInSurvey)
                        optionsToShow.push(options[i]);
                } else {
                    var grpOpts = variable.OptionGroups[options[i].ID].OptionSequence;
                    var grpOptsToShow = [];
                    for (var j = 0; j < grpOpts.length; j++) {
                        if (maskedOptions.hasItem(grpOpts[j])) {
                            continue;
                        }
                        if (variable.Options[grpOpts[j]].ShowInSurvey) {
                            grpOptsToShow.push(grpOpts[j]);
                        }
                    }
                    if (grpOptsToShow.length > 0) {
                        variable.OptionGroups[options[i].ID].OptionSequence = grpOptsToShow;
                        optionsToShow.push(options[i]);
                    }
                }
            }

            if (optionsToShow.length === 0) {
                for (var vid in question.Variables) {
                    question.Variables[vid].IsMasking = true;
                    question.Variables[vid].ShowInSurvey = false;
                    RespondentService.SetMaskingBit(question.Variables[vid].Name, true);
                }
                return true;
            }

            variable.VariableLevelSequence = optionsToShow;

            return false;
        }

        function showOptionsOnly(variable, showOptions) {
            var options = variable.VariableLevelSequence || [];
            var optionsToShow = [];
            for (var i = 0; i < options.length; i++) {
                if (options[i].IsOption) {
                    if (variable.Options[options[i].ID].ShowInSurvey) {
                        var index = showOptions.getIndexOf(options[i].ID);
                        if (index > -1) {
                            optionsToShow[index] = options[i];
                        }
                    }
                } else {
                    var grpOpts = variable.OptionGroups[options[i].ID].OptionSequence;
                    var grpOptsToShow = [];
                    for (var j = 0; j < grpOpts.length; j++) {
                        var index = showOptions.getIndexOf(grpOpts[j]);
                        if (index > -1 && variable.Options[grpOpts[j]].ShowInSurvey) {
                            grpOptsToShow[index] = grpOpts[j];
                        }
                    }
                    grpOptsToShow = grpOptsToShow.filter(function (d) {
                        return d != undefined;
                    });
                    if (grpOptsToShow.length > 0) {
                        variable.OptionGroups[options[i].ID].OptionSequence = grpOptsToShow;
                        optionsToShow.push(options[i]);
                    }
                }
            }

            optionsToShow = optionsToShow.filter(function (d) {
                return d != undefined;
            });

            if (optionsToShow.length === 0) {
                return true;
            }

            variable.VariableLevelSequence = optionsToShow;

            return false;
        }

        function processQuota(quotaNode) {
            var quotaVariables = [];
            quotaVariables = quotaVariables.concat(getVariablesFromQuotaNode(quotaNode.QuotaDefinition.SideBreak));
            quotaVariables = quotaVariables.concat(getVariablesFromQuotaNode(quotaNode.QuotaDefinition.TopBreak));
            var quotaVariableAnswers = {};
            for (var i = 0; i < quotaVariables.length; i++) {
                quotaVariableAnswers[quotaVariables[i]] = RespondentService.GetVariableAnswers(quotaVariables[i]);
            }
            // Check quota only if survey is partial
            if (RespondentService.GetSurveyStatus() == Enums.SurveyStatus.Partial &&
                RespondentService.GetSurveyMode() != Enums.SurveyMode.Preview && RespondentService.GetSurveyMode() != Enums.SurveyMode.View && !RespondentService.IsOffline()) {

                CommunicationService.CheckQuota(quotaNode.ID.split('|')[0], quotaVariableAnswers).then(function (isQuotaFull) {
                    window.qresults[quotaNode.ID.split('|')[0]] = isQuotaFull;
                    if (isQuotaFull) {
                        switch (quotaNode.Properties.Action) {
                            case Enums.QuotaMetAction.EndSurveyAndPanelRedirect:
                            case Enums.QuotaMetAction.EndSurvey:
                                {
                                    // Terminate Survey
                                    SurveyTreeService.getSurveyEndNode(quotaNode.Properties.JumpTo.ID).then(function (surveyEnd) {
                                        var endNode = new EndNode(Enums.SurveyStatus.Terminated);
                                        endNode.Message.Messages[SurveySettings.GetSurveyLanguage()] = SurveySettings.GetSurveyEndText();
                                        if (quotaNode.Properties.JumpTo.ID) {
                                            endNode.Message = surveyEnd.Message;
                                        } else if (quotaNode.Properties.IsOtherMessage) {
                                            endNode.Message = quotaNode.Properties.Message;
                                        }
                                        if (quotaNode.Properties.Action == Enums.QuotaMetAction.EndSurveyAndPanelRedirect) {
                                            endNode.RedirectToURL = true;
                                            endNode.AppendPanelParameters = quotaNode.Properties.AppendAllPanelParameters;
                                            endNode.RedirectURL = quotaNode.Properties.RedirectURL;
                                        }
                                        processEndOfSurvey(endNode);
                                    });
                                    break;
                                }
                            case Enums.QuotaMetAction.JumpTo:
                                var jumpNode = getJumpNodePointer(quotaNode.Properties.JumpTo);
                                if (jumpNode != null) {
                                    SurveyTreeService.setNextSurveyTreePointer(jumpNode)
                                }
                                $scope.GoNext();
                                break;
                        }
                    } else {
                        $scope.GoNext();
                    }
                });
            } else {
                setTimeout(function () {
                    $scope.GoNext();
                });
            }
        }

        /*
         *  Used to render view
         */
        function PageBuffer() {
            var isAuthenticationEnabled = false,
                isLanguageEnabled = false,
                buffer = [],
                childScope, endMessage, footerMessage, validationCounter = 0,
                warnQuestions = [],
                isRecordingEnabled = false,
                isTimeCapturingEnabled = false,
                recorderProperties = {},
                enableButton = false,
                endNode, timerInfo = {},
                isTimeoutEnabled = false,
                timeoutInfo = {};
            $scope.showToastMessage = false;
            RespondentService.StopWatch.start();

            return {
                size: function () {
                    return buffer.length;
                },
                add: function (question) {
                    // check if recording is enabled for this question
                    if (question.Properties.AllowRecording == "true") {
                        isRecordingEnabled = true;
                        recorderProperties.file = question.ID.replace('|', '-') + "_recording.aac";
                        recorderProperties.time = (parseInt(question.Properties.Duration) || 1) * 1000;
                        var varName = question.Variables[question.Properties.RecordingVariable].Name;
                        if (vm.SurveyMode != Enums.SurveyMode.Review) {
                            var value;
                            if (CommunicationService.PLATFORM == CommunicationService.ANDROID) {
                                value = recorderProperties.file;
                            } else {
                                value = "Not Available";
                            }
                            var ans = RespondentService.GetAnswerObject([value], Enums.VariableType.Text, varName, question.ID.split('|')[0]);
                            RespondentService.SaveAnswer(ans);
                        } else {
                            recorderProperties.toPlay = r(varName).GetValue();
                        }
                    }
                    if (question.Properties.EnableTimer == "true") {
                        isTimeCapturingEnabled = true;
                        timerInfo.Variable = question.Variables[question.Properties.TimerVariable].Name;
                        timerInfo.QGUID = question.ID;
                    }
                    if (question.hasOwnProperty("Timer") && question.Timer.IsTimerEnabled) {
                        isTimeoutEnabled = true;
                        timeoutInfo.Message = question.Timer.Message;
                        if (question.Timer.TimerAction == Enums.TimeoutAction.AutoMove) {
                            timeoutInfo.Callback = function () {
                                $scope.GoNext();
                            };
                        } else if (question.Timer.TimerAction == Enums.TimeoutAction.ShowText) {
                            timeoutInfo.Callback = function () {
                                var mssge = "*Try to Respond quick.";
                                if (typeof timeoutInfo.Message == "object" && typeof timeoutInfo.Message.Messages == "object") {
                                    mssge = timeoutInfo.Message.Messages[SurveySettings.GetSurveyLanguage()] ||
                                        timeoutInfo.Message.Messages[SurveySettings.GetDefaultLanguage()];
                                }
                                $scope.showToastMessage = true;
                                $scope.toastMessage = mssge;
                            };
                        }
                        timeoutInfo.Duration = parseFloat(question.Timer.Duration) || 0;
                    }
                    buffer.push(question);
                },
                containsAny: function (variables) {
                    if (!variables)
                        return false;
                    for (var i = 0; i < buffer.length; i++) {
                        for (var variableId in buffer[i].Variables) {
                            var variableName = buffer[i].Variables[variableId].Name.split('.')[0];
                            if (variables.indexOf(variableName) > -1) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
                initializeMaskingBit: function (q) {
                    for (var vid in q.Variables) {
                        RespondentService.SetMaskingBit(q.Variables[vid].Name, false);
                    }
                },
                containsQuestionByID: function (id) {
                    if (!id)
                        return false;
                    for (var i = 0; i < buffer.length; i++) {
                        if (buffer[i].ID == id) {
                            return true;
                        }
                    }
                },
                hasQuestions: function () {
                    if (buffer.length > 0)
                        return true;
                    return false;
                },
                validateQuestion: function (move) {
                    validationCounter = validationCounter + move;
                },
                isValid: function () {
                    return validationCounter == buffer.length;
                },
                resetValidation: function () {
                    $scope.ValidationMessage = {};
                    validationCounter = 0
                },
                addWarning: function (q, message) {
                    if (!warnQuestions.hasItem(q)) {
                        warnQuestions.push(q);
                    }
                    $scope.showToastMessage = true;
                    if (message) {
                        $scope.toastMessage = "Question : " + warnQuestions.join(', ') + " - " + message;
                    } else {
                        $scope.toastMessage = "Question : " + warnQuestions.join(', ') + " left unanswered. Click next to continue";
                    }
                    PageRouteService.ResetMovement();
                },
                resetWarning: function () {
                    warnQuestions = [];
                    $scope.showToastMessage = false;
                },
                setAuth: function (isEnable) {
                    isAuthenticationEnabled = isEnable;
                },
                setSurveyEndMessage: function (message) {
                    endMessage = message;
                },
                setSurveyFooterMessage: function (message) {
                    footerMessage = message;
                },
                setEndNode: function (node) {
                    endNode = node;
                },
                isAuthEnabled: function () {
                    return isAuthenticationEnabled;
                },
                setLanguageSelector: function (isLanguage) {
                    isLanguageEnabled = isLanguage;
                },
                isLanguageSelectEnabled: function () {
                    return isLanguageEnabled;
                },
                getBuffer: function () {
                    return buffer;
                },
                setSubmitButtonOnEnd: function (isEnable) {
                    enableButton = isEnable;
                },
                isSubmitButtonEnabled: function () {
                    return enableButton;
                },
                updateSurveyFooter: function () {
                    var footer = angular.element(document.getElementById('survey-bottomHdr'));
                    footer.empty();
                    footer.html(UIService.GetFooter(true, $scope.showProgressBar, SurveySettings.GetSurveyFooterText()));
                    $compile(footer.contents())($scope);
                },
                updateSurveyHeader: function () {
                    var header = angular.element(document.getElementById('hdr-Layout'));
                    header.empty();
                    header.html(UIService.GetHeader('', SurveySettings.GetLanguageSetting()));
                    $compile(header.contents())($scope);
                },
                setStartupPage: function () {
                    //SurveySettings.GetSurveyTitle();
                    var html = UIService.GetHeader('', SurveySettings.GetLanguageSetting());
                    html += "<div id='surveyParent' style='overflow:auto;width:100%;'>";
                    html += "<div id='scrollable' style='margin:0 auto;max-width:800px;padding:10px;padding-top:0px;'></div>";
                    html += "</div>";
                    html += UIService.GetFooter(true, $scope.showProgressBar, SurveySettings.GetSurveyFooterText());

                    var container = angular.element(document.getElementById('page'));
                    container.empty();
                    container.append(html);
                    $compile(container.contents())($scope);

                    var footerHeight = document.getElementById("survey-bottomHdr").offsetHeight;
                    if (SurveySettings.QueryParameter.ProjectGUID == "eccaad3e-59b1-6af8-1407-4a3baf54c153" || "667c7173-1f74-3df1-a120-300ed209a6f9") { var headerHeight = 90 }
                    else { var headerHeight = document.getElementById("hdr-Layout").offsetHeight; }
                    var pageHeight = document.getElementById("page").offsetHeight;
                    document.getElementById("surveyParent").style.height = pageHeight - headerHeight - footerHeight - 10 + 'px';


                    document.getElementById("scrollable").style.marginTop = 0 + "px";
                    document.getElementById("scrollable").style.marginBottom = 0 + "px";
                    document.getElementById("scrollable").style.top = 55 + "px";
                    document.getElementById("scrollable").style.paddingBottom = 10 + "px";
                    document.getElementById("scrollable").style.height = "100%";
                },
                updateSurveyTitle: function () {
                    var title = angular.element(document.getElementById('header_top').getElementsByClassName('survey-title-text-color')[0]);
                    title.html(SurveySettings.GetSurveyTitle());
                },
                renderView: function () {
                    RespondentService.SetOnReviewAtEndPage(false);
                    var screenHeight = window.innerHeight;
                    if (SurveySettings.ScreenSize != '') {
                        screenHeight = parseInt(SurveySettings.ScreenSize);
                    }

                    ValidatorService.ResetWarning();

                    var html = "";
                    if (buffer.length != 0) {
                        if ($scope.ShowSectionName)
                            html += UIService.GetSectionName(SurveyTreeService.getCurrentSectionName());

                        // Toast
                        html += UIService.GetToast();
                        if (isRecordingEnabled && vm.SurveyMode == Enums.SurveyMode.Review &&
                            recorderProperties.toPlay && recorderProperties.toPlay != "Not Available") {
                            html += UIService.ShowAudioListener();
                            CommunicationService.GetMedia(recorderProperties.toPlay, RespondentService.GetRespondentID()).then(function (path) {
                                if (path) {
                                    var toast = document.getElementById('recording-toast');
                                    var audio = document.createElement('audio');
                                    audio.style.width = "80%";
                                    audio.src = $sce.trustAsResourceUrl(path);
                                    audio.load();
                                    audio.controls = true;
                                    toast.appendChild(audio);
                                }
                            });
                        }

                        for (var i = 0; i < buffer.length; i++) {
                            html += UIService.GetQuestion(i, buffer[i].ValidationScriptID);
                        }
                        var progress = document.getElementsByClassName("s-progress")[0];
                        if (progress) {
                            progress.style.display = "block";
                        }
                        var endProgress = document.getElementsByClassName("end-progress")[0];
                        if (endProgress) {
                            endProgress.style.display = "none";
                        }
                        //show language selector
                        var languageSelector = document.getElementById("languageSelector");
                        if (languageSelector) {
                            languageSelector.style.display = "block";
                        }
                        this.changeProgress();
                    } else {
                        html += "<div id='surveyEnd'>" +
                            "<div class='thankMsg'>";
                        if (SurveySettings.IsThumbsUpAllowed()) {
                            html += "<div class='text-center'><img src='assets/images/thank-you-gif.gif'/></div>";
                        }
                        html += UIService.GetSurveyEnd(endMessage, enableButton, endNode);
                        html += '</div>';
                        if (SurveySettings.IsSurveyByRebusCloudAllowed()) {
                            html += "<div id='rebusText'><img src='assets/images/logo.png'/><br> Survey By RebusCloud - Where Your Questions Get Answered</div>";

                        }
                        if (SurveySettings.Settings.NavigationButtons) {
                            if (SurveySettings.IsShowProgressBarTextAllowed()) {
                                html += UIService.EndNodeFooter(this.getProgressText(), 100, $scope.showProgressBar, SurveySettings.GetSurveyFooterText());
                            } else {
                                html += UIService.EndNodeFooter("", 100, $scope.showProgressBar, SurveySettings.GetSurveyFooterText());

                            }

                        }

                        /*Remove current navigation buttons*/
                        var ele = document.getElementsByClassName('footer-design')[0];
                        if (ele)
                            ele.style.display = "none";
                        // hide progress
                        var progress = document.getElementsByClassName("s-progress")[0];
                        if (progress) {
                            progress.style.display = "none";
                        }
                        //hide language selector
                        var languageSelector = document.getElementById("languageSelector");
                        if (languageSelector) {
                            languageSelector.style.display = "none";
                        }
                    }
                    // Apply Themes
                    //  UIService.StyleSurvey();

                    var container = angular.element(document.getElementById('scrollable'));
                    container.empty();
                    container.append(html);
                    if (container[0]) {
                        if (container[0].classList.contains('section-header')) {
                            container[0].classList.remove('section-header');
                        }
                    }
                    var foot = document.getElementsByClassName('footer-design')[0];
                    if (foot) {
                        foot.style.display = "block";
                    }
                    childScope = $scope.$new();
                    var compiled = $compile(container.contents())(childScope);


                    if (buffer.length === 0) {
                        var footerHeight = document.getElementById("survey-bottomHdr").offsetHeight;
                        var rebusText = document.getElementById("rebusText");
                        if (rebusText)
                            rebusText.style.bottom = footerHeight + 15 + "px";
                        //this.changeEndNodeProgress(); 
                    }
                    //UIService.AdjustHeight($scope.progressBarProperties, screenHeight);


                    $scope.ShowProgress = false;
                    // var logo = document.getElementById("logo-middle");
                    // if (logo) {
                    //     logo.style.left = 400 - (document.getElementById("logo-middle").clientWidth / 2) + "px";
                    // }
                    // var Bottomlogo = document.getElementById("bottom-middle");
                    // if (Bottomlogo) {
                    //     Bottomlogo.style.left = 400 - (document.getElementById("bottom-middle").clientWidth / 2) + "px";
                    // }

                    if (vm.RuntimeError.isEnabled) {
                        this.showRuntimeError(vm.RuntimeError.script, vm.RuntimeError.message);
                    }

                    if (isRecordingEnabled && vm.SurveyMode != Enums.SurveyMode.Review) {
                        CommunicationService.StartRecording(recorderProperties.file, recorderProperties.time);
                    }
                    if (isTimeCapturingEnabled) {
                        RespondentService.StopWatchStart();
                    }
                    if (isTimeoutEnabled) {
                        this.startTimeout();
                    }
                    if (compiled[1])
                        this.showBlurredEffect(compiled[1].outerHTML);

                    this.postRendering();
                },
                destroyView: function () {
                    PageRouteService.Flush();
                    //$scope.ShowProgress = true;
                    var container = angular.element(document.getElementById('scrollable'));
                    document.getElementById('scrollable').style.top = '55px';
                    container.empty();
                    if (childScope) {
                        childScope.$destroy();
                    }
                    container.append("");
                    childScope = $scope.$new();
                    $compile(container.contents())(childScope);
                    CommunicationService.StopRecording();
                    if (isTimeCapturingEnabled) {
                        var timeInSeconds = RespondentService.GetElapsedTime();
                        r(timerInfo.Variable).SetValue(timerInfo.QGUID, Enums.VariableType.Numeric, timeInSeconds);
                    }
                    if (isTimeoutEnabled) {
                        $timeout.cancel(timeoutInfo.stopTimeout);
                    }
                    RespondentService.DestroyListeners();
                },
                authView: function () {
                    if (vm.SurveyMode == Enums.SurveyMode.View) {
                        $scope.GoNext();
                        return;
                    }
                    var html = UIService.GetAuthView();
                    var container = angular.element(document.getElementById('page'));
                    container.empty();
                    container.append(html);

                    childScope = $scope.$new();
                    $compile(container.contents())(childScope);
                    $scope.ShowProgress = false;
                },
                languageSelectorView: function () {
                    if (vm.SurveyMode == Enums.SurveyMode.View) {
                        $scope.GoNext();
                        return;
                    }


                    var html = ""; // UIService.GetHeader(SurveySettings.GetSurveyTitle());
                    //   html += "<div id='scrollable' style='max-width:800px;margin:0 auto;padding:0 1%;overflow:auto'>";
                    html += "<div class='padding-5 card center-div'><div class='padding-5 font-size-XXlg choose-lang'>Choose the language</div>" +
                        UIService.GetLanguageSelectorView(SurveySettings.GetAllVisibleLanguages()) +
                        '</div>';
                    // End Scrollable div
                    //     html += "</div>";
                    html += UIService.GetNextNavButton();
                    /*Remove current navigation buttons*/
                    var ele = document.getElementsByClassName('footer-design')[0];
                    ele.style.display = "none";
                    var container = angular.element(document.getElementById('scrollable'));
                    container.empty();
                    container.append(html);
                    childScope = $scope.$new();
                    $compile(container.contents())(childScope);
                    $scope.ShowProgress = false;
                    // Apply Themes
                    //  UIService.StyleSurvey();
                },
                runTest: function () {
                    TestGenerator.InitTest(buffer);
                    $scope.GoNext();
                },
                validate: function () {
                    var isValid = true;
                    for (var i = 0; i < buffer.length; i++) {
                        if (buffer[i].ValidationScriptID) {
                            var script = SurveyTreeService.getScript(buffer[i].ValidationScriptID);
                            var isInvalid = processLogic(script, buffer[i]);
                            if (isInvalid) {
                                var message = getValidationMessage(script);
                                if (script.ValidationUI.Mandatory == Enums.Mandatory.WarnAndContinue) {
                                    // if (warnQuestions.hasItem(buffer[i].Name) && $scope.toastMessage == ("Question : " + warnQuestions.join(', ') + " - " + message)) {
                                    //     isInvalid = false;
                                    // } else {
                                    //     ValidatorService.ShowError(true, message);
                                    //     this.addWarning(buffer[i].Name, message);
                                    // }
                                    if (ValidatorService.WarningShown) {
                                        isInvalid = false;
                                    } else {
                                        ValidatorService.ShowError(true, message, buffer[i].ID);
                                    }
                                } else {
                                    // $scope.ValidationMessage[buffer[i].ValidationScriptID] = "*" + message;
                                    ValidatorService.ShowError(false, message, buffer[i].ID);
                                }
                            } else {
                                $scope.ValidationMessage[buffer[i].ValidationScriptID] = "";
                            }
                            isValid = isValid && !isInvalid;
                        }
                    }
                    return isValid;

                    function getValidationMessage(script) {
                        var mssge = "*Validation failed";
                        if (script.ValidationUI && script.ValidationUI.ValidationMessage && script.ValidationUI.ValidationMessage.Messages) {
                            mssge = script.ValidationUI.ValidationMessage.Messages[SurveySettings.GetSurveyLanguage()] ||
                                script.ValidationUI.ValidationMessage.Messages[SurveySettings.GetDefaultLanguage()];
                        }
                        return mssge;
                    }
                },
                setRedirection: function (url, noTimer) {
                    if (url) {
                        if (noTimer) {
                            window.location = url;
                        } else {
                            setTimeout(function () {
                                window.location = url;
                            }, 5000);
                        }
                    }
                },
                reviewResponses: function () {
                    $scope.ReviewScrollService.items.length = 0;
                    $scope.qids = $scope.ReviewScrollService.qids;
                    $scope.qids.length = 0;
                    Array.prototype.push.apply($scope.qids, TraversalListService.getQids());
                    $scope.ReviewBuffer = $scope.ReviewScrollService.items;
                    $scope.ReviewScrollService.nextQuestion();
                    $scope.IsReviewedAtEnd = true;
                    RespondentService.SetOnReviewAtEndPage(true);
                    $scope.Navigation.isBackDisabled = false;
                    $scope.Navigation.isNextDisabled = false;
                    $scope.ShowProgress = true;

                    var html = "<div>" +
                        "       <div ng-class='{\"disabled\": q.QuestionType != 11 && q.QuestionType != 12 && q.QuestionType != 13 && q.QuestionType != 14 && q.QuestionType != 15 && q.QuestionType != 16 && q.QuestionType != 20 && q.QuestionType != 21}'ng-repeat='q in ReviewBuffer track by $index'>" +
                        "           <survey-question  q-object='::q' review='::true' language='" + SurveySettings.GetSurveyLanguage() + "'></survey-question>" +
                        "       </div>" +
                        "   </div>" +
                        "<div style='margin-top: 25px; height: 50px;'><div ng-click='loadPrev()' class='prev-next clickable  float-left'>Prev</div><div ng-click='loadNext()' class='prev-next clickable  float-right'>Next</div></div>";
                    // if (vm.SurveyMode == Enums.SurveyMode.View) {
                    //     html += UIService.GetFooter(false, $scope.showProgressBar, SurveySettings.GetSurveyFooterText());
                    // } else {
                    //     html += UIService.GetFooter(true, $scope.showProgressBar, SurveySettings.GetSurveyFooterText());
                    // }
                    // Apply Themes
                    //  UIService.StyleSurvey();
                    var container = angular.element(document.getElementById('scrollable'));
                    container.empty();
                    container.append(html);
                    if (container[0]) {
                        if (container[0].classList.contains('section-header')) {
                            container[0].classList.remove('section-header');
                        }
                    }
                    var foot = document.getElementsByClassName('footer-design')[0];
                    if (foot) {
                        foot.style.display = "block";
                    }
                    childScope = $scope.$new();
                    var compiled = $compile(container.contents())(childScope);


                    //UIService.AdjustHeight($scope.progressBarProperties, screenHeight);
                    var footerHeight = document.getElementById("survey-bottomHdr").offsetHeight;
                    var headerHeight = document.getElementById("hdr-Layout").offsetHeight;
                    var pageHeight = document.getElementById("page").offsetHeight;
                    document.getElementById("surveyParent").style.height = pageHeight - headerHeight - footerHeight - 10 + 'px';

                    $scope.ShowProgress = false;
                },
                showLanguageSelector: function () {
                    var container = angular.element(document.getElementById('page'));
                    var compiled = $compile(UIService.GetLanguageSelectorView(SurveySettings.GetAllVisibleLanguages()))($scope);
                    var toast = ['<div id="modal" class="modal active" >',
                        '<div class="modal-overlay"></div>',
                        '<div class="modal-container">',
                        '<div class="modal-header">',
                        '<button onclick="closeModal()" class="btn btn-clear float-right"></button>',
                        '<div class="modal-title ">Choose language</div>',
                        '</div>',
                        '<div class="modal-body">',
                        '<div class="content">',
                        '</div>',
                        '<div class="modal-footer">',
                        '<button onclick="closeModal()" class="btn btn-link btn-sm" style="font-size: 14px;">Cancel</button>',
                        '<button onclick="showCode()" class="btn btn-primary btn-sm" style="font-size: 14px;">Continue</button>',
                        '</div>',
                        '</div>',
                        '</div>'
                    ].join('');
                    container.append(toast);

                    setTimeout(function () {
                        var modal = document.getElementById("modal").getElementsByClassName('content')[0];
                        angular.forEach(compiled, function (d) {
                            modal.appendChild(d);
                        })
                    });
                    window.closeModal = function (args) {
                        var page = document.getElementById('page');
                        var modal = document.getElementById("modal");
                        page.removeChild(modal);
                        // update only in preview mode
                        if (vm.SurveyMode === Enums.SurveyMode.Preview && window.frameElement && args != "DoNotRefresh") {
                            postMessageCase("closeLang", window.frameElement.id);
                        }
                        vm.RuntimeError.isEnabled = false;
                        vm.RuntimeError.script = {};
                        vm.RuntimeError.message = "";
                    }

                    window.showCode = function (args) {
                        overwriteLanguageKey();
                        RespondentService.SetAnimation('zoomIn');
                        onChangeLanguage(); //callback on language change
                        $scope.$broadcast('refreshSurvey');
                        window.closeModal('');
                        // update only in preview mode
                        if (vm.SurveyMode === Enums.SurveyMode.Preview && window.frameElement && args != "DoNotRefresh") {
                            postMessageCase("showCode", window.frameElement.id);
                        }
                    }
                },
                showRuntimeError: function (script, message) {
                    var container = angular.element(document.getElementById('page'));
                    var toast = ['<div id="modal" class="modal active" >',
                        '<div class="modal-overlay"></div>',
                        '<div class="modal-container">',
                        '<div class="modal-header">',
                        '<button onclick="closeModal()" class="btn btn-clear float-right"></button>',
                        '<div class="modal-title ">Error in Script</div>',
                        '</div>',
                        '<div class="modal-body">',
                        '<div class="content">',
                        '<div>',
                        '<strong><b> Script ID :  </b></strong>',
                        '<mark>' + script.ID + '</mark>',
                        '</div>',
                        '<div style="margin-top: 5px;">',
                        '<strong><b> Script Name :  </b></strong>',
                        '<mark>' + script.Name + '</mark>',
                        '</div>',
                        '<pre class="code" data-lang="JAVASCRIPT" style="margin-top: 20px;"><code><span class="com" id="js-code">' + message + '</span></code></pre>',
                        '</div>',
                        '</div>',
                        '<div class="modal-footer">',
                        '<button onclick="closeModal()" class="btn btn-link btn-sm" style="font-size: 14px;">Ignore</button>',
                        '<button onclick="showCode()" class="btn btn-primary btn-sm" style="font-size: 14px;">Show Script</button>',
                        '</div>',
                        '</div>',
                        '</div>'
                    ].join('');
                    container.append(toast);
                    window.closeModal = function () {
                        var page = document.getElementById('page');
                        var modal = document.getElementById("modal");
                        page.removeChild(modal);
                        vm.RuntimeError.isEnabled = false;
                        vm.RuntimeError.script = {};
                        vm.RuntimeError.message = "";
                    }

                    window.showCode = function () {
                        var page = document.getElementById('js-code');
                        page.innerHTML = vm.RuntimeError.script.Body;
                    }
                },
                enableRuntimeAlert: function (script, message) {
                    vm.RuntimeError.isEnabled = true;
                    vm.RuntimeError.script = script;
                    vm.RuntimeError.message = message;
                },
                showAutoCodeConflict: function (validationType, callBack) {
                    var container = angular.element(document.getElementById('page'));
                    var modal = document.getElementById('page').getElementsByClassName('modal');
                    if (Array.isArray(modal) && modal.length > 0) {
                        return;
                    }
                    var xh = "";
                    if (typeof callBack == "function") {
                        xh = callBack(validationType);
                    }
                    var toast = ['<div id="modal" class="modal active" >',
                        '<div class="modal-overlay"></div>',
                        '<div class="modal-container" style="color: black;">',
                        '<div class="modal-header">',
                        '<div class="modal-title font-size-XXlg">Which of the following did you mean?</div>',
                        '</div>',
                        '<div class="modal-body">',
                        '<div class="content">',
                        '<div style="margin-top: 5px;">',
                        xh,
                        '</div>',
                        '</div>',
                        '</div>',
                        '<div class="modal-footer">',
                        '<button onclick="closeModal()" class="btn btn-link btn-sm font-size-lg border-all border-radius">OK <i class="fa fa-check"></i></button>',
                        '</div>',
                        '</div>',
                        '</div>'
                    ].join('');
                    container.append(toast);
                },
                showBlurredEffect: function (html, parent) {
                    var container = angular.element(document.getElementById('scrollable'));
                    //  container.append('<div style="-webkit-filter: blur(5px);filter: blur(5px);position: relative;top:200px;" class="ng-scope animated card center-div ' + RespondentService.GetAnimation() + '"><div class=sq-container><div class="ng-scope table-cell ng-binding sq-name">Q2</div><div class="ng-scope table-cell sq-text">Do you live in city?</div></div><div></div><div></div><div class=sv-container><div style=display:table;width:100%><div class=opt-v2.1-1><div><div class=hide-default option-id=1><div><div><div class="ng-scope darkBdr option-as-label"><span class="ng-scope survey-option-text">Yes</span></div></div></div></div></div></div><div class=opt-v2.1-2><div><div class=hide-default option-id=2><div><div class=ng-scope ng-switch-when=1><div class="ng-scope darkBdr option-as-label"><span class="ng-scope survey-option-text">No</span></div></div></div></div></div></div></div></div></div>');
                },
                changeViewToSubmitted: function (args) {
                    var submitButton = document.getElementById('submit');
                    submitButton.classList.add("surveySubmitted");
                    submitButton.innerHTML = SurveySettings.GetSubmittedButtonText();
                    $scope.ShowProgress = false;
                    // var waitHTML = document.getElementById('waitText');
                    // var container = document.getElementById('scrollable');
                    // container.removeChild(waitHTML);

                    // update only in preview mode
                    if (vm.SurveyMode === Enums.SurveyMode.Preview && window.frameElement && args != "DoNotRefresh") {
                        postMessageCase("submit", window.frameElement.id);
                    }
                },
                changeMessageToEnd: function () {
                    var endSurveyMessage = SurveySettings.GetSurveyEndText();
                    var MessageElement = document.getElementById('endText');
                    MessageElement.innerHTML = endSurveyMessage;
                },
                changeProgress: function () {
                    var distance = 0;
                    var currentIterationPosition = RespondentService.GetPossibleLoopIterations().getIndexOf(RespondentService.GetCurrentIteration());
                    if (currentIterationPosition > 0) {
                        return;
                    }
                    if (isBackMoved) {
                        distance = SurveyTreeService.getDistanceBetweenNodes(TraversalListService.getLastRenderedQuestion(), buffer[buffer.length - 1].ID);
                        SurveyTreeService.setProgress(-distance);
                    } else {
                        distance = SurveyTreeService.getDistanceBetweenNodes(TraversalListService.getLastAnsweredQuestionID(), buffer[buffer.length - 1].ID);
                        SurveyTreeService.setProgress(distance);
                    }
                    TraversalListService.setLastRenderedQuestion(buffer[buffer.length - 1].ID);
                    $scope.progressBar.Properties = SurveySettings.GetProgressBarProperties();

                    var base = SurveyTreeService.getMaxQuestions();
                    var progress = SurveyTreeService.getProgress();
                    // Submit button is Enabled then include last page in progress
                    if (SurveySettings.IsSubmitButtonEnabled()) {
                        base += 1;
                    }
                    var percentage = parseInt((progress / base) * 100);
                    if (typeof $scope.progressBar.Callbacks.updateProgress == "function") {
                        $scope.progressBar.Callbacks.updateProgress(percentage);
                    }
                    if (typeof $scope.progressBar.Callbacks.updateText == "function") {
                        if (SurveySettings.IsShowProgressBarTextAllowed()) {
                            var text = "";
                            if (SurveySettings.ProgressBarType == Enums.ShowProgressAs.Percentage) {
                                text += percentage + "% ";
                            } else {
                                var prefix = SurveySettings.GetProgressPrefix();
                                var suffix = SurveySettings.GetProgressSuffix();
                                text += progress + " " + prefix + " " + base + " " + suffix;
                            }
                            $scope.progressBar.Callbacks.updateText(text);
                        }
                    }
                },
                getProgressText: function () {
                    $scope.progressBar.Properties = SurveySettings.GetProgressBarProperties();
                    var text = "";
                    var base = SurveyTreeService.getMaxQuestions();
                    // Submit button is Enabled then include last page in progress
                    if (SurveySettings.IsSubmitButtonEnabled()) {
                        base += 1;
                    }
                    if (SurveySettings.ProgressBarType == Enums.ShowProgressAs.Percentage) {
                        text += 100 + "% ";
                    } else {
                        var prefix = SurveySettings.GetProgressPrefix();
                        var suffix = SurveySettings.GetProgressSuffix();
                        text += base + " " + prefix + " " + base + " " + suffix;
                    }
                    return text;
                },
                startTimeout: function () {
                    timeoutInfo.stopTimeout = $timeout(function () {
                        timeoutInfo.Callback();
                    }, timeoutInfo.Duration * 1000);
                },
                postRendering: function () {
                    NavigatorService.bindListeners($scope.ValidateBeforeNext, $scope.GoBack);
                    PageRouteService.AddPostValidationCallback(function (validationType, callback, args) {
                        if (typeof callback != "function") {
                            if (validationType == Enums.ValidationType.Valid || validationType == Enums.ValidationType.NoValidation) {
                                pageBuffer.validateQuestion(+1);
                            } else if (validationType == Enums.ValidationType.InValid) {
                                pageBuffer.validateQuestion(0);
                            }
                        }
                        if (validationType == Enums.ValidationType.AutoCodeConflict || validationType == Enums.ValidationType.AutoCodeSimilarity) {
                            pageBuffer.showAutoCodeConflict(validationType, callback);
                        } else if (validationType === Enums.ValidationType.SkipValidation) {
                            $scope.GoNext();
                            pageBuffer.resetWarning();
                        } else if (pageBuffer.isValid()) {
                            $scope.GoNext();
                            pageBuffer.resetWarning();
                        }
                    });
                },
                updateFooter: function () {
                    var nextButton = angular.element(document.getElementById('nxt-btn'));
                    var backButton = angular.element(document.getElementById('bck-btn'));
                    nextButton[0].innerHTML = (SurveySettings.GetButtons()['Next'][SurveySettings.GetSurveyLanguage()] || SurveySettings.GetButtons()['Next'][SurveySettings.GetDefaultLanguage()]) +
                        '<i class="icon icon-arrow-down" style="margin-left:5px;"></i>';
                    backButton[0].innerHTML = (SurveySettings.GetButtons()['Back'][SurveySettings.GetSurveyLanguage()] || SurveySettings.GetButtons()['Back'][SurveySettings.GetDefaultLanguage()]) +
                        '<i class="icon icon-arrow-up" style="margin-left:5px;"></i>';
                },
                renderWaitingView: function () {
                    $scope.ShowProgress = true;
                    // var view = UIService.GetWaitingView();
                    // var container = angular.element(document.getElementById('scrollable'));
                    // container.append(view);
                },

                showErrorView: function (errCode) {
                    var html = UIService.GetErrorView(errCode);
                    var scrollable = document.getElementById('scrollable');
                    scrollable.style.margin = "70px auto";
                    var container = angular.element(scrollable);
                    container.empty();
                    container.append(html);
                    childScope = $scope.$new();
                    $compile(container.contents())(childScope);
                    $scope.ShowProgress = false;
                }

            }
        }


        function merge(source, subIndexes, fixIndexes) {
            var finalIndexes = [];
            if (!fixIndexes || fixIndexes.length == 0)
                finalIndexes = subIndexes;
            else {
                var subP = 0;
                var fixP = 0;
                var totalIndexes = source.length - 1;
                while (totalIndexes >= 0) {
                    if (fixIndexes.length > fixP && fixIndexes[fixP] == finalIndexes.length) {
                        finalIndexes.push(fixIndexes[fixP]);
                        fixP++;
                    } else {
                        finalIndexes.push(subIndexes[subP]);
                        subP++;
                    }
                    totalIndexes--;
                }
            }
            //Merge
            var retVal = [];
            for (var i = 0; i < finalIndexes.length; i++)
                retVal.push(source[finalIndexes[i]]);
            return retVal;
        }

        /*
         *  Broadcast Listeners
         */

        $scope.$on('OnAuthorizationRequest', function () {
            pageBuffer.setAuth(true);
        });

        $scope.$on('OnLanguageSelectRequest', function () {
            pageBuffer.setLanguageSelector(true);
        });

        $scope.$on('OnNextClickProcessed', function () {
            $scope.Navigation.isBackDisabled = SurveySettings.IsBackButtonDisable || false;
        });
        $scope.$on('OnNextClick', function (args) {
            // update only in preview mode
            if (vm.SurveyMode === Enums.SurveyMode.Preview) {
                $scope.ValidateBeforeNext("DoNotRefresh");
            }
        });

        PageRouteService.AddWarningCallback(function (args) {
            pageBuffer.addWarning(args);
        });

        $scope.$on('refreshSurvey', function () {
            SurveySettings.ApplyChanges();
            pageBuffer.destroyView();
            pageBuffer.renderView();
        });

        $scope.$on('OnEndSurvey', function () {
            SurveySettings.ApplyChanges();
            pageBuffer.setStartupPage();
            var endNode = new EndNode();
            endNode.Message.Messages[SurveySettings.GetSurveyLanguage()] = SurveySettings.GetSurveyEndText();
            // No need to show submit button if survey is already finished
            $scope.Navigation.isSubmitDisabled = true;
            $scope.Navigation.hideSubmit = true;
            processEndOfSurvey(endNode, false);
        });

        $scope.$on('OnInactiveSurvey', function () {
            SurveySettings.ApplyChanges();
            pageBuffer.setStartupPage();
            var endNode = new EndNode();
            endNode.Message.Messages[SurveySettings.GetSurveyLanguage()] = SurveySettings.GetSurveyClosedText();
            // No need to show submit button if is inactive
            $scope.Navigation.isSubmitDisabled = true;
            $scope.Navigation.hideSubmit = true;
            processEndOfSurvey(endNode, false);
        });

        $scope.$on('ServerError', function (ev, args) {
            SurveySettings.ApplyChanges();
            pageBuffer.showErrorView(args);
        });

        window.addEventListener('message', function (e) {
            var values = e.data.split("###");
            switch (values[0]) {
                case "jumpnode":
                    var nextNodePointer = JSON.parse(values[1]);
                    SurveyTreeService.setNextSurveyTreePointer(nextNodePointer);
                    $scope.$broadcast('OnNextClick', "DoNotRefresh");
                    break;
                case "moveNext":
                    $scope.$broadcast('OnNextClick', "DoNotRefresh");
                    break;
                case "submit":
                    pageBuffer.changeViewToSubmitted();
                    $scope.Navigation.isSubmitDisabled = true;
                    $scope.Navigation.isBackDisabled = true;
                    break;
                case "showLang":
                    $scope.ShowLanguages("DoNotRefresh");
                    break;
                case "closeLang":
                    window.closeModal("DoNotRefresh");
                    break;
                case "showCode":
                    window.showCode("DoNotRefresh");
                    break;
                case "moveback":
                    SurveyTreeService.moveSurveyTreePointer(TraversalListService.MOVE_BACKWARD);
                    $scope.BroadcastBeforeBack("DoNotRefresh");
                    break;
                case "surveysettings":
                    var surveySettings = JSON.parse(values[1]);
                    if (values[2]) {
                        window.jsrcb.isMobile = values[2];
                    }
                    SurveySettings.SetSurveyProperties(surveySettings, true);
                    SurveySettings.ApplyChanges();
                    //    SurveySettings.UpdateSurveySettings(surveySettings.Settings, true);
                    if (pageBuffer.isLanguageSelectEnabled()) {
                        pageBuffer.languageSelectorView();
                    } else {
                        pageBuffer.destroyView();
                        pageBuffer.renderView();
                        pageBuffer.updateSurveyHeader();
                        pageBuffer.updateSurveyFooter();
                    }
                    // UIService.StyleSurvey()
                    break;
            }

            $scope.$apply();
        });

        NavigatorService.checkBackDisable = function () {
            return $scope.Navigation.isBackDisabled;
        };


        PageRouteService.AddStartUpPageCallback(function () {
            if (SurveySettings.IsStartupEnabled()) {
                NavigatorService.blockNavigation = true;
                var html = UIService.GetStartUpLayout();
                var page = document.getElementById('page');
                page.classList.add('invisible');
                var startUpDiv = document.getElementById('startup-page');
                startUpDiv.style.backgroundColor = SurveySettings.GetBackgroundColor();
                startUpDiv.style.display = "block";
                startUpDiv.appendChild(($compile(html)($scope))[0]);
                NavigatorService.startUpSubmit = $scope.CloseStartUpPage;
            }
        });

        $scope.CloseStartUpPage = function () {
            NavigatorService.blockNavigation = false;
            var page = document.getElementById('page');
            page.classList.remove('invisible');
            var startUpDiv = document.getElementById('startup-page');
            startUpDiv.remove();
            startUpDiv.style.display = "none!important";

            //Calculate SurveyParent Height
            var footerHeight = document.getElementById("footer-design").offsetHeight;
            var headerHeight = document.getElementById("hdr-Layout").offsetHeight;
            var pageHeight = document.getElementById("page").offsetHeight;
            document.getElementById("surveyParent").style.height = pageHeight - headerHeight - footerHeight - 10 + 'px';
        };

        $scope.OnSubmitResponse = function (message, endNode, callback) {
            pageBuffer.renderWaitingView();
            message = decodeURIComponent(message);
            if (vm.SurveyMode !== Enums.SurveyMode.Preview && vm.SurveyMode !== Enums.SurveyMode.View) {
                if (vm.SurveyMode != Enums.SurveyMode.Review) {
                    RespondentService.CloseRespondent(endNode.SurveyStatus).then(function () {
                        respondentSaveSuccessCallback(message, endNode, callback)
                    }, function (err) {
                        if (err.status === 500) {
                            pageBuffer.showErrorView(500);
                        }
                        respondentSaveErrorCallback(message, endNode, callback)
                    });
                } else {
                    RespondentService.SetRespondentEndVariables(endNode.SurveyStatus);
                    RespondentService.SaveRespondent("ReviewSave").then(function () {
                        respondentSaveSuccessCallback(message, endNode, callback)
                    });
                }
            } else {
                // set to submitted
                pageBuffer.changeViewToSubmitted();
            }
            $scope.Navigation.isBackDisabled = true;
            $scope.Navigation.isNextDisabled = true;
            $scope.Navigation.isSubmitDisabled = true;
        }

        function respondentSaveSuccessCallback(message, endNode, callback) {
            parent.postMessage("surveystatus###" + endNode.SurveyStatus, "*");
            if (vm.SurveyMode !== Enums.SurveyMode.Review) {
                var apiPath = SurveySettings.GetSurveyEndApiPath();
                if (apiPath) {
                    insights.trackEvent('CallbackHit', { 'RID': RespondentService.GetRespondentID(), 'PGuid': r("ProjectGUID").GetValue() });
                    CommunicationService.HitApi(apiPath).then(function (response) {
                        insights.trackEvent('CallbackSuccess', { 'RID': RespondentService.GetRespondentID(), 'PGuid': r("ProjectGUID").GetValue() });
                        $scope.ShowProgress = false;
                        renderEndView(message, endNode, callback);
                    }, function (error) {
                        insights.trackEvent('CallbackFailed', { 'RID': RespondentService.GetRespondentID(), 'Error': JSON.stringify(error), 'PGuid': r("ProjectGUID").GetValue() });
                    });
                } else {
                    $scope.ShowProgress = false;
                    renderEndView(message, endNode, callback);
                }
            } else {
                $scope.ShowProgress = false;
                renderEndView(message, endNode, callback);
            }
        }

        function respondentSaveErrorCallback(message, endNode, callback) {
            $scope.ShowProgress = false;
            if (typeof callback == "function") {
                var endSurveyMessage = SurveySettings.GetSurveyEndText();
                callback(endSurveyMessage);
            } else {
                // change to submitted
                pageBuffer.changeViewToSubmitted();
                // change end survey text
                pageBuffer.changeMessageToEnd();
            }
        }

        function onChangeLanguage() {
            // if on language change enabled then write your code here
            if (SurveySettings.IsLanguageChangeActionEnabled() && r('CLang').GetValue() != RespondentService.GetLanguageCode($scope.UserSelected.Language)) {
                //fire
                SurveySettings.ExecuteCallback();
            }
            RespondentService.SetSurveyLanguage($scope.UserSelected.Language);
            SurveySettings.SetSurveyLanguage($scope.UserSelected.Language);
            pageBuffer.updateFooter();
        }

        function renderEndView(message, endNode, callback) {
            if (typeof callback == "function") {
                callback(message);
            } else {
                // change to submitted
                pageBuffer.changeViewToSubmitted();
            }
            if (endNode.RedirectToURL && endNode.RedirectURL) {
                if (endNode.AppendPanelParameters) {
                    var panelVariables = SurveySettings.GetPanelVariables();
                    var urlSplits = endNode.RedirectURL.split("?");
                    var queryParams = {};
                    if (urlSplits[1]) {
                        var paramSplits = urlSplits[1].split("&");
                        for (var i = 0; i < paramSplits.length; i++) {
                            var paramValues = paramSplits[i].split("=");
                            if (paramValues.length == 2) {
                                queryParams[paramValues[0]] = paramValues[1];
                            }
                        }
                    }
                    for (var x in panelVariables) {
                        queryParams[x] = r(panelVariables[x][0]).GetValue();
                    }
                    var queryString = "";
                    for (var q in queryParams) {
                        queryString += q + "=" + queryParams[q] + "&";
                    }
                    queryString = queryString.substring(0, queryString.length - 1);
                    endNode.RedirectURL = urlSplits[0] + "?" + queryString;
                }
                var noTimer = typeof callback != "function" || false;
                pageBuffer.setRedirection(endNode.RedirectURL, noTimer);
            }
        }

        function overwriteLanguageKey() {
            var ProjectGUID = r("ProjectGUID").GetValue();
            if ((ProjectGUID == '1d355fdc-ff35-e199-de1d-97b8f42451b1' || ProjectGUID == 'da4b5120-f542-0cb1-7718-f2a1d1a1cd9f' || ProjectGUID == '40b3974e-6deb-093a-8baf-37c341654656' || ProjectGUID == '9d810f1b-a166-176a-beb3-937683a06fd7') && $scope.UserSelected.Language == 'en-us') {
                $scope.SelectedLanguage = 'en-IN';
            } else {
                $scope.SelectedLanguage = $scope.UserSelected.Language;
            }
        }

        function isLastAttribute() {
            return TraversalListService.getMaxAttributes() == TraversalListService.getAttributePosition();
        }

        function isMobileFriendlyGrid(buffer) {
            return buffer.reduce(function (prev, curr) {
                return prev || curr.QuestionType == Enums.QuestionType.SimpleGrid && curr.Properties.MobileFriendly == "true" && window.jsrcb.isMobile;
            }, false);
        }

        //Function to upadte changes in both the views in preview
        function postMessageCase(caseID, frameID) {
            var currentNodePointer = SurveyTreeService.getSurveyTreePointer();
            if (frameID == 'receiver2') {
                var frame1 = parent.document.getElementById('receiver').contentWindow;
                frame1.postMessage(caseID + "###" + JSON.stringify(currentNodePointer), window.location.href);
            } else {
                var frame2 = parent.document.getElementById('receiver2').contentWindow;
                frame2.postMessage(caseID + "###" + JSON.stringify(currentNodePointer), window.location.href);
            }
        }

        $scope.loadNext = function (pageNumber) {
            $scope.ShowProgress = true;
            $scope.ReviewScrollService.items.length = 0;
            $scope.ReviewScrollService.displayedStartIndex = $scope.ReviewScrollService.displayedEndIndex + 1;
            $scope.ReviewScrollService.displayedEndIndex += 5;
            pageBuffer.reviewResponses();
        }

        $scope.loadPrev = function (pageNumber) {
            $scope.ShowProgress = true;
            $scope.ReviewScrollService.items.length = 0;
            $scope.ReviewScrollService.displayedEndIndex = $scope.ReviewScrollService.displayedStartIndex - 1;
            $scope.ReviewScrollService.displayedStartIndex -= 5;
            pageBuffer.reviewResponses();
        }
    }
})
    (angular);