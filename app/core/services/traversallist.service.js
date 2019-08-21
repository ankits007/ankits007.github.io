(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name module.service:service
     * @requires other
     **/
    angular.module('SurveyEngineCore').factory('EngineCore.TraversalListService', ['$q',
        'SurveyEngine.Enums', 'EngineCore.SurveyTreeService', traversalListService]);

    function traversalListService($q, Enums, SurveyTreeService) {

        var MOVE_FORWARD = 1, MOVE_BACKWARD = -1;
        var currentMove = MOVE_FORWARD;
        var attrPointer;
        var SURVEY_MODE = null;
        var searchIndexes = {};
        var traversalList = [];
        var deletedFlowItems = [], lastRenderedQuestionID, maxAttributesCurrentGrid = 0, attributePosition = -1;

        var factory = {
            MOVE_FORWARD: MOVE_FORWARD,
            MOVE_BACKWARD: MOVE_BACKWARD,
            addToList: addToList,
            deleteFromList: deleteFromList,
            initTraversalList: initTraversalList,
            getTraversalList: getTraversalList,
            getTraversalListPointer: getTraversalListPointer,
            getOrphanVariables: getOrphanVariables,
            getProgress: getProgress,
            getLoopIterations: getLoopIterations,
            getLastTNode: getLastTNode,
            setMovement: setMovement,
            getAttrPointer: getAttrPointer,
            setAttrPointer: setAttrPointer,
            getMovement: getMovement,
            getQids: getQids,
            getLastAnsweredQuestionID : getLastAnsweredQuestionID,
            setLastRenderedQuestion : setLastRenderedQuestion,
            getLastRenderedQuestion : getLastRenderedQuestion,
            getMaxAttributes : getMaxAttributes,
            setMaxAttributes : setMaxAttributes,
            getAttributePosition : getAttributePosition,
            setAttributePosition : setAttributePosition
        }

        return factory;

        ///////////////////////////////////////

        function initTraversalList(list, surveyMode) {
            if (typeof list === 'object') {
                SURVEY_MODE = surveyMode;
                if (SURVEY_MODE == Enums.SurveyMode.Review) {
                    traversalList = [];
                } else {
                    traversalList = list;
                }
                //Generate Hash
            }
        }

        function getTraversalList() {
            return traversalList;
        }

        function getLastTNode() {
            var lastNode = null;
            if (SURVEY_MODE == Enums.SurveyMode.Resume || SURVEY_MODE == Enums.SurveyMode.New || SURVEY_MODE == Enums.SurveyMode.Preview) {
                lastNode = getLastTraversedNode();
            }
            else if (SURVEY_MODE == Enums.SurveyMode.Review) {
                lastNode = getFirstTraversedNode();
            }

            if (lastNode == null)
                return null;
            var newPointer = new NodePointer();
            for (var i in lastNode) {
                newPointer.NodeID = i;
                var parentId = SurveyTreeService.getParentNodeID(i);
                newPointer.ParentNodeID = parentId;
                if (Array.isArray(lastNode[i]) && lastNode[i].length > 0) {
                    newPointer.ChildNodeID = Object.keys(lastNode[i][0])[0];
                }
            }

            return newPointer;
        }

        function getTraversalListPointer() {
            var lastNode = getLastTraversedNode() || null;

            if (lastNode == null)
                return null;

            var newPointer = new NodePointer();
            for (var i in lastNode) {
                newPointer.NodeID = i;
                var parentId = SurveyTreeService.getParentNodeID(i);
                newPointer.ParentNodeID = parentId;
                if (Array.isArray(lastNode[i]) && lastNode[i].length > 0) {
                    newPointer.ChildNodeID = Object.keys(lastNode[i][0])[0];
                }
            }

            return newPointer;
        }

        function addToList(visitedNode, sectionId) {
            // TODO: get sectionID and array of rendered questions
            var index = -1;
            loopNode:
                for (var i = 0; i < traversalList.length; i++) {
                    if (traversalList[i].hasOwnProperty(sectionId)) {
                        // Iterate over questions inside the visited node
                        for (var x = 0; x < visitedNode[sectionId].length; x++) {
                            for (var qId in visitedNode[sectionId][x]) {
                                if (traversalList[i][sectionId][x] && traversalList[i][sectionId][x].hasOwnProperty(qId)) {
                                    index = i;
                                    break loopNode;
                                }
                            }
                        }
                    }
                }
            // if(index === -1)
            if (index === -1 && visitedNode != null) {
                deletedFlowItems.pop();
                traversalList.push(visitedNode);
                searchIndexes[sectionId] = traversalList.length - 1;
            }
        }

        function deleteFromList() {
            deletedFlowItems.push(traversalList.pop());
        }

        function getFirstTraversedNode() {
            if (traversalList.length == 0)
                return null;

            return traversalList[0];
        }

        function getLastTraversedNode() {
            if (traversalList.length == 0)
                return null;

            return traversalList[traversalList.length - 1];
        }

        function getOrphanVariables(startNodeId, endNodeId, childNodeId) {
            var orphanVariables = [];
            var startIndex = -1,
                childIndex = -1,
                endIndex = -1;
            for (var i = 0; i < deletedFlowItems.length; i++) {
                if (deletedFlowItems[i].hasOwnProperty(startNodeId)) {
                    for (var j = 0; j < deletedFlowItems[i][startNodeId].length; j++) {
                        if (deletedFlowItems[i][startNodeId][j].hasOwnProperty(childNodeId)) {
                            startIndex = i;
                            childIndex = j;
                        }
                    }
                }
                if (deletedFlowItems[i].hasOwnProperty(endNodeId)) {
                    endIndex = i;
                    break;
                }
            }
            for (var i = 0; i < deletedFlowItems.length; i++) {
                for (var section in deletedFlowItems[i]) {
                    var questions = deletedFlowItems[i][section][0];
                    for (var variables in questions) {
                        orphanVariables = orphanVariables.concat(questions[variables]);
                    }
                }
            }
            deletedFlowItems = [];
            return orphanVariables;
        }

        function getProgress() {
            var questionsCount = 0;
            for (var i = 0; i < traversalList.length; i++) {
                for (var j in traversalList[i]) {
                    questionsCount += Object.keys(traversalList[i][j]).length;
                }
            }
            return questionsCount;
        }


        function getLoopIterations(sectionId) {
            var iterations = [];
            for (var i = 0; i < traversalList.length; i++) {
                var secNode = traversalList[i];
                for (var sc in secNode) {
                    if (sc == sectionId) {
                        for (var x = 0; x < secNode[sc].length; x++) {
                            for (var q in secNode[sc][x]) {
                                var variables = secNode[sc][x][q];
                                for (var j = 0; j < variables.length; j++) {
                                    var splits = variables[j].split('.');
                                    if (splits.length > 1 && !iterations.hasItem(splits[1])) {
                                        iterations.push(splits[1]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return iterations;
        }

        function setMovement(move) {
            currentMove = move;
        }

        function getMovement() {
            return currentMove;
        }

        function getAttrPointer() {
            return attrPointer;
        }

        function setAttrPointer(ptr) {
            attrPointer = ptr;
        }

        function getQids() {
            var qids = [];
            for (var i = 0; i < traversalList.length; i++) {
                var secNode = traversalList[i];
                for (var sc in secNode) {
                    for (var x = 0; x < secNode[sc].length; x++) {
                        for (var q in secNode[sc][x]) {
                            if (qids.indexOf(q) == -1) {
                                qids.push(q);
                            }
                        }
                    }
                }
            }
            return qids;
        }

        function getLastAnsweredQuestionID() {
            var questionID = null;
            top : for (var i = traversalList.length - 1; i >= 0; i--) {
                var secNode = traversalList[i];
                for (var sc in secNode) {
                    for (var x = 0; x < secNode[sc].length; x++) {
                        for (var q in secNode[sc][x]) {
                            questionID = q;
                            break top;
                        }
                    }
                }
            }
            return questionID;
        }

        function setLastRenderedQuestion(id) {
            lastRenderedQuestionID = id;
        }

        function getLastRenderedQuestion() {
            return lastRenderedQuestionID;
        }

        function getMaxAttributes() {
            return maxAttributesCurrentGrid;
        }

        function setMaxAttributes(attr) {
            maxAttributesCurrentGrid = attr;
        }

        function setAttributePosition(pos) {
            attributePosition = pos;
        }

        function getAttributePosition() {
            return attributePosition;
        }

    }

})(angular);