(function(angular){

    "use strict";

    angular
    .module('SurveyEngine')
    .service("PreviewService", [previewService]);

    function previewService(){
        var vm = this;
        var backgroundColor = '';
        var selectionColor = '';
        var textColor = '';
        var choiceColor = '';
        var nextButton = '>>';
        var backButton = '<<';
        var surveyThemeColor = 'light';

        vm.SetProperties = setProperties;
        vm.GetBackgroundColor = getBackgroundColor;
        vm.GetSelectionColor = getSelectionColor;
        vm.GetTextColor = getTextColor;
        vm.GetChoiceColor = getChoiceColor;
        vm.SetNextButtonText = setNextButtonText;
        vm.GetNextButtonText = getNextButtonText;
        vm.SetBackButtonText = setBackButtonText;
        vm.GetBackButtonText = getBackButtonText;

        function setProperties(backColor, selectColor, optionColor, text){
            backgroundColor = backColor;
            selectionColor = selectColor;
            textColor = optionColor;
            choiceColor = text;
        }

        function getBackgroundColor(){
            return backgroundColor;
        }

        function getSelectionColor(){
            return selectionColor;
        }

        function getChoiceColor(){
            return choiceColor;
        }

        function getTextColor(){
            return textColor;
        }

        function setNextButtonText(text){
            nextButton = text;
        }

        function getNextButtonText(){
            return nextButton;
        }

        function setBackButtonText(text){
            backButton = text;
        }

        function getBackButtonText(){
            return backButton;
        }

    }
})(angular);