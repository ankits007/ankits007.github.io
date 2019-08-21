(function (angular) {

    "use strict";

    angular
        .module("SurveyEngine")
        .controller("Preview.Dialogs.FontColorsController", ['$scope', '$mdDialog', 'PreviewService', 'SurveyEngine.SurveySettings', 'EngineCore.CommunicationService', fontcolorsController]);

    function fontcolorsController($scope, $mdDialog, previewService, surveySettingsService, commService) {
        $scope.backgroundColor = surveySettingsService.GetBackgroundColor();
        $scope.selectionColor = surveySettingsService.GetSelectionColor();
        $scope.choiceColor = surveySettingsService.GetChoiceColor();
        $scope.buttonColor = surveySettingsService.GetButtonColor();
        $scope.questionTextColor = surveySettingsService.GetQuestionTextColor();
        $scope.sectionHeaderColor = surveySettingsService.GetSectionHeaderColor();

        $scope.DisplayRebusCloudLogo = displayRebusCloudLogo;
        $scope.ChangeLogoPosition = changeLogoPosition;
        $scope.mediaList = [];
        $scope.HideRebusCloudLogo = !surveySettingsService.ShowRebusCloudLogo;

        $scope.FontOptions = ["Arial", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Monospace", "MS Sans Serif", "MS Serif", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana","Audi Type","VW Text"];
        $scope.FontSizeOptions = ["70%", "80%", "90%", "100%", "110%", "120%", "130%", "140%", "150%", "160%", "170%",]
        $scope.ProgressBarOptions = ['No Progress Bar', 'With Text', 'Without Text'];
        $scope.FontSelected = surveySettingsService.GetFontFamily();
        $scope.FontSizeSelected = surveySettingsService.GetFontSize();
        $scope.NextButtonText = surveySettingsService.Settings.NavigationButtons.Next;
        $scope.BackButtonText = surveySettingsService.Settings.NavigationButtons.Back;
        $scope.HeaderText = surveySettingsService.Settings.Header;
        $scope.FooterText = surveySettingsService.Settings.Footer;
        $scope.ShowSeperator = surveySettingsService.Settings.ShowSeperator;
        $scope.SelectionType = true;
        $scope.imageModel = {};
        var place = "background";

        $scope.Cancel = function () {
            $mdDialog.cancel();
        }

        $scope.colorChange = function () {
            $scope.textColor = $scope.questionTextColor = getTextColor($scope.backgroundColor);
            surveySettingsService.SetProperties($scope.backgroundColor, $scope.selectionColor, $scope.choiceColor, $scope.buttonColor, $scope.questionTextColor, $scope.sectionHeaderColor, $scope.textColor, $scope.FontSelected, $scope.FontSizeSelected);
        }

        $scope.clickInput = function (id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.click();
            }
        }

        $scope.ApplyFontProperties = function () {
            $mdDialog.hide();
        }


        $scope.ChangeColorTheme = function (colorTheme, event) {
            event.target.className += ' selected';
            if (colorTheme == 'ct1') {
                $scope.backgroundColor = '#5AC4C4';
                $scope.choiceColor = '#EAF9FA';
                $scope.selectionColor = '#02A5A5';
                $scope.buttonColor = '#7E8689';
                $scope.sectionHeaderColor = '#3C454E';
                $scope.questionTextColor = getTextColor($scope.backgroundColor);
                $scope.colorChange();
            }
            if (colorTheme == 'ct2') {
                $scope.backgroundColor = '#f9f9f9';
                $scope.choiceColor = '#dddddd';
                $scope.selectionColor = '#333333';
                $scope.buttonColor = '#777777';
                $scope.sectionHeaderColor = '#333333';
                $scope.questionTextColor = getTextColor($scope.backgroundColor);
                $scope.colorChange();
            }
            if (colorTheme == 'ct3') {
                $scope.backgroundColor = '#9CC5A1';
                $scope.choiceColor = '#DCE1DE';
                $scope.selectionColor = '#216869';
                $scope.buttonColor = '#26A96C';
                $scope.sectionHeaderColor = '#1F2421';
                $scope.questionTextColor = getTextColor($scope.backgroundColor);
                $scope.colorChange();
            }
            if (colorTheme == 'ct4') {
                $scope.backgroundColor = '#E54B4B';
                $scope.choiceColor = '#F7EBE8';
                $scope.selectionColor = '#FFA987';
                $scope.buttonColor = '#646E68';
                $scope.sectionHeaderColor = '#1E1E24';
                $scope.questionTextColor = getTextColor($scope.backgroundColor);
                $scope.colorChange();
            }
            if (colorTheme == 'ct5') {
                $scope.backgroundColor = '#F3F9D2';
                $scope.choiceColor = '#CBEAA6';
                $scope.selectionColor = '#C0D684';
                $scope.buttonColor = '#8F2D56';
                $scope.sectionHeaderColor = '#44001A';
                $scope.questionTextColor = getTextColor($scope.backgroundColor);
                $scope.colorChange();
            }
            if (colorTheme == 'ct6') {
                $scope.backgroundColor = '#FADE8E';
                $scope.choiceColor = '#ffffff';
                $scope.selectionColor = '#FEF5DC';
                $scope.buttonColor = '#F8CD51';
                $scope.sectionHeaderColor = '#C49735';
                $scope.questionTextColor = getTextColor($scope.backgroundColor);
                $scope.colorChange();
            }
        }

        $scope.ChangeSurveyStyle = function (style, event) {
            var liTagContainer = document.getElementsByTagName('li');
            for (var li in liTagContainer) {
                var classList = liTagContainer[li].classList;
                if (classList && classList.contains('selected')) {
                    classList.remove('selected');
                }
            }
            if (style == 'radio_light') {
                event.target.className += ' selected';
                surveySettingsService.Settings.InputButtonType = 1;
                $scope.ChangeColorTheme('ct6');
            }
            else if (style == 'radio_dark') {
                event.target.className += ' selected';
                surveySettingsService.Settings.InputButtonType = 1;
                $scope.ChangeColorTheme('ct3');
            }
            else if (style == 'label_dark') {
                event.target.className += ' selected';
                surveySettingsService.Settings.InputButtonType = 2;
                $scope.ChangeColorTheme('ct3');
            }
            else if (style == 'label_light') {
                event.target.className += ' selected';
                surveySettingsService.Settings.InputButtonType = 2;
                $scope.ChangeColorTheme('ct6');
            }
        }

        $scope.ChangeSurveyTheme = function (themeSelected) {
            surveySettingsService.Settings.SurveyTheme = themeSelected;
        }

        $scope.setStyle = function () {
            $mdDialog.hide();
        }

        $scope.setTheme = function () {
            $mdDialog.hide();
        }

        $scope.OnNextButtonTextChanged = function () {
            surveySettingsService.Settings.NavigationButtons.Next = $scope.NextButtonText;
        }

        $scope.OnBackButtonTextChanged = function () {
            surveySettingsService.Settings.NavigationButtons.Back = $scope.BackButtonText;
        }

        $scope.setLayout = function () {
            $mdDialog.hide();
        }

        $scope.HeaderChanged = function () {
            surveySettingsService.Settings.Header = $scope.HeaderText;
        }

        $scope.FooterChanged = function () {
            surveySettingsService.Settings.Footer = $scope.FooterText;
        }

        $scope.ChangeShowSeperatorState = function () {
            surveySettingsService.Settings.ShowSeperator = $scope.ShowSeperator;
        }

        $scope.SelectMedia = function ($file) {
            $scope.setSelectionType();
            $scope.imageModel.file = $file;
        }

        $scope.setSelectionType = function () {
            $scope.SelectionType = !$scope.SelectionType;
            $scope.imageModel = {};
        }

        $scope.addMediaToAsset = function (imageType) {
            place = imageType;
            $scope.error = false;
            if ($scope.imageModel.file.type == "image/jpeg" || $scope.imageModel.file.type == "image/jpg" || $scope.imageModel.file.type == "image/png") {
                var index = $scope.imageModel.file.name.lastIndexOf('.');
                var len = $scope.imageModel.file.name.length;
                var type = $scope.imageModel.file.name.substr(index, len - index).toLowerCase();
                // var type = '.' + $scope.imageModel.file.name.toLowerCase().split('.')[1];
            }
            else {
                //show error
                $scope.error = true;
                return;
            }

            commService.UploadMedia($scope.imageModel.file, type, place).then(function (response) {
                $scope.flagForSelectedTheme = {};
                var urlForQuesObject = commService.MediaURL + "image/" + place + "/" + response.data;
                //update medialist array
                $scope.mediaList.splice(0, 0, urlForQuesObject);
                if (place == 'logo') {
                    surveySettingsService.LogoPath = $scope.mediaList[0];
                }
                surveySettingsService.ShowCompanyLogo();
                $scope.flagForSelectedTheme[0] = true;
                setSelectionType();
            }, function (err) {
                if (err.status == 415)
                    $scope.error = true;
            });
        }

        $scope.getMedia = function () {
            $scope.mediaList = [];
            commService.GetMediaFiles('image', place).then(function (data) {
                for (var i = 0; i < data.length; i++) {
                    $scope.mediaList.push("https://rebuscodeteststorage.blob.core.windows.net:443/v4publiccontainer/" + data[i]);
                }
            });
        }

        function setSelectionType() {
            $scope.SelectionType = !$scope.SelectionType;
            $scope.imageModel.length = 0;
        }

        function getTextColor(backgroundColor) {
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/ig.test(backgroundColor)) {
                var hex = backgroundColor.substr(1);
                hex = hex.length == 3 ? hex.replace(/(.)/g, '$1$1') : hex;
                var rgb = parseInt(hex, 16);
                var rgb = 'rgb(' + [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255].join(',') + ')';
                rgb = rgb.substring(4, rgb.length - 1).replace(/ /g, '').split(',');
                var c = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';

                if (Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000) > 125) {
                    //condition for bright or light color
                    return "#000"
                } else {
                    return "#f9f9f9"

                }
            }


        }

        function displayRebusCloudLogo() {
            surveySettingsService.ShowRebusCloudLogo = !$scope.HideRebusCloudLogo;
            surveySettingsService.ToggleRebuscloudLogo();
        }

        function changeLogoPosition(position) {
            surveySettingsService.LogoPosition = position;
            surveySettingsService.ChangeLogoPosition();
        }

    }
})(angular);