(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name module.service:service
     * @requires other
     **/
    angular.module('SurveyEngineCore').factory('EngineCore.SurveyTreeService', ['$q',
        'EngineCore.CommunicationService', 'SurveyEngine.Enums', 'SurveyEngine.SurveySettings', surveyTreeService
    ]);

    function surveyTreeService($q, CommunicationService, Enums, SurveySettings) {

        // TODO : Create a index of options with variableID.

        var scripts = {},
            surveyEndNodes = {};
        var surveyTreeIndexes = {};
        var progressNumber = 0;
        var questionCount = 0;
        var childParent = {};
        var questionsIndexes = {};
        var surveyTree = {};
        var currentSectionName = {};
        var currentNodePointer = {};
        var nextNodePointer = {};
        var childIndex = null, questionsArray = [], questionsHash = {}, qPromise = null, shallowSurveyTree, quotas = {}, questionnairePromises = [], flatQuestionIds = [];

        var carryForwardedQuestion = {};

        var factory = {
            load: load,
            getSurveyTreePointer: getSurveyTreePointer,
            setSurveyTreePointer: setSurveyTreePointer,

            getCurrentSurveyTreeNode: getCurrentSurveyTreeNode,
            getNextSurveyTreeNode: getNextSurveyTreeNode,
            getSequencerNode: getSequencerNode,
            moveSurveyTreePointer: moveSurveyTreePointer,
            getSection: getSection,
            getChildIndex: getChildIndex,
            getNextSurveyTreePointer: getNextSurveyTreePointer,
            setNextSurveyTreePointer: setNextSurveyTreePointer,
            addQuestionIndex: addQuestionIndex,
            getScript: getScript,
            getSurveyTreeScript: getSurveyTreeScript,
            createIndexes: createIndexes,
            getParentNodeID: getParentNodeID,
            updateQIndexes: updateQIndexes,
            getQuesNameFromId: getQuesNameFromId,
            resetSurveyTree: resetSurveyTree,
            getCurrentSectionName: getCurrentSection,
            setCurrentSectionName: setCurrentSection,
            getProgress: getProgress,
            setProgress: setProgress,
            getMaxQuestions: getMaxQuestions,
            getText: getText,
            getOtherVariable: getOtherVariable,
            getAllOptions: getAllOptions,
            getSurveyEndNode: getSurveyEndNode,
            setCfQuestion: setCfQuestion,
            getCfQuestion: getCfQuestion,
            isSurveyQuestion: isSurveyQuestion,
            getQuestionID: getQuestionID,
            getQuestion: getQuestion,
            getSurveyTreeQuestionIds: getSurveyTreeQuestionIds,
            getQuesObject: getQuesObject,
            getQuotaNode: getQuotaNode,
            setQuotaNode: setQuotaNode,
            adjustPositionsAfterSequencing: adjustPositionsAfterSequencing,
            getDistanceBetweenNodes: getDistanceBetweenNodes,
            shuffleNodes: shuffleNodes,
            initProgress: initProgress,
            getOrderedOptions: getOrderedOptions,
            flushQuestionnaire: flushQuestionnaire
        };

        window.q = function (ids) {
            return new Quota(ids);
        }
        window.qresults = {};
        Quota.prototype.GetAndCheckQuotas = function (callback) {
            var deferred = $q.defer();
            if (Array.isArray(this.ID)) {
                var promises = [];
                this.ID.map(function (d) {
                    promises.push(getQuotaNode(d));
                });
                $q.all(promises).then(function (quotas) {
                    var input = {};
                    quotas.map(function (d) {
                        if (!window.qresults.hasOwnProperty(d.ID)) {
                            var quotaVariables = [];
                            quotaVariables = quotaVariables.concat(getVariablesFromQuotaNode(quotaNode.QuotaDefinition.SideBreak));
                            quotaVariables = quotaVariables.concat(getVariablesFromQuotaNode(quotaNode.QuotaDefinition.TopBreak));
                            var quotaVariableAnswers = {};
                            quotaVariables.map(function (v) {
                                var values = window.r(v).GetValue();
                                if (values == null) {
                                    values = [];
                                } else if (!Array.isArray(values)) {
                                    values = [values];
                                }
                                quotaVariableAnswers[v] = values;
                            });
                            input[d.ID] = quotaVariableAnswers;
                        }
                    });
                    if (Object.keys(input).length > 0) {
                        CommunicationService.CheckBulkQuota(input).then(function (results) {
                            for (var res in results) {
                                window.qresults[res] = results[res];
                            }
                            deferred.resolve(callback);
                        });
                    } else {
                        deferred.resolve(callback);
                    }
                });
            }
            return deferred.promise;
        }

        Quota.prototype.NotMet = function () {
            return !this.IsMet;
        }

        Quota.prototype.Met = function () {
            return this.IsMet;
        }

        return factory;

        ////////////////////////////////////

        function resetSurveyTree(isReload) {
            currentNodePointer = null;
            childIndex = 0;
            if (!isReload) {
                surveyTree = angular.copy(shallowSurveyTree);
                scripts = {};
            }
        }

        function flushQuestionnaire() {
            questionnairePromises = [];
        }

        function load() {
            var deferred = $q.defer();
            if (questionnairePromises.length > 0) {
                resolvePromises(deferred);
            } else {
                questionnairePromises.push(CommunicationService.GetSurveyTree(Enums.QuestionCategory.Survey));
                if (SurveySettings.QueryParameter.Mode != Enums.SurveyMode.Preview) {
                    questionnairePromises.push(CommunicationService.GetFullQuestionnaire());
                }
                resolvePromises(deferred);
            }
            return deferred.promise;

            function resolvePromises(deferred) {
                $q.all(questionnairePromises).then(function (data) {
                    progressNumber = 0;
                    shallowSurveyTree = data[0];
                    surveyTree = angular.copy(shallowSurveyTree);
                    createIndexes(surveyTree);
                    flatQuestionIds = flattenQuestionIds(surveyTree);
                    deferred.resolve(surveyTree);
                });
            }
        }

        function getSection(id) {
            var deferred = $q.defer();
            setTimeout(function () {
                var treeNode;
                var nodeIndex = surveyTreeIndexes[id];
                var parentNodeIndex = surveyTreeIndexes[getParentNodeID(id)];
                if (parentNodeIndex > -1) {
                    treeNode = surveyTree[parentNodeIndex].Children[nodeIndex];
                } else {
                    treeNode = surveyTree[nodeIndex];
                }
                var childNodeIndex = 0;
                if (currentNodePointer && surveyTreeIndexes[currentNodePointer.ChildNodeID] > 0) {
                    childNodeIndex = surveyTreeIndexes[currentNodePointer.ChildNodeID];
                }
                var section = null;
                var promises = [];
                if (treeNode.hasOwnProperty('SurveyObjectID') && treeNode.IconFlag !== Enums.DisplayFlag.Deleted &&
                    (treeNode.IconFlag & Enums.DisplayFlag.Deleted) !== Enums.DisplayFlag.Deleted) {
                    promises.push(CommunicationService.GetSection(id));
                } else {
                    promises.push(treeNode);
                }
                var sectionChildren = treeNode.Children;
                var breakNum = SurveySettings.QuestionPerPage + childNodeIndex;
                // Check for loope from survey child
                if (treeNode.IconFlag === Enums.DisplayFlag.IsLoop ||
                    (treeNode.IconFlag & Enums.DisplayFlag.IsLoop) === Enums.DisplayFlag.IsLoop) {
                    breakNum = treeNode.Children.length;
                }
                for (var i = 0; i < sectionChildren.length; i++) {
                    // Do not Deep load, if already been loaded
                    if (sectionChildren[i].hasOwnProperty('ID')) {
                        breakNum++;
                        promises.push(sectionChildren[i]);
                        continue;
                    }
                    if (sectionChildren[i].hasOwnProperty('Quota')) {
                        breakNum++;
                        promises.push(sectionChildren[i]);
                        continue;
                    }
                    // Check for soft delete from survey child
                    if (isDeleted(sectionChildren[i].IconFlag)) {
                        continue;
                    }
                    // Check for hidden question
                    if (isHidden(sectionChildren[i].IconFlag)) {
                        breakNum++;
                        promises.push(CommunicationService.GetQuestion(sectionChildren[i].SurveyObjectID));
                        continue;
                    }
                    // If Survey Object Type is Question
                    if (sectionChildren[i].SurveyObjectType === Enums.SurveyObjectType.Question) {
                        addQuestionIndex(sectionChildren[i].SurveyObjectID, promises.length - 1);
                        if (promises.length - 1 > breakNum) {
                            breakNum++;
                            promises.push(sectionChildren[i]);
                        } else {
                            promises.push(CommunicationService.GetQuestion(sectionChildren[i].SurveyObjectID));
                        }
                    }
                    //  If Survey Object Type is Page break
                    else if (sectionChildren[i].SurveyObjectType === Enums.SurveyObjectType.PageBreak) {
                        addQuestionIndex(sectionChildren[i].SurveyObjectID, promises.length - 1);
                        promises.push(sectionChildren[i]);
                        breakNum++;
                    }
                    // If Survey Object Type is Script (Jump or SetValue)
                    else if (sectionChildren[i].SurveyObjectType === Enums.SurveyObjectType.Jump ||
                        sectionChildren[i].SurveyObjectType === Enums.SurveyObjectType.SetValue) {
                        addQuestionIndex(sectionChildren[i].SurveyObjectID, promises.length - 1);
                        promises.push(getSurveyTreeScript(sectionChildren[i].SurveyObjectID));
                        breakNum++;
                    }
                    // If Quota Node
                    else if (sectionChildren[i].SurveyObjectType === Enums.SurveyObjectType.Quota) {
                        addQuestionIndex(sectionChildren[i].SurveyObjectID, promises.length - 1);
                        promises.push(getQuotaNode(sectionChildren[i].SurveyObjectID));
                        breakNum++;
                    }
                }

                $q.all(promises).then(function (resolved) {
                    section = resolved.splice(0, 1)[0];
                    var loopQuestionID = section.LoopQuestionGUID;
                    resolved = resolved.filter(function (d) {
                        return typeof d === "object";
                    });
                    var secID = section.ID || section.SurveyObjectID;
                    createIndexes(resolved, secID);
                    section.Children = resolved;
                    var scriptPromises = [];
                    var carryForwardQPromises = [];
                    // Check for all the scripts (masking) in the questions .
                    // Script can be at question level or variable level for option masking
                    for (var i = 0; i < resolved.length; i++) {
                        addQuestionIndex(resolved[i].ID, i);
                        createQuestionHash(resolved[i]);

                        // It can have Questions, Scripts or Page break.
                        // If item is Page break then do nothing
                        if (resolved[i].SurveyObjectType === Enums.SurveyObjectType.PageBreak ||
                            resolved[i].ObjectType === Enums.ObjectType.Script) {
                            continue;
                        }

                        // If question has carry forward and source question is not present in questionHash
                        if (typeof resolved[i].CarryForward == 'object') {
                            for (var xi in resolved[i].CarryForward) {
                                if (resolved[i].CarryForward[xi].IsEnabled && resolved[i].CarryForward[xi].SourceQuestionGUID && !questionsHash.hasOwnProperty(resolved[i].CarryForward[xi].SourceQuestionGUID)) {
                                    carryForwardQPromises.push(CommunicationService.GetQuestion(resolved[i].CarryForward[xi].SourceQuestionGUID));
                                }
                            }
                        }

                        // If question has attribute carryforward Id then fetch the script associated with it.
                        if (resolved[i].AttributeCarryForwardScriptID) {
                            scriptPromises.push(getSurveyTreeScript(resolved[i].AttributeCarryForwardScriptID));
                        }

                        // If question has validation script associated with it.
                        if (resolved[i].ValidationScriptID) {
                            scriptPromises.push(getSurveyTreeScript(resolved[i].ValidationScriptID));
                        }
                        // If question has script (Masking) associated with it.
                        if (resolved[i].QuestionMaskingScriptID) {
                            scriptPromises.push(getSurveyTreeScript(resolved[i].QuestionMaskingScriptID));
                        }
                        var addedScripts = [];
                        // Check for option masking scripts
                        for (var j in resolved[i].Variables) {
                            var variable = resolved[i].Variables[j];
                            if ((variable.VariableType === Enums.VariableType.SingleChoice ||
                                variable.VariableType === Enums.VariableType.MultipleChoice) && variable.OptionMaskingScriptID &&
                                addedScripts.indexOf(variable.OptionMaskingScriptID) === -1) {
                                scriptPromises.push(getSurveyTreeScript(variable.OptionMaskingScriptID));
                                addedScripts.push(variable.OptionMaskingScriptID);
                            }
                            if (variable.OptionCarryForwardScriptID && addedScripts.indexOf(variable.OptionCarryForwardScriptID) === -1) {
                                scriptPromises.push(getSurveyTreeScript(variable.OptionCarryForwardScriptID));
                                addedScripts.push(variable.OptionCarryForwardScriptID);
                            }
                            if (variable.VariableMaskingScriptID && addedScripts.indexOf(variable.VariableMaskingScriptID) === -1) {
                                scriptPromises.push(getSurveyTreeScript(variable.VariableMaskingScriptID));
                                addedScripts.push(variable.VariableMaskingScriptID);
                            }
                        }

                        for (var attributeId in resolved[i].Attributes) {
                            var attribute = resolved[i].Attributes[attributeId];
                            if (attribute.AttributeMaskingScriptID)
                                scriptPromises.push(getSurveyTreeScript(attribute.AttributeMaskingScriptID));
                        }

                        for (var grpId in resolved[i].Groups) {
                            var group = resolved[i].Groups[grpId];
                            if (group.GroupMaskingScriptID)
                                scriptPromises.push(getSurveyTreeScript(group.GroupMaskingScriptID));
                        }
                    }
                    // if section has loop based on question then fetch the question on which it is based.
                    if (loopQuestionID) {
                        carryForwardQPromises.push(CommunicationService.GetQuestion(loopQuestionID));
                    }
                    // add carryforward promises in script promises
                    for (var ri = 0; ri < carryForwardQPromises.length; ri++) {
                        scriptPromises.push(carryForwardQPromises[ri])
                    }
                    // Get All scripts if present in the questions of a particular section.
                    $q.all(scriptPromises).then(function (resolvedScripts) {
                        for (var i = 0; i < resolvedScripts.length - carryForwardQPromises.length; i++) {
                            scripts[resolvedScripts[i].ID] = resolvedScripts[i];
                        }
                        for (var i = resolvedScripts.length - carryForwardQPromises.length; i < resolvedScripts.length; i++) {
                            createQuestionHash(resolvedScripts[i]);
                            setCfQuestion(resolvedScripts[i]);
                        }
                        if (parentNodeIndex > -1) {
                            surveyTree[parentNodeIndex].Children[nodeIndex] = section;
                        } else {
                            surveyTree[nodeIndex] = section;
                        }
                        deferred.resolve(section);
                    });
                });
            }, 0);
            return deferred.promise;
        }

        function getScript(scriptId) {
            if (scripts.hasOwnProperty(scriptId)) {
                return scripts[scriptId];
            }
            return null;
        }

        function getSurveyEndNode(id) {
            var deferred = $q.defer();

            setTimeout(function () {
                if (id) {
                    if (surveyEndNodes.hasOwnProperty(id)) {
                        deferred.resolve(surveyEndNodes[id]);
                    } else {
                        CommunicationService.GetSurveyEndNode(id).then(function (data) {
                            surveyEndNodes[id] = data;
                            deferred.resolve(data);
                        })
                    }
                } else {
                    var endNode = new EndNode(Enums.SurveyStatus.Completed);
                    endNode.Message.Messages[SurveySettings.GetSurveyLanguage()] = SurveySettings.GetSurveyEndText();
                    deferred.resolve(endNode);
                }
            }, 0);

            return deferred.promise;
        }

        function getSurveyTreeScript(scriptId) {
            var deferred = $q.defer();

            setTimeout(function () {
                if (scripts.hasOwnProperty(scriptId)) {
                    resolveScript(scripts[scriptId], deferred);
                } else {
                    CommunicationService.GetScript(scriptId).then(function (data) {
                        scripts[scriptId] = data;
                        resolveScript(scripts[scriptId], deferred);
                    }, function () {
                        deferred.resolve(scriptId);
                    })
                }
            }, 0);

            return deferred.promise;

            function resolveScript(script, deferred) {
                if (hasQuotaScript(script.Body)) {
                    try {
                        var evaluatedScript = (0, eval)(script.Body);
                        if (evaluatedScript instanceof $q) {
                            evaluatedScript.then(function (callback) {
                                if (typeof callback == "function") {
                                    script.ScriptResult = callback();
                                    deferred.resolve(script);
                                }
                            });
                        }
                    } catch (e) {
                        deferred.resolve(script);
                    }
                } else {
                    deferred.resolve(script);
                }
            }
        }

        function hasQuotaScript(body) {
            return (typeof body == "string" && body.indexOf("GetAndCheckQuotas") > -1);
        }

        function getQuotaNode(id) {
            var deferred = $q.defer();

            setTimeout(function () {
                if (quotas.hasOwnProperty(id)) {
                    deferred.resolve(quotas[id]);
                } else {
                    CommunicationService.GetQuotaNode(id).then(function (data) {
                        var qNode = data;
                        qNode["ID"] = data.Quota.ID;
                        quotas[id] = qNode;
                        deferred.resolve(qNode);
                    }, function () {
                        deferred.resolve(id);
                    })
                }
            }, 0);

            return deferred.promise;
        }

        function setQuotaNode(id, node) {
            quotas[id] = node;
        }

        function getSurveyTreePointer() {
            return currentNodePointer;
        }

        function getNextSurveyTreePointer() {
            return nextNodePointer;
        }

        function setNextSurveyTreePointer(nextNode) {
            if (nextNode)
                nextNodePointer = new NodePointer(nextNode.ParentNodeID, nextNode.NodeID, nextNode.ChildNodeID);
            else
                nextNodePointer = null;
        }

        function setSurveyTreePointer(pointer) {
            currentNodePointer = pointer;
        }

        function getCurrentSurveyTreeNode() {
            var deferred = $q.defer();
            setTimeout(function () {
                if (currentNodePointer == null) {
                    deferred.resolve(surveyTree[0]);
                } else {
                    var parentIndex,
                        index = surveyTreeIndexes[currentNodePointer.NodeID];
                    if (currentNodePointer.ParentNodeID) {
                        parentIndex = surveyTreeIndexes[currentNodePointer.ParentNodeID];
                        deferred.resolve(surveyTree[parentIndex].Children[index]);
                    } else {
                        deferred.resolve(surveyTree[index]);
                    }
                }
            }, 0);
            return deferred.promise;
        }

        function getNextSurveyTreeNode(processedChild, iterations) {
            if (currentNodePointer == null) {
                if (surveyTree.length > 1) {
                    return surveyTree[1];
                } else {
                    return {};
                }
            }

            var index,
                parentIndex = null;
            if (currentNodePointer.ParentNodeID) {
                parentIndex = surveyTreeIndexes[currentNodePointer.ParentNodeID];
                var parentNode = surveyTree[parentIndex];
                index = surveyTreeIndexes[currentNodePointer.NodeID] + 1;
                if (index < parentNode.Children.length) {
                    return surveyTree[parentIndex].Children[index];
                } else if ((parentIndex + 1) < surveyTree.length) {
                    return surveyTree[parentIndex + 1];
                }
                return new EndNode();
            }
            index = surveyTreeIndexes[currentNodePointer.NodeID];
            var children = [];
            if (iterations && Array.isArray(iterations) && iterations.length > 0) {
                iterations.map(function (i) {
                    surveyTree[index].Children.map(function (d) {
                        var p = angular.copy(d);
                        p.ID += '|' + i;
                        p.Name += '.' + i;
                        children.push(p);
                        return d;
                    });
                    var pageBreak = new PageBreak();
                    // Add Page Break
                    addQuestionIndex(pageBreak.SurveyObjectID, children.length);
                    children.push(pageBreak);
                });
            } else {
                children = surveyTree[index].Children;
            }
            if (currentNodePointer.ChildNodeID && childIndex >= 0) {
                var nextChildIndex = processedChild || 1;
                if (nextChildIndex < children.length) {
                    return children[nextChildIndex];
                }
            }

            if (processedChild < children.length) {
                return children[processedChild];
            }

            index += 1;
            if (index < surveyTree.length) {
                return surveyTree[index];
            }

            return new EndNode();
            // Return END Node
        }

        function moveSurveyTreePointer(moveTo) {
            if (moveTo == 1) {
                currentNodePointer = angular.copy(nextNodePointer);
                childIndex = questionsIndexes[currentNodePointer.ChildNodeID] || 0;
            } else if (moveTo == -1) {
                if (currentNodePointer == null) {
                    childIndex = 0;
                } else {
                    childIndex = questionsIndexes[currentNodePointer.ChildNodeID];
                }
            }
        }

        function getChildIndex() {
            if (currentNodePointer == null) {
                childIndex = 0;
            } else {
                childIndex = questionsIndexes[currentNodePointer.ChildNodeID] || 0;
            }
            return childIndex;
        }

        function setNextSurveyTreeNode(node) {
            nextNodePointer = node;
        }

        function createIndexes(list, parentId, isLoopQuestion) {
            for (var i = 0; i < list.length; i++) {
                var objectType = list[i].SurveyObjectType || list[i].ObjectType;
                var objectID = list[i].SurveyObjectID || list[i].ID;
                var iconFlag = list[i].IconFlag;
                // count total number of questions in the survey.
                // Ignore deleted questions.
                surveyTreeIndexes[objectID] = i;
                childParent[objectID] = parentId;
                if ((objectType == Enums.SurveyObjectType.Section || objectType == Enums.SurveyObjectType.Sequencer) &&
                    (isDeleted(iconFlag) || isHidden(iconFlag))) {
                    continue;
                }
                if (objectType === Enums.SurveyObjectType.Question && !isDeleted(iconFlag) && !isHidden(iconFlag)) {
                    setProgressMax(objectID, isLoopQuestion);
                }
                if (list[i].hasOwnProperty('Children') && Array.isArray(list[i].Children)) {
                    createIndexes(list[i].Children, objectID);
                }
            }
        }

        function createQuestionHash(question) {
            questionsHash[question.ID] = question;
        }

        function getText() {
            var quesId = arguments[0];
            var variableName = arguments[1];
            var optionId = arguments[2];
            for (var id in carryForwardedQuestion) {
                if (id.split('|')[0] == quesId) {
                    quesId = id;
                    break;
                }
            }
            var text;
            if (quesId in carryForwardedQuestion) {
                text = getTextFromQuestion(carryForwardedQuestion, quesId);
            } else if (quesId in questionsHash) {
                text = getTextFromQuestion(questionsHash, quesId);
            }

            if (text) {
                return text;
            } else if (qPromise === null) {
                qPromise = CommunicationService.GetQuestion(quesId);
                qPromise.then(function (ques) {
                    createQuestionHash(ques);
                    setCfQuestion(ques);
                    qPromise = null;
                });
            }

            return null;

            // This method is written to prevent the situation where option code is coming as 0
            // and "if (optionCode)" is returning false which is causing the program to take question text
            // instead of option text.
            function isValidOption(optionCode) {
                return (optionCode !== null && optionCode !== undefined && optionCode !== "");
            }

            function getTextFromQuestion(question, quesId) {
                // Get Question Text
                if (quesId && !(variableName && isValidOption(optionId))) {
                    return question[quesId].Text[SurveySettings.GetSurveyLanguage()] || question[quesId].Text[SurveySettings.GetDefaultLanguage()];
                }

                if ((quesId && variableName) && !isValidOption(optionId)) {
                    var variables = question[quesId].Variables;
                    for (var i in variables) {
                        if (variables[i].Name === variableName) {
                            return question[quesId].Variables[i].Text[SurveySettings.GetSurveyLanguage()] ||
                                question[quesId].Variables[i].Text[SurveySettings.GetDefaultLanguage()];
                        }
                    }
                }

                if (quesId && variableName && isValidOption(optionId)) {
                    var variables = question[quesId].Variables;
                    for (var i in variables) {
                        if (variables[i].Name === variableName || variables[i].Name.split('.')[0] === variableName.split('.')[0] || variables[i].Name.split('.')[0] === variableName || variables[i].Name === variableName.split('.')[0]) {
                            return question[quesId].Variables[i].Options[optionId].Text[SurveySettings.GetSurveyLanguage()] ||
                                question[quesId].Variables[i].Options[optionId].Text[SurveySettings.GetDefaultLanguage()];
                        }
                    }
                }
            }
        }

        function getAllOptions() {
            var quesId = arguments[0];
            var variableName = arguments[1];
            if (quesId && variableName) {
                for (var q in carryForwardedQuestion) {
                    if (q.split('|')[0] == quesId) {
                        for (var i in carryForwardedQuestion[q].Variables) {
                            if (carryForwardedQuestion[q].Variables[i].Name.split('.')[0] == variableName) {
                                return Object.keys(carryForwardedQuestion[q].Variables[i].Options);
                            }
                        }
                    }
                }
                for (var q in questionsHash) {
                    if (q.split('|')[0] == quesId) {
                        for (var i in questionsHash[q].Variables) {
                            if (questionsHash[q].Variables[i].Name.split('.')[0] == variableName) {
                                return Object.keys(questionsHash[q].Variables[i].Options);
                            }
                        }
                    }
                }
            }
            return [];
        }


        function getOrderedOptions() {
            var quesId = arguments[0];
            var variableName = arguments[1];
            var options = [];
            if (quesId && variableName && questionsHash.hasOwnProperty(quesId)) {
                for (var i in questionsHash[quesId].Variables) {
                    var variable = questionsHash[quesId].Variables[i];
                    if (variable.Name == variableName) {
                        variable.VariableLevelSequence.map(function (d) {
                            if (d.IsOption) {
                                options.push(d.ID);
                            } else if (variable.OptionGroups[d.ID]) {
                                options = options.concat(variable.OptionGroups[d.ID].OptionSequence);
                            }
                        });
                    }
                }
            }
            return options;
        }

        function isSurveyQuestion(qid) {
            if (questionsHash.hasOwnProperty(qid)) {
                if (questionsHash[qid].QuestionCategory == Enums.QuestionCategory.Survey) {
                    return true;
                }
            }
            return false;
        }

        function getOtherVariable() {
            var quesId = arguments[0];
            var variableName = arguments[1];
            var optionId = arguments[2];
            if (quesId && variableName && optionId && questionsHash[quesId]) {
                var variables = questionsHash[quesId].Variables;
                var otherVarId;
                for (var i in variables) {
                    if (variables[i].Name === variableName) {
                        otherVarId = questionsHash[quesId].Variables[i].Options[optionId].OtherVariableID;
                        break;
                    }
                }
                if (otherVarId)
                    return questionsHash[quesId].Variables[otherVarId].Name;
            }
            return null;
        }

        function setProgressMax(qName, isLoopQuestion) {
            if (!qName)
                return;
            if (isLoopQuestion) {
                var ques = qName.split('|')[0];
                var i = questionsArray.indexOf(ques);
                if (i > -1)
                    questionsArray.splice(i, 1);
            }
            if (questionsArray.indexOf(qName) === -1) {
                questionsArray.push(qName);
            }
            questionCount = questionsArray.length;
        }

        function addQuestionIndex(question, index) {
            if (question) {
                questionsIndexes[question] = index;
                if (childIndex == null && currentNodePointer && currentNodePointer.ChildNodeID == question) {
                    childIndex = questionsIndexes[currentNodePointer.ChildNodeID] || 0;
                }
            }
        }

        function getCurrentSection() {
            return currentSectionName
        }

        function setCurrentSection(sectionName) {
            currentSectionName = sectionName;
        }

        function getProgress() {
            return parseInt(progressNumber + 1);
        }

        function setProgress(quesCount) {
            if (quesCount == null)
                progressNumber = questionCount;
            else
                progressNumber = progressNumber + quesCount;
        }

        function getMaxQuestions() {
            return flatQuestionIds.length;
        }

        function updateQIndexes(list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].ObjectType === Enums.ObjectType.Question)
                    questionsIndexes[list[i].ID] = i;
            }
        }

        function getParentNodeID(id) {
            return childParent[id] || null;
        }

        function getQuesNameFromId(sectionId, qid) {
            return surveyTree[surveyTreeIndexes[sectionId]].Children[surveyTreeIndexes[qid]].SurveyObjectName;
        }

        function getCfQuestion(guid) {
            return carryForwardedQuestion[guid];
        }

        function setCfQuestion(question) {
            carryForwardedQuestion[question.ID] = question;
        }

        function getQuestionID(variableName) {
            for (var i in questionsHash) {
                var variables = questionsHash[i].Variables;
                for (var j in variables) {
                    if (variables[j].Name == variableName) {
                        return i;
                    }
                }
            }
        }

        function getQuestion(id) {
            var deferred = $q.defer();
            if (id in questionsHash) {
                deferred.resolve(questionsHash[id]);
            } else {
                CommunicationService.GetQuestion(id).then(function (q) {
                    createQuestionHash(q);
                    deferred.resolve(q);
                });
            }
            return deferred.promise;
        }

        function getQuesObject(id) {
            return questionsHash[id] || {};
        }

        function getSurveyTreeQuestionIds() {
            return getQuestionIds(shallowSurveyTree);
        }

        function getQuestionIds(tree) {
            var ids = [];
            for (var i = 0; i < tree.length; i++) {
                if (Enums.ObjectType.Question == tree[i].SurveyObjectType && !isDeleted(tree[i].IconFlag) && tree[i].SurveyObjectSubType != Enums.QuestionType.Display) {
                    ids.push(tree[i].SurveyObjectID);
                } else if (tree[i].Children.length > 0) {
                    ids = ids.concat(getQuestionIds(tree[i].Children));
                }
            }
            return ids;
        }

        function isDeleted(flag) {
            return flag === Enums.DisplayFlag.Deleted || (flag & Enums.DisplayFlag.Deleted) === Enums.DisplayFlag.Deleted;
        }

        function isHidden(flag) {
            return flag === Enums.DisplayFlag.Hidden || (flag & Enums.DisplayFlag.Hidden) === Enums.DisplayFlag.Hidden;
        }

        function Quota() {
            var args = Array.prototype.slice.call(arguments);
            this.ID = args[0];
            this.IsMet = window.qresults[this.ID] || false;
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
            } catch (e) {
            }
            return vars;
        }

        function flattenQuestionIds(tree) {
            if (tree.length == 0) {
                return [];
            }
            var nodes = [];
            tree.map(function (d) {
                var isQuestion = (d.SurveyObjectType || d.ObjectType) == Enums.ObjectType.Question;
                var isShownInSurvey = !isHidden(d.IconFlag) && !isDeleted(d.IconFlag);
                if (!isShownInSurvey) {
                    return;
                }
                if (isQuestion) {
                    nodes.push(d.SurveyObjectID || d.ID);
                }
                if (d.Children.length > 0) {
                    nodes = nodes.concat(flattenQuestionIds(d.Children));
                }
            });
            return nodes;
        }

        function adjustPositionsAfterSequencing(secID, seqQuestions) {
            var untouchedQuestions = [];
            var shuffledQuestions = [];
            var index;
            untouchedQuestions = untouchedQuestions.concat(surveyTree[surveyTreeIndexes[secID]].Children.map(function (c) {
                return c.ID || c.SurveyObjectID;
            }));
            shuffledQuestions = shuffledQuestions.concat(seqQuestions.map(function (c) {
                return c.ID || c.SurveyObjectID;
            }));
            untouchedQuestions.map(function (d, i) {
                if (i == 0) {
                    index = flatQuestionIds.indexOf(d);
                }
                flatQuestionIds[index + i] = shuffledQuestions[i];
            });
        }

        function getDistanceBetweenNodes(node1, node2) {
            if (node1) {
                node1 = node1.split('|')[0];
            }
            if (node2) {
                node2 = node2.split('|')[0];
            }
            var indexOfNode1 = flatQuestionIds.indexOf(node1);
            var indexOfNode2 = flatQuestionIds.indexOf(node2);
            if (indexOfNode1 == -1 || indexOfNode2 == -1) {
                return 0;
            }
            return Math.abs(indexOfNode1 - indexOfNode2) || 0;
        }

        function shuffleNodes(seqId, seqNodes) {
            var sections = surveyTree[surveyTreeIndexes[seqId]].Children;
            var untouchedQuestions = [], shuffledQuestions = [];
            sections.map(function (d) {
                untouchedQuestions = untouchedQuestions.concat(d.Children.map(function (c) {
                    return c.ID || c.SurveyObjectID;
                }));
            });
            seqNodes.map(function (d) {
                shuffledQuestions = shuffledQuestions.concat(d.Children.map(function (c) {
                    return c.ID || c.SurveyObjectID;
                }));
            });
            var index;
            untouchedQuestions.map(function (d, i) {
                if (i == 0) {
                    index = flatQuestionIds.indexOf(d);
                }
                flatQuestionIds[index + i] = shuffledQuestions[i];
            });
        }

        function initProgress(lastID) {
            if (flatQuestionIds.length > 0) {
                setProgress(getDistanceBetweenNodes(flatQuestionIds[0], lastID));
            }
            return setProgress(0);
        }

        function getSequencerNode(id) {
            return surveyTree[surveyTreeIndexes[id]];
        }
    }

})(angular);