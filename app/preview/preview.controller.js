(function(angular) {
    'use strict';
    /**
     * @ngdoc object
     * @name SurveyEngineCore.controller:EngineCore.PreviewController
     * @description This controller is responsible for managing the flow of the survey engine.
     * @requires
     * @requires
     * @requires
     **/
    angular.module('SurveyEngine').controller('SurveyEngine.PreviewController', ['$scope', '$q', '$mdDialog',
        'EngineCore.SurveyTreeService', 'SurveyEngine.Enums', 'PreviewService', 'SurveyEngine.SurveySettings', previewController]);

    function previewController($scope, $q, $mdDialog, SurveyTreeService, Enums, previewService, SurveySettings) {

        $scope.Questions = {};
        $scope.NextButtonText = previewService.GetNextButtonText();
        $scope.BackButtonText = previewService.GetBackButtonText();
        $scope.ScreenSizes = ['PC', 'IPhone 5', 'IPhone SE', 'Android 5 inches', 'Android 6 in +', 'IPad Air/Pro', 'IPad Mini'];
        $scope.ScreenWidth = 'PC';
        $scope.selectedNode = "-1";

        $scope.OpenFontsColorsDialog = openFontsColorsDialog;
        $scope.OpenSurveyStyleDialog = openSurveyStyleDialog;
        $scope.OpenPageLayoutDialog = openPageLayoutDialog;
        $scope.OpenSurveyThemeDialog = openSurveyThemeDialog;
        $scope.ChangeScreenWidth = changeScreenWidth;

        $scope.$on('OnInitPreview', function() {
            SurveyTreeService.load().then(function(tree) {
                $scope.SurveyTree = tree;
                flatTree(tree);
            });
        });

        function getSurveyCSSProperties() {
            $scope.backgroundColor = SurveySettings.GetBackgroundColor();
            $scope.selectionColor = SurveySettings.GetSelectionColor();
            $scope.choiceColor = SurveySettings.GetChoiceColor();
            $scope.buttonColor = SurveySettings.GetButtonColor();
            $scope.questionTextColor = SurveySettings.GetQuestionTextColor();
            $scope.sectionHeaderColor = SurveySettings.GetSectionHeaderColor();
            $scope.sectionHeaderTextColor = SurveySettings.GetSectionHeaderTextColor();
        }

        function flatTree(tree) {
            for (var i = 0; i < tree.length; i++) {
                if (tree[i].IconFlag === Enums.DisplayFlag.Deleted ||
                    tree[i].IconFlag === Enums.DisplayFlag.Hidden ||
                    (tree[i].IconFlag & Enums.DisplayFlag.Deleted) === Enums.DisplayFlag.Deleted ||
                    (tree[i].IconFlag & Enums.DisplayFlag.Hidden) === Enums.DisplayFlag.Hidden) {
                    continue;
                }
                for (var j = 0; j < tree[i].Children.length; j++) {
                    if (tree[i].Children[j].SurveyObjectType === Enums.ObjectType.Question &&
                        tree[i].Children[j].IconFlag !== Enums.DisplayFlag.Deleted &&
                        tree[i].Children[j].IconFlag !== Enums.DisplayFlag.Hidden &&
                        (tree[i].Children[j].IconFlag & Enums.DisplayFlag.Deleted) !== Enums.DisplayFlag.Deleted &&
                        (tree[i].Children[j].IconFlag & Enums.DisplayFlag.Hidden) !== Enums.DisplayFlag.Hidden) {

                        console.log(i, j, tree[i].Children[j].SurveyObjectName);
                        $scope.Questions[tree[i].Children[j].SurveyObjectName] = tree[i].Children[j];
                        $scope.Questions[tree[i].Children[j].SurveyObjectName].ParentID = tree[i].SurveyObjectID;
                    }
                }
            }
        }

        $scope.Jump = function(selected) {
            if (selected == -1)
                return;
            var jumpNode = $scope.Questions[selected];
            var destinationNode = jumpNode;
            var destinationNodeId = jumpNode.ParentID;
            // Cannot JUmp into the Loop so, ignore the Jump
            if (destinationNode.IconFlag === Enums.DisplayFlag.IsLoop) {
                return;
            }
            var nextNodePointer;
            if (destinationNode.SurveyObjectType == Enums.ObjectType.Question) {
                nextNodePointer = new NodePointer(null, destinationNodeId, destinationNode.SurveyObjectID);
            }
            SurveyTreeService.setNextSurveyTreePointer(nextNodePointer);
            $scope.$broadcast('OnNextClick');
        }

        function openFontsColorsDialog() {
            $mdDialog.show({
                controller: "Preview.Dialogs.FontColorsController",
                templateUrl: "./app/preview/dialogs/views/fontscolors.html",
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {},
                clickOutsideToClose: false,
                escapeToClose: true
            })
                .then(setFontColor, closeDialog);

            function setFontColor() {
                SurveySettings.UpdateSurveyProperties();
                $scope.$broadcast('refreshSurvey', {});
            }

            function closeDialog() {
                $mdDialog.cancel();
            }
        }


        function openSurveyStyleDialog() {
            $mdDialog.show({
                controller: "Preview.Dialogs.FontColorsController",
                templateUrl: "./app/preview/dialogs/views/surveystyle.html",
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {},
                clickOutsideToClose: false,
                escapeToClose: true
            })
                .then(setStyle, closeDialog);

            function setStyle() {
                SurveySettings.UpdateSurveyProperties();
                $scope.$broadcast('refreshSurvey', {});
            }
            function closeDialog() {
                $mdDialog.cancel();
            }
        }

        function openPageLayoutDialog() {
            $mdDialog.show({
                controller: "Preview.Dialogs.FontColorsController",
                templateUrl: "./app/preview/dialogs/views/pagelayout.html",
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {},
                clickOutsideToClose: false,
                escapeToClose: true
            })
                .then(setLayout, closeDialog);

            function setLayout() {
                SurveySettings.UpdateSurveyProperties();
                $scope.$broadcast('refreshSurvey', {});
            }
            function closeDialog() {
                $mdDialog.cancel();
            }
        }

        function openSurveyThemeDialog() {
            $mdDialog.show({
                controller: "Preview.Dialogs.FontColorsController",
                templateUrl: "./app/preview/dialogs/views/surveytheme.html",
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {},
                clickOutsideToClose: false,
                escapeToClose: true
            })
                .then(setTheme, closeDialog);

            function setTheme() {
                SurveySettings.UpdateSurveyProperties();
                $scope.$broadcast('refreshSurvey', {});
            }
            function closeDialog() {
                $mdDialog.cancel();
            }
        }

        function changeScreenWidth() {
            // SurveySettings.Settings.ScreenSize = $scope.ScreenWidth;
            switch ($scope.ScreenWidth) {
                case 'IPhone 5':
                    applyCSSProperties('#page', 'width: 290px');
                    applyCSSProperties('#page', 'height: 440px');
                    applyCSSProperties('#page', 'margin: 0 auto');
                    applyCSSProperties('#page', 'margin-top: 10px');
                    SurveySettings.ScreenSize = '440';
                    break;

                case 'IPhone SE':
                    applyCSSProperties('#page', 'width: 378px');
                    applyCSSProperties('#page', 'height: 400px');
                    applyCSSProperties('#page', 'margin: 0 auto');
                    applyCSSProperties('#page', 'margin-top: 10px');
                    SurveySettings.ScreenSize = '400';
                    break;

                case 'Android 5 inches':
                    applyCSSProperties('#page', 'width: 290px');
                    applyCSSProperties('#page', 'height: 500px');
                    applyCSSProperties('#page', 'margin: 0 auto');
                    applyCSSProperties('#page', 'margin-top: 10px');
                    SurveySettings.ScreenSize = '500';
                    break;
                case 'Android 6 in +':
                    applyCSSProperties('#page', 'width: 761px');
                    applyCSSProperties('#page', 'height: 1021px');
                    applyCSSProperties('#page', 'margin: 0 auto');
                    applyCSSProperties('#page', 'margin-top: 10px');
                    SurveySettings.ScreenSize = '1021';
                    break;
                case 'IPad Air/Pro':
                    applyCSSProperties('#page', 'width: 761px');
                    applyCSSProperties('#page', 'height: 1021px');
                    applyCSSProperties('#page', 'margin: 0 auto');
                    applyCSSProperties('#page', 'margin-top: 10px');
                    SurveySettings.ScreenSize = '1021';
                    break;
                case 'PC':
                    applyCSSProperties('#page', 'width: 1000px');
                    applyCSSProperties('#page', 'height: 522px');
                    SurveySettings.ScreenSize = '';
                    break;
            }
            $scope.$broadcast('refreshSurvey', {});
        }

        function applyCSSProperties(selector, style) {
            if (!document.styleSheets) return;
            if (document.getElementsByTagName('head').length == 0) return;
            var styleSheet, mediaType;
            if (document.styleSheets.length > 0) {
                for (var i = 0, l = document.styleSheets.length; i < l; i++) {
                    if (document.styleSheets[i].href && document.styleSheets[i].href.indexOf("engine.css") != -1) {
                        styleSheet = document.styleSheets[i];
                        var media = document.styleSheets[i].media;
                        mediaType = typeof media;
                        break;
                    }
                }
            }
            if (typeof styleSheet === 'undefined') {
                var styleSheetElement = document.createElement('style');
                styleSheetElement.type = 'text/css';
                document.getElementsByTagName('head')[0].appendChild(styleSheetElement);
                for (i = 0; i < document.styleSheets.length; i++) {
                    if (document.styleSheets[i].disabled) {
                        continue;
                    }
                    styleSheet = document.styleSheets[i];
                }
                mediaType = typeof styleSheet.media;
            }
            if (mediaType === 'string') {
                for (var i = 0, l = styleSheet.rules.length; i < l; i++) {
                    if (styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                        styleSheet.rules[i].style.cssText = style;
                        return;
                    }
                }
                styleSheet.addRule(selector, style);
            }
            else if (mediaType === 'object') {
                var styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;
                for (var i = 0; i < styleSheetLength; i++) {
                    if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                        styleSheet.cssRules[i].style.cssText += style;
                        return;
                    }
                }
                styleSheet.insertRule(selector + '{' + style + '}', styleSheetLength);
            }
        }
    }

})(angular);