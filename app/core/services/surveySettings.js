(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .service("SurveyEngine.SurveySettings", ["EngineCore.CommunicationService", "$q", 'SurveyEngine.Enums', surveySettings]);

    function surveySettings(CommunicationService, $q, Enums) {
        var vm = this;
        var nextButton, backButton, surveyProperties = null,
            surveyLanguage;

        vm.QueryParameter = {};

        vm.QuestionPerPage = 2;
        vm.LogoPath = '';
        vm.ShowRebusCloudLogo = true;
        vm.ShowQuestionNumber = true;
        vm.ProgressBarType = Enums.ProgressBar.None;
        vm.LogoPosition = 'bottomMiddle';
        vm.ScreenSize = '';
        vm.RedirectURL = "";
        vm.Settings = {};

        vm.ApplyChanges = applyChanges;
        vm.SetProperties = setProperties;
        vm.GetBackgroundColor = getBackgroundColor;
        vm.GetBackgroundImage = getBackgroundImage;
        vm.GetSelectionColor = getSelectionColor;
        vm.GetTextColor = getTextColor;
        vm.GetChoiceColor = getChoiceColor;
        vm.GetButtonColor = getButtonColor;
        vm.GetButtonTxtColor = getButtonTxtColor;
        vm.GetOptionTextColor = getOptionTextColor;
        vm.GetOptionSelectionColor = getOptionSelectionColor;
        vm.GetOptionSelectionBg = getOptionSelectionBg;
        vm.GetQuestionTextColor = getQuestionTextColor;
        vm.SetNextButtonText = setNextButtonText;
        vm.GetNextButtonText = getNextButtonText;
        vm.SetBackButtonText = setBackButtonText;
        vm.GetBackButtonText = getBackButtonText;
        vm.GetSurveyProperties = getSurveyProperties;
        vm.SetSurveyProperties = setSurveyProperties;
        vm.GetSectionHeaderColor = getSectionHeaderColor;
        vm.GetSectionHeaderTextColor = getSectionHeaderTextColor;
        vm.GetSectionFooterColor = getSectionFooterColor;
        vm.GetQuesFontFamily = getQuesFontFamily;
        vm.GetAnsFontFamily = getAnsFontFamily;
        vm.GetBtnFontFamily = getBtnFontFamily;
        vm.GetQuesFontSize = getQuesFontSize;
        vm.GetAnsFontSize = getAnsFontSize;
        vm.GetBtnFontSize = getBtnFontSize;
        vm.GetSubmitTextColor = getSubmitTextColor;
        vm.GetSubmitBgColor = getSubmitBgColor;
        vm.IsPropertiesStoredLocally = isPropertiesStoredLocally;
        vm.IsMultipleSurveyPreventionEnabled = isMultipleSurveyPreventionEnabled;
        vm.IsSurveyActive = isSurveyActive;
        vm.IsPasswordProtectEnabled = isPasswordProtectEnabled;
        vm.IsLanguageSelectorEnabled = isLanguageSelectorEnabled;
        vm.IsCaptureGPSEnabled = isCaptureGPSEnabled;
        vm.GetSurveyEndText = getSurveyEndText;
        vm.GetSurveyClosedText = getSurveyClosedText;
        vm.GetSurveyFooterText = getSurveyFooterText;
        vm.GetAllLanguages = getAllLanguages;
        vm.GetSurveyLanguage = getSurveyLanguage;
        vm.SetSurveyLanguage = setSurveyLanguage;
        vm.SetAPIPath = setAPIPath;
        vm.IsAllowIfGPSUnavailable = isAllowIfGPSUnavailable;
        vm.GetSurveyTitle = getSurveyTitle;
        vm.GetDefaultLanguage = getDefaultLanguage;
        vm.GetQuesVersion = getQuesVersion;
        vm.UpdateSurveyProperties = updateSurveyProperties;
        vm.UpdateSurveySettings = updateSurveySettings;
        vm.ChangeBackgroundURL = changeBackgroundUrl;
        vm.GetProgressBarProperties = getProgressBarProperties;
        vm.SetPlatform = setPlatform;
        vm.ToggleRebuscloudLogo = toggleRebuscloudLogo;
        vm.ShowCompanyLogo = showCompanyLogo;
        vm.ChangeLogoPosition = changeLogoPosition;
        vm.RemoveSurveyLogo = removeSurveyLogo;
        vm.UpdateProgressBarType = updateProgressBarType;
        vm.GetPanelVariables = getPanelVariables;
        vm.IsEndReviewEnabled = isEndReviewEnabled;
        vm.UpdateQVersion = updateQVersion;
        vm.IsAutoSubmitEnabled = isAutoSubmitEnabled;
        vm.IsBackCheckChangeJumpEnabled = isBackCheckChangeJumpEnabled;
        vm.GetBackCheckJumpNode = getBackCheckJumpNode;
        vm.IsSubmitButtonEnabled = isSubmitButtonEnabled;
        vm.IsLanguageChangeActionEnabled = isLanguageChangeActionEnabled;
        vm.ExecuteCallback = executeCallback;
        vm.GetSurveyLaunchApiPath = getSurveyLaunchApiPath;
        vm.GetSurveyEndApiPath = getSurveyEndApiPath;
        vm.ShowProgressBar = showProgressBar;
        vm.GetLanguageSetting = getLanguageSetting;
        vm.IsThumbsUpAllowed = isThumbsUpAllowed;
        vm.IsSurveyByRebusCloudAllowed = isSurveyByRebusCloudAllowed;
        vm.IsShowProgressBarTextAllowed = isShowProgressBarTextAllowed;
        vm.IsShowFooterLinkAllowed = isShowFooterLinkAllowed;
        vm.GetPlaceholders = getPlaceholders;
        vm.GetButtons= getButtons;
        vm.GetHints = getHints;
        vm.GetErrors = getErrors;
        vm.GetFooterLinkTexts = getFooterLinkTexts;
        vm.GetFooterLinkURLs = getFooterLinkURLs;
        vm.GetStartUpPageProperties = getStartUpPageProperties;
        vm.IsStartupEnabled = isStartupEnabled;
        vm.IsStartUpMediaEnabled = isStartUpMediaEnabled;
        vm.GetStartUpMediaType = getStartUpMediaType;
        vm.IsLogoBasedOnLanguage = isLogoBasedOnLanguage;
        vm.GetAllLogos = getAllLogos;
        vm.SetLogoForLang = setLogoForLang;
        vm.GetLogoPath = getLogoPath;
        vm.GetProgressBarBgColor = getProgressBarBgColor;
        vm.GetProgressColor = getProgressColor;
        vm.GetProgressTextColor = getProgressTextColor;
        vm.GetSmileyColor = getSmileyColor;
        vm.GetThemeTitle = getThemeTitle;
        vm.GetAllVisibleLanguages = getAllVisibleLanguages;
        vm.GetSubmittedButtonText = getSubmittedButtonText;
        vm.GetOptionBgColor = getOptionBgColor;
        vm.GetOptionBorderColor = getOptionBorderColor;
        vm.GetStarColor = getStarColor;
        vm.GetStarSelectionColor = getStarSelectionColor;
        vm.IsSurveyVW = isSurveyVW;
        vm.GetProgressPrefix = getProgressPrefix;
        vm.GetProgressSuffix = getProgressSuffix;

        function setProperties(backColor,backImage, buttonColor,buttonTxtColor, textColor, optionColor, sectionHeaderColor,sectionFooterColor, text, quesFont,ansFont,btnFont, quesFontSize,ansFontSize,btnFontSize,progressBarBgColor,progressColor,progressTextColor,answerSelectionColor,answerSelectionBg,smileyColor,themeTitle,optionBgColor,optionBorderColor,starColor,starSelectionColor,submitTextColor,submitBgColor) {            if (backColor != undefined) {
                vm.Settings.CSSProperties.BackgroundColor = backColor;
            }

            if (backImage != undefined) {
                vm.Settings.CSSProperties.BackgroundImage = backImage;
            }

            if (buttonColor != undefined) {
                vm.Settings.CSSProperties.ButtonsColor = buttonColor;
            }
            if (buttonTxtColor != undefined) {
                vm.Settings.CSSProperties.ButtonsTxtColor = buttonTxtColor;
            }
            if (optionColor != undefined) {
                vm.Settings.CSSProperties.OptionTextColor = optionColor;
            }

            if (textColor != undefined) {
                vm.Settings.CSSProperties.QuestionTextColor = textColor;
            }

            if (sectionHeaderColor != undefined) {
                vm.Settings.CSSProperties.SectionHeaderColor = sectionHeaderColor;
            }
            if (sectionHeaderTextColor != undefined) {
                vm.Settings.CSSProperties.SectionHeaderTextColor = sectionHeaderTextColor;
            }
            if (sectionFooterColor != undefined) {
                vm.Settings.CSSProperties.SectionFooterColor = sectionFooterColor;
            }
            if (text != undefined) {
                vm.Settings.CSSProperties.TextColor = text;
            }

            if (quesFont != undefined) {
                vm.Settings.CSSProperties.QuesFont = quesFont;
            }
            if (ansFont != undefined) {
                vm.Settings.CSSProperties.AnsFont = ansFont;
            }
            if (btnFont != undefined) {
                vm.Settings.CSSProperties.BtnFont = btnFont;
            }
            if (quesFontSize != undefined) {
                vm.Settings.CSSProperties.QuesFontSize = quesFontSize;
            }
            if (ansFontSize != undefined) {
                vm.Settings.CSSProperties.AnsFontSize = ansFontSize;
            }
            if (btnFontSize != undefined) {
                vm.Settings.CSSProperties.BtnFontSize = btnFontSize;
            }
            if (progressBarBgColor != undefined) {
                vm.Settings.CSSProperties.ProgressBarBgColor = progressBarBgColor;
            }
            if (progressColor != undefined) {
                vm.Settings.CSSProperties.ProgressColor = progressColor;
            }
            if (progressTextColor != undefined) {
                vm.Settings.CSSProperties.ProgressTextColor = progressTextColor;
            }
            if (answerSelectionColor != undefined) {
                vm.Settings.CSSProperties.AnswerSelectionColor = answerSelectionColor;
            }
            if (answerSelectionBg != undefined) {
                vm.Settings.CSSProperties.AnswerSelectionBg = answerSelectionBg;
            }
            if (smileyColor != undefined) {
                vm.Settings.CSSProperties.SmileyColor = smileyColor;
            }
            if (themeTitle != undefined) {
                vm.Settings.CSSProperties.ThemeTitle = themeTitle;
            }
            if (optionBgColor != undefined) {
                vm.Settings.CSSProperties.OptionBgColor = optionBgColor;
            }
            if (optionBorderColor != undefined) {
                vm.Settings.CSSProperties.OptionBorderColor = optionBorderColor;
            }
            if (starColor != undefined) {
                vm.Settings.CSSProperties.StarColor = starColor;
            }
            if (starSelectionColor != undefined) {
                vm.Settings.CSSProperties.StarSelectionColor = starSelectionColor;
            }
            if (submitTextColor != undefined) {
                vm.Settings.CSSProperties.SubmitTextColor = submitTextColor;
            }
            if (submitBgColor != undefined) {
                vm.Settings.CSSProperties.SubmitBgColor = submitBgColor;
            }
        }
        function updateSurveyProperties() {
            CommunicationService.UpdateSurveyProperties(surveyProperties).then(function () {
                console.log('Survey Properties Updated');
            }, function (err) {
                console.log('Updating Properties failed');
            });
        }

        function getBackgroundColor() {
            return vm.Settings.CSSProperties.BackgroundColor;
        }
        function getBackgroundImage() {
            return vm.Settings.CSSProperties.BackgroundImage;
        }
        function getSelectionColor() {
            return vm.Settings.CSSProperties.SelectionColor;
        }

        function getChoiceColor() {
            return vm.Settings.CSSProperties.ChoiceColor;
        }

        function getTextColor() {
            return vm.Settings.CSSProperties.TextColor;
        }

        function getButtonColor() {
            return vm.Settings.CSSProperties.ButtonsColor;
        }
        function getButtonTxtColor() {
            return vm.Settings.CSSProperties.ButtonsTxtColor;
        }
        function getOptionTextColor() {
            return vm.Settings.CSSProperties.OptionTextColor;
        }

        function getQuestionTextColor() {
            return vm.Settings.CSSProperties.QuestionTextColor;
        }

        function getSectionHeaderColor() {
            return vm.Settings.CSSProperties.SectionHeaderColor;
        }
        function getSectionHeaderTextColor() {
            return vm.Settings.CSSProperties.SectionHeaderTextColor;
        }
        function getSectionFooterColor() {
            return vm.Settings.CSSProperties.SectionFooterColor;
        }
        function getProgressBarBgColor() {
            return vm.Settings.CSSProperties.ProgressBarBgColor;
        }
        function getProgressColor() {
            return vm.Settings.CSSProperties.ProgressColor;
        }
        function getProgressTextColor() {
            return vm.Settings.CSSProperties.ProgressTextColor;
        }
        function getOptionSelectionColor() {
            return vm.Settings.CSSProperties.AnswerSelectionColor;
        }
        function getOptionSelectionBg() {
            return vm.Settings.CSSProperties.AnswerSelectionBg;
        }
        function getSmileyColor() {
            return vm.Settings.CSSProperties.SmileyColor;
        }
        function getThemeTitle() {
            return vm.Settings.CSSProperties.ThemeTitle;
        }
        function getOptionBgColor() {
            return vm.Settings.CSSProperties.OptionBgColor;
        }
        function getOptionBorderColor() {
            return vm.Settings.CSSProperties.OptionBorderColor;
        }
        function getStarColor() {
            return vm.Settings.CSSProperties.StarColor;
        }
        function getStarSelectionColor() {
            return vm.Settings.CSSProperties.StarSelectionColor;
        }
        function getSubmitTextColor() {
            return vm.Settings.CSSProperties.SubmitTextColor;
        }
        function getSubmitBgColor() {
            return vm.Settings.CSSProperties.SubmitBgColor;
        }
        function setNextButtonText(text) {
            nextButton = text;
        }

        function getNextButtonText() {
            return nextButton;
        }

        function setBackButtonText(text) {
            backButton = text;
        }

        function getBackButtonText() {
            return backButton;
        }

        function setHeaderText() {
            return vm.Settings.Header;
        }

        function setFooterText() {
            return vm.Settings.Footer;
        }

        function getHeaderText() {
            return vm.Settings.Header;
        }

        function getFooterText() {
            return vm.Settings.Footer;
        }

        function getProgressBarProperties() {
            var obj = {
                Bar: true,
                Text: false
            };
            if (vm.ProgressBarType == Enums.ProgressBar.None) {
                obj.Bar = false
            }
            if (vm.ProgressBarType == Enums.ProgressBar.WithText) {
                obj.Text = true;
            }

            return obj;
        }

        function getProgressPrefix() {
            return  surveyProperties.ProgressText1[getSurveyLanguage()] || surveyProperties.ProgressText1[getDefaultLanguage()];
        }

        function getProgressSuffix() {
            return  surveyProperties.ProgressText2[getSurveyLanguage()] || surveyProperties.ProgressText2[getDefaultLanguage()];
        }

        function isPropertiesStoredLocally() {
            // Only Check for locally stored survey if it is anonymous and resumed.
            if ((vm.QueryParameter.Channel == Enums.Channel.AnonymousLink || vm.QueryParameter.Channel == Enums.Channel.AnonymousEmailCampaignLink ||
                vm.QueryParameter.Channel == Enums.Channel.AnonymousSMSCampaignLink || vm.QueryParameter.Channel == Enums.Channel.FacebookLink ||
                vm.QueryParameter.Channel == Enums.Channel.TwitterLink || vm.QueryParameter.Channel == Enums.Channel.LinkedinLink ||
                vm.QueryParameter.Channel == Enums.Channel.GooglePlusLink || vm.QueryParameter.Channel == Enums.Channel.PanelLink) &&
                (vm.QueryParameter.Mode != Enums.SurveyMode.Preview && vm.QueryParameter.Mode != Enums.SurveyMode.Review &&
                    vm.QueryParameter.Mode != Enums.SurveyMode.View) &&
                localStorage.getItem(vm.QueryParameter.ProjectGUID) != null) {

                if (surveyProperties == null)
                    surveyProperties = JSON.parse(localStorage.getItem(vm.QueryParameter.ProjectGUID));

                return true;
            }
            return false;
        }

        function isMultipleSurveyPreventionEnabled() {
            return surveyProperties.PreventMultipleSurveys;
        }

        function isSurveyActive(campID) {
            var deferred = $q.defer();
            if (CommunicationService.PLATFORM == CommunicationService.WEB) {
                CommunicationService.IsSurveyActive(campID).then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    deferred.reject(err);
                });
            } else {
                setTimeout(function () {
                    deferred.resolve();
                });
            }
            return deferred.promise;
        }

        function isPasswordProtectEnabled() {
            if (CommunicationService.PLATFORM === CommunicationService.WEB) {
                return surveyProperties.PasswordProtectAnonymousSurveys;
            } else {
                return false;
            }
        }

        function isLanguageSelectorEnabled() {
            return surveyProperties.SelectLanguage;
        }

        function isCaptureGPSEnabled() {
            return surveyProperties.CaptureOnlineGPS && CommunicationService.PLATFORM == CommunicationService.WEB;
        }

        function setSurveyProperties(prop, isPreview) {
            surveyProperties = prop;
            var quesVer = parseInt(surveyProperties.ActiveQuestionnaireVersion);
            if (isPreview) {
                // In case of preview the questionnaire version will be 1 more than the active version.
                surveyProperties.ActiveQuestionnaireVersion = surveyProperties.ActiveQuestionnaireVersion + 1;
                CommunicationService.UpdateSurveyAPI(quesVer + 1);
            } else {
                if (CommunicationService.PLATFORM === CommunicationService.WEB) {
                    localStorage.setItem(vm.QueryParameter.ProjectGUID, JSON.stringify(prop));
                    CommunicationService.UpdateSurveyAPI(quesVer);
                }
            }
            vm.Settings = surveyProperties.SurveySettings;
            vm.IsBackButtonDisable = surveyProperties.DisableBackButton;
            if (surveyProperties.QuestionsPerPage != undefined) {
                vm.QuestionPerPage = surveyProperties.QuestionsPerPage;
            }
            if (surveyProperties.ShowRebusCloudLogo != undefined) {
                vm.ShowRebusCloudLogo = surveyProperties.ShowRebusCloudLogo;
            }
            // if (surveyProperties.LogoPath != "") {
            vm.LogoPath = surveyProperties.LogoPath;
            vm.LogoPosition = surveyProperties.LogoPosition;
            vm.RedirectURL = surveyProperties.RedirectURL;
            //  }
            if (surveyProperties.ShowQuestionNo != undefined) {
                vm.ShowQuestionNumber = surveyProperties.ShowQuestionNo;
            }
            if (surveyProperties.ProgressBarType != undefined) {
                vm.ProgressBarType = surveyProperties.ProgressBarType;
            }
            // Set title of the Web Page
            document.title = getSurveyTitle()
        }

        function updateQVersion(version) {
            surveyProperties.ActiveQuestionnaireVersion = version;
            CommunicationService.UpdateSurveyAPI(version);
        }

        function updateSurveySettings(SurveySettings) {
            vm.Settings = SurveySettings;
        }

        function getSurveyTitle() {
            return surveyProperties.SurveyTitle;
        }

        function getQuesVersion() {
            return surveyProperties.ActiveQuestionnaireVersion;
        }

        function getSurveyEndText() {
            if (surveyProperties.EndOfSurveyMessage) {
                var surveyLang = getSurveyLanguage();
                if (typeof surveyProperties.EndOfSurveyMessage.Messages === "object" && surveyProperties.EndOfSurveyMessage.Messages.hasOwnProperty(surveyLang)) {
                    return surveyProperties.EndOfSurveyMessage.Messages[surveyLang];
                } else {
                    return surveyProperties.EndOfSurveyMessage.Messages[getDefaultLanguage()];
                }
            }
            return "Survey End"; // Default in case end message is not present.
        }

        function getSurveyClosedText() {
            if (surveyProperties.ClosedSurveyMessage) {
                var surveyLang = getSurveyLanguage();
                if (typeof surveyProperties.ClosedSurveyMessage.Messages === "object" && surveyProperties.ClosedSurveyMessage.Messages.hasOwnProperty(surveyLang)) {
                    return surveyProperties.ClosedSurveyMessage.Messages[surveyLang];
                } else {
                    return surveyProperties.ClosedSurveyMessage.Messages[getDefaultLanguage()];
                }
            }
            return "This survey is inactive."; // Default in case end message is not active.
        }

        function getSurveyFooterText() {
            if (surveyProperties.FooterOfSurveyMessage) {
                var surveyLang = getSurveyLanguage();
                if (typeof surveyProperties.FooterOfSurveyMessage.Messages === "object" && surveyProperties.FooterOfSurveyMessage.Messages.hasOwnProperty(surveyLang)) {
                    return surveyProperties.FooterOfSurveyMessage.Messages[surveyLang];
                } else {
                    return surveyProperties.FooterOfSurveyMessage.Messages[getDefaultLanguage()];
                }
            }
            return "Please add footer text"; // Default in case end message is not active.
        }

        function getAllLanguages() {
            return surveyProperties.Languages;
        }

        function getAllVisibleLanguages() {
            var visibleLanguges = {};
            for(var i in surveyProperties.Languages){
                if(typeof surveyProperties.VisibleLanguages === "object" && surveyProperties.VisibleLanguages.hasOwnProperty(i)){
                    if(surveyProperties.VisibleLanguages[i]){
                        visibleLanguges[i] = surveyProperties.Languages[i];
                    }
                }else{
                    visibleLanguges[i] = surveyProperties.Languages[i];
                }
            }
            return visibleLanguges;
        }

        function getSurveyLanguage() {
            return surveyLanguage || surveyProperties.DefaultLanguage;
        }

        function getDefaultLanguage() {
            return surveyProperties.DefaultLanguage;
        }

        function setSurveyLanguage(lang) {
            // If the language is in the survey properties means it is added by the user in the survey then only set it survey language
            // else set default language
            if (lang in surveyProperties.Languages) {
                surveyLanguage = lang;
            } else {
                surveyLanguage = surveyProperties.DefaultLanguage;
            }
        }

        function setAPIPath() {
            CommunicationService.UpdateAPIPath(vm.QueryParameter.ProjectGUID, vm.QueryParameter.SubscriptionID);
        }

        function isAllowIfGPSUnavailable() {
            return surveyProperties.AllowOnlineSurveyIfGPSUnavailable;
        }

        function getSurveyProperties(isNewProperty) {
            var deferred = $q.defer();
            if (CommunicationService.PLATFORM == CommunicationService.WEB && !isNewProperty && isPropertiesStoredLocally()) {
                deferred.resolve(JSON.parse(localStorage.getItem(vm.QueryParameter.ProjectGUID)));
            } else {
                CommunicationService.GetSurveyProperties().then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    deferred.reject(err);
                });
            }
            return deferred.promise;
        }


        function getQuesFontFamily() {
            if (vm.Settings.CSSProperties.QuesFont != '')
                return vm.Settings.CSSProperties.QuesFont;
            else
                return '';
        }
        function getAnsFontFamily() {
            if (vm.Settings.CSSProperties.AnsFont != '')
                return vm.Settings.CSSProperties.AnsFont;
            else
                return '';
        } function getBtnFontFamily() {
            if (vm.Settings.CSSProperties.BtnFont != '')
                return vm.Settings.CSSProperties.BtnFont;
            else
                return '';
        }
        function getQuesFontSize() {
            if (vm.Settings.CSSProperties.QuesFontSize != '')
                return vm.Settings.CSSProperties.QuesFontSize;
            else
                return '';
        }
        function getAnsFontSize() {
            if (vm.Settings.CSSProperties.AnsFontSize != '')
                return vm.Settings.CSSProperties.AnsFontSize;
            else
                return '';
        }
        function getBtnFontSize() {
            if (vm.Settings.CSSProperties.BtnFontSize != '')
                return vm.Settings.CSSProperties.BtnFontSize;
            else
                return '';
        }
        function getNPSBorderColor() {
            if (vm.Settings.CSSProperties.NPSBorder != '')
                return vm.Settings.CSSProperties.NPSBorder;
            else
                return '';
        }
        function changeBackgroundUrl(url) {
            // if (vm.Settings.SurveyTheme != '') {
            //     applyCSSProperties('#page', 'background: transparent');
            //     applyCSSProperties('.theme-user', 'background: url("' + vm.Settings.SurveyTheme + '") no-repeat!important; background-size: cover!important;max-width:100%;background-position:center center!important')
            // }
        }

        //Functions to get and then change the CSS properties of both preview and actual survey
        function applyChanges() {
            var cssProperties = vm.Settings.CSSProperties;
            try{
                if (cssProperties.BackgroundColor != '') {
                    applyCSSProperties('#page,.modal-body', 'background-color: ' + cssProperties.BackgroundColor);
                    applyCSSProperties('.form-checkbox input:checked+.form-icon::before', 'border-color: ' + (cssProperties.BackgroundColor) + '!important');
                    applyCSSProperties('.survey-bottomHdr', 'background-color: ' + (cssProperties.BackgroundColor) + '!important');
                    document.getElementById("page").removeAttribute("style");
                    applyCSSProperties('.imgOption li .icon-check:before', 'border-color :' + (cssProperties.BackgroundColor))
                    applyCSSProperties('.message span', 'color: ' + (cssProperties.BackgroundColor) + '!important');
                }
                if (cssProperties.BackgroundImage != '') {
                    applyCSSProperties('#page', 'background-size: cover;background-repeat: no-repeat;background-image: url("' + cssProperties.BackgroundImage+'")');
                }
                // if (cssProperties.SelectionColor != '') {
                //     applyCSSProperties('.option-checked', 'border:1px solid ' + cssProperties.SelectionColor + '!important;background-color:transparent!important;font-weight:500!important;outline:none;');
                // }
                if (cssProperties.ButtonsColor != '') {
                    applyCSSProperties('.prev-next,.captureMediaBtn,.btnOTP', 'background-color: ' + (cssProperties.ButtonsColor) + '!important;');
                    applyCSSProperties('.button.nav,.button.general', 'background-color:' + (cssProperties.ButtonsColor) + '!important');
                    applyCSSProperties('.footerLinks li a,.start-up-wrapper .prev-next', 'background-color:' + (cssProperties.ButtonsColor) + '!important');

                }
                if (cssProperties.ButtonsTxtColor != '') {
                    applyCSSProperties('.prev-next,.captureMediaBtn,.btnOTP', 'color: ' + (cssProperties.ButtonsTxtColor) + '!important;');
                    applyCSSProperties('.button.nav,.button.general', 'color: ' + (cssProperties.ButtonsTxtColor) + '!important');
                    applyCSSProperties('.captureMediaBtn', 'border-color: ' + (cssProperties.ButtonsTxtColor) + '!important');
                    applyCSSProperties('.start-up-wrapper .prev-next', 'color: ' + (cssProperties.ButtonsTxtColor) + '!important');
                }
                if (cssProperties.OptionTextColor != '') {
                    applyCSSProperties('.fa.fa-star-o,.fa.fa-star,.option-checked .icon-check,.survey-title-text-color ,.icon.icon-forward,.endMsg,.rating-option .fa.back,.text,.rating-label,.btn.btn-primary,.none-div,#rebusText,.nps-box,.grid-txt,.sv-container', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('.survey-option-text,.dark-text #rankList1 li,.dragHere', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('.imgOption li .icon-check', 'color: ' + hexToRgb(cssProperties.OptionTextColor) + '!important');
                    applyCSSProperties('.grid-text-color', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('#page .form-checkbox .form-icon,.darkBdr', 'border: 1px solid ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('#page .form-radio .form-icon', 'border: 1px solid ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('#page input', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('#page textarea', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('.choose-lang', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('.max-min', 'color: ' + cssProperties.OptionTextColor + '!important');
                    applyCSSProperties('#page .input-txt', 'border: 1px solid ' + hex2rgb(cssProperties.OptionTextColor, .8) + '!important;outline:none;border-radius:3px;')
                    applyCSSProperties('#page .input-txt.border-red', 'border-bottom-color:red !important;outline:none;border-radius:3px;')
                    applyCSSProperties('#page .input-txt.color-green', 'color:green !important')
                    applyCSSProperties('.none-div', 'border: 1px solid ' + hex2rgb(cssProperties.OptionTextColor, .8) + '!important;outline:none;border-radius:2px;')
                    applyCSSProperties('span:last-child .none-div', 'border-right: 1px solid' + hex2rgb(cssProperties.OptionTextColor, .8) + '!important;')
                    applyCSSProperties('#page .input-txt,#page input[type="number"],#page .dropdown', 'border: 1px solid ' + hex2rgb(cssProperties.OptionTextColor, .8) + '!important;border-top-width:0px!important;border-left-width:0px!important;border-right-width:0px!important;;border-bottom-width:1px!important')
                    applyCSSProperties('.qGird-table .handsontable tr td:first-child,.qGrid-cell-border,#page .group-seperator,.max-diffTable td:nth-child(1)', 'border-right: 1px solid ' + cssProperties.OptionTextColor + '!important')
                    applyCSSProperties('.qGrid-border-bot,.grid-var-header td', 'border-bottom: 1px solid ' + cssProperties.OptionTextColor + '!important')
                    // applyCSSProperties('.dark-text .language', 'border: 1px solid ' + cssProperties.OptionTextColor + '!important')
                    applyCSSProperties('.btn.btn-primary,.group-container', 'border-color: ' + hex2rgb(cssProperties.OptionTextColor, .8) + '!important')
                    applyCSSProperties('.bg', 'border:1px solid ' + cssProperties.OptionTextColor + '!important')
                    applyCSSProperties('.form-radio input:checked + .form-icon', 'background-color:' + cssProperties.OptionTextColor + '!important')
                    applyCSSProperties('.on-hover:hover', 'color: ' + hexToRgb(cssProperties.OptionTextColor) + '!important');
                    applyCSSProperties('#page .opt,.rz-bubble', 'color: ' + (cssProperties.OptionTextColor) + '!important');
                    applyCSSProperties('#page .select-box .opt', 'color: #000!important');
                    // applyCSSProperties('.button.nav,.button.general,.button.navend', 'color: ' + (cssProperties.OptionTextColor) + '!important;background-color:' + hex2rgb(cssProperties.OptionTextColor,.4) + '!important');
                    applyCSSProperties('.nps-box:hover,.none-div:hover,.btn.btn-primary', 'background-color: ' + hex2rgb(cssProperties.OptionTextColor,.2)+ '!important');
                    applyCSSProperties('#page table tr:not(.no-hover-effect):hover ', 'background-color: ' + hex2rgb(cssProperties.OptionTextColor,.2) + '!important');
                    applyCSSProperties('.persistent.background,.rzslider .rz-pointer', 'background-color: ' + (cssProperties.OptionTextColor) + '!important');
                    applyCSSProperties('.rzslider .rz-bubble.rz-limit', 'color: ' + (cssProperties.OptionTextColor) + '!important');
                    applyCSSProperties('.rzslider .rz-bar', 'background-color:' + hex2rgb(cssProperties.OptionTextColor, 0.4) + '!important;')
                    applyCSSProperties('.star-default', 'background-color:' + cssProperties.OptionTextColor + '!important;')
                    // applyCSSProperties('.ques-count', 'color:' + cssProperties.OptionTextColor + '!important;')
                    applyCSSProperties('.comp-name', 'background-color:' + hex2rgb(cssProperties.OptionTextColor, .6) + '!important;color:' + cssProperties.OptionTextColor)
                    applyCSSProperties('#page .input-txt.border-all,#page input[type="number"].border-all', 'border: 1px solid ' + hex2rgb(cssProperties.OptionTextColor, .8) + '!important;border-top-width:1px!important;border-left-width:1px!important;border-right-width:1px!important;;border-bottom-width:1px!important;padding:5px;')
                    applyCSSProperties('.imgOption li .tick-wrapper', 'border-color: transparent ' + (cssProperties.OptionTextColor) + ' transparent transparent!important;')
                    applyCSSProperties('.input-wrapper .triangle span', 'border-top: 8px solid ' + (cssProperties.OptionTextColor) + '!important;')
                    applyCSSProperties('.input-wrapper input,.input-wrapper input:focus', 'border-bottom-color:' + (cssProperties.OptionTextColor) + '!important;')
                    applyCSSProperties(' .stkv-us-secondary-color--fill-checked.is-checked', 'fill :' + (cssProperties.OptionTextColor))
                    applyCSSProperties('.otherInput', 'border-color :' + (cssProperties.OptionTextColor) + '!important;')
                    applyCSSProperties('.message', 'background-color:' + (cssProperties.OptionTextColor) + '!important');
                    applyCSSProperties('.message div', 'border-bottom-color:' + (cssProperties.OptionTextColor) + '!important');
                    // applyCSSProperties('.no-answer .survey-option-text,.noAnswer .survey-option-text', 'color:' + hex2rgb(cssProperties.OptionTextColor,.6) + '!important');
                    applyCSSProperties('.no-answer .option-as-label,.noAnswer .option-as-label', 'border-color:' + hex2rgb(cssProperties.OptionTextColor,.6) + '!important');


                }
                if (cssProperties.SectionHeaderColor != '') {
                    applyCSSProperties('.section-header', 'color: ' + hexToRgb(cssProperties.SectionHeaderColor) + '!important');
                    applyCSSProperties('.hdrLayout', 'background-color: ' + (cssProperties.SectionHeaderColor) + '!important');
                }

                if (cssProperties.SectionFooterColor != '') {
                    applyCSSProperties('.survey-bottomHdr', 'background-color: ' + (cssProperties.SectionFooterColor) + '!important');
                }
                if (cssProperties.QuesFont != '') {
                    applyCSSProperties('#page', 'font-family: ' + cssProperties.QuesFont + '!important');
                    applyCSSProperties('#page option', 'font-family: ' + cssProperties.QuesFont + '!important');
                    applyCSSProperties('#page input[type="text"]', 'font-family: ' + cssProperties.QuesFont + '!important');
                }
                if (cssProperties.AnsFont != '') {
                    applyCSSProperties('.option-as-label,#blinkingHint,textarea,.button.navend,.ratingCircle-txt', 'font-family: ' + cssProperties.AnsFont + '!important');
                }
                if (cssProperties.BtnFont != '') {
                    applyCSSProperties('.prev-next', 'font-family: ' + cssProperties.BtnFont + '!important');
                }
                if (cssProperties.QuesFontSize != '') {
                    applyCSSProperties('#page', 'font-size: ' + cssProperties.QuesFontSize + 'px!important');
                    applyCSSProperties('#page option', 'font-size: ' + cssProperties.QuesFontSize + 'px!important');
                    applyCSSProperties('#page input[type="text"]', 'font-size: ' + cssProperties.QuesFontSize + 'px!important');
                }
                if (cssProperties.AnsFontSize != '') {
                    applyCSSProperties('.option-as-label,#blinkingHint,#page input[type="text"],textarea,#page input[type="number"],.htCore', 'font-size: ' + cssProperties.AnsFontSize + 'px!important');
                    applyCSSProperties('#page input[type="text"].otherOption', 'font-size: ' + (cssProperties.AnsFontSize*0.8) + 'px!important');
                }
                if (cssProperties.BtnFontSize != '') {
                    applyCSSProperties('.prev-next', 'font-size: ' + cssProperties.BtnFontSize + 'px!important');
                }

                if (cssProperties.BackgroundColor != '') {
                    applyCSSProperties('.rzslider .rz-pointer:after ', 'background-color: ' + (cssProperties.BackgroundColor) + '!important');
                    // applyCSSProperties('.nps-box.nps-background', 'color: ' + (cssProperties.BackgroundColor) + '!important');

                }
                if (cssProperties.QuestionTextColor != '') {
                    applyCSSProperties('.sq-text,.btn.btn-link,.survey-title-text-color,.sq-name,.section-header', 'color: ' + (cssProperties.QuestionTextColor) + '!important');
                }
                if (cssProperties.ProgressBarBgColor != '') {
                    applyCSSProperties('.ques-bar', 'background-color: ' + (cssProperties.ProgressBarBgColor) + '!important');
                }
                if (cssProperties.ProgressColor != '') {
                    applyCSSProperties('.ques-progress', 'background-color: ' + (cssProperties.ProgressColor) + '!important');
                }
                if (cssProperties.ProgressTextColor != '') {
                    applyCSSProperties('.ques-count', 'color: ' + (cssProperties.ProgressTextColor) + '!important');

                }
                if (cssProperties.AnswerSelectionBg != '') {
                    applyCSSProperties('.option-checked .bg', 'background-color: ' + (cssProperties.AnswerSelectionBg) + '!important;opacity:1!important');
                    applyCSSProperties('.nps-box.nps-background:hover,.none-div-background', 'background-color: ' + (cssProperties.AnswerSelectionBg) + '!important');
                    applyCSSProperties('.form-checkbox input:checked + .form-icon', 'border-color: ' + (cssProperties.AnswerSelectionBg) + '!important');
                    applyCSSProperties('.button.navend.surveySubmitted,.form-checkbox input:checked + .form-icon', 'background-color:' + (cssProperties.AnswerSelectionBg) + '!important;opacity:0.7!important');
                    applyCSSProperties('.bg:hover,.imgContent:hover', 'background-color:' + hex2rgb(cssProperties.AnswerSelectionBg,.2) + '!important;opacity:1!important');
                    applyCSSProperties('.ratingShape:hover circle', 'stroke:' + (cssProperties.AnswerSelectionBg) + '!important;');
                    applyCSSProperties('.nps-star:hover .stkv-us-secondary--fill', 'fill:' + hex2rgb(cssProperties.AnswerSelectionBg) + '!important;opacity:1!important');

                }

                if (cssProperties.AnswerSelectionColor != '') {
                    applyCSSProperties('.option-checked .survey-option-text,.option-checked .icon-check,.none-div-background', 'color: ' + (cssProperties.AnswerSelectionColor) + '!important');
                    applyCSSProperties('.option-checked .icon-check::before', 'border-color: ' + (cssProperties.AnswerSelectionColor) + '!important');

                }
                if (cssProperties.SmileyColor != '') {
                    applyCSSProperties('.smiley-img-hover circle:first-child', 'stroke: ' + (cssProperties.SmileyColor) + '!important');
                    applyCSSProperties('.smiley-img-hover circle:nth-child(2),.smiley-img-hover circle:nth-child(3)', 'fill: ' + (cssProperties.SmileyColor) + '!important');
                    applyCSSProperties('.smiley-img-hover path', 'stroke: ' + (cssProperties.SmileyColor) + '!important');
                    applyCSSProperties('.nps-background', 'background-color: ' + (cssProperties.SmileyColor) + '!important');

                }
                if (cssProperties.OptionBgColor != '') {
                    applyCSSProperties('.bg,.dragHere', 'background-color: ' + (cssProperties.OptionBgColor) + '!important;opacity:1');
                }
                if (cssProperties.OptionBorderColor != '') {
                    applyCSSProperties('.option-as-label,.imgOption li .imgContent,.dragHere,.bg,textarea.border-all', 'border-color: ' + (cssProperties.OptionBorderColor) + '!important');

                }
                if (cssProperties.StarColor != '') {
                    applyCSSProperties('.stkv-us-secondary--fill', 'fill: ' + (cssProperties.StarColor) + '!important');
                    applyCSSProperties('.smiley circle:first-child', 'stroke: ' + (cssProperties.StarColor) );
                    applyCSSProperties('.smiley circle:nth-child(2),.smiley circle:nth-child(3)', 'fill: ' + (cssProperties.StarColor));
                    applyCSSProperties('.smiley path', 'stroke: ' + (cssProperties.StarColor) );
                    applyCSSProperties('.npsCircle circle', 'stroke: ' + (cssProperties.StarColor) + '!important');
                    applyCSSProperties('.npsCircle + span,.nps-star span', 'color: ' + (cssProperties.StarColor) + '!important');

                }
                if (cssProperties.StarSelectionColor != '') {
                    applyCSSProperties('.stkv-us-secondary-color--fill-checked', 'fill: ' + (cssProperties.StarSelectionColor) + '!important');
                    applyCSSProperties('.svg-filled + span', 'color: ' + (cssProperties.StarSelectionColor) + '!important');
                    applyCSSProperties('.svg-filled.npsCircle circle', 'stroke: ' + (cssProperties.StarSelectionColor) + '!important');
                    }
                if (cssProperties.SectionHeaderTextColor != '') {
                    applyCSSProperties('.btn.btn-link,.survey-title-text-color', 'color: ' + (cssProperties.SectionHeaderTextColor) + '!important');
                }
                if (cssProperties.SubmitTextColor != '') {
                    applyCSSProperties('.button.navend', 'color: ' + (cssProperties.SubmitTextColor) + '!important');
                     }
                if (cssProperties.SubmitBgColor != '') {
                        applyCSSProperties('.button.navend', 'background-color: ' + (cssProperties.SubmitBgColor) + '!important');
                }
                if (cssProperties.NPSBackground != '') {
                    applyCSSProperties('.nps-box.nps-background', 'background-color: ' + (cssProperties.NPSBackground) + '!important');
                }
                if (cssProperties.NPSBorder != '') {
                    applyCSSProperties('.nps-box.nps-background', 'border-color: ' + (cssProperties.NPSBorder) + '!important');
                }
                if (cssProperties.NPSText != '') {
                    applyCSSProperties('.nps-box.nps-background', 'color: ' + (cssProperties.NPSText) + '!important');
                }

            } catch (e) {
                console.error(e);
            }
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
            } else if (mediaType === 'object') {
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
        // Convert Hex to Rgb + opacity
        function hex2rgb(hex, opacity) {
            if (!hex )
                return;
            if (hex.indexOf("#") > -1){
                var h = hex.replace('#', '');
                h = h.match(new RegExp('(.{' + h.length / 3 + '})', 'g'));

                for (var i = 0; i < h.length; i++)
                    h[i] = parseInt(h[i].length == 1 ? h[i] + h[i] : h[i], 16);

                if (typeof opacity != 'undefined') h.push(opacity);

                return 'rgba(' + h.join(',') + ')';
            }
        }

        // color change with respect to background
        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result != null) {
                if (result[1] != "00") {
                    var r = parseInt(result[1], 16);
                } else {
                    var r = 0;
                }
                if (result[2] != "00") {
                    var g = parseInt(result[2], 16);
                } else {
                    var g = 0;
                }
                if (result[3] != "00") {
                    var b = parseInt(result[3], 16);
                } else {
                    var b = 0;
                }
                var avg = Math.floor((r + g + b) / 3);
                if (avg > 125) {
                    return "#000"
                } else {
                    return "#fff"
                }
            }
            return "#f4f4f4"

        }


        function setPlatform(platform) {
            if (platform == CommunicationService.ANDROID) {
                CommunicationService.PLATFORM = CommunicationService.ANDROID;
            }
            CommunicationService.InitPlatform();
        }

        function toggleRebuscloudLogo() {
            surveyProperties.ShowRebusCloudLogo = vm.ShowRebusCloudLogo;
            updateSurveyProperties();
        }

        function showCompanyLogo() {
            surveyProperties.LogoPath = vm.LogoPath;
            if (vm.RedirectURL != '') {
                surveyProperties.RedirectURL = vm.RedirectURL;
            }
            updateSurveyProperties();
        }

        function changeLogoPosition() {
            surveyProperties.LogoPosition = vm.LogoPosition;
            updateSurveyProperties();
        }
        function removeSurveyLogo() {
            surveyProperties.LogoPath = "";
            updateSurveyProperties();
        }
        function updateProgressBarType() {
            surveyProperties.ProgressBarType = vm.ProgressBarType;
            updateSurveyProperties();
        }

        function getPanelVariables() {
            return surveyProperties.PanelParameters || {};
        }

        function isEndReviewEnabled() {
            return surveyProperties.EnableReview || false;
        }

        function updateProgressBarType() {
            surveyProperties.ProgressBarType = vm.ProgressBarType;
            updateSurveyProperties();
        }

        function isAutoSubmitEnabled() {
            return surveyProperties.IsAutoSubmit || window.IsAutoSubmit || false;
        }

        function isBackCheckChangeJumpEnabled() {
            return surveyProperties.EnableJumpOnReview || false;
        }

        function getBackCheckJumpNode(backcheck) {
            var jumpNode;
            if (Enums.BackCheckStatus.Accepted == backcheck) {
                jumpNode = surveyProperties.JumpOnReview.Accepted;
            } else if (Enums.BackCheckStatus.Rejected == backcheck) {
                jumpNode = surveyProperties.JumpOnReview.Rejected;
            }
            if (typeof jumpNode == "object") {
                return {
                    ID: jumpNode.JumpID,
                    Type: jumpNode.JumpType
                }
            }

            return null;
        }

        function isSubmitButtonEnabled() {
            return surveyProperties.IsEnableSubmitButton;
        }

        function showProgressBar() {
            return surveyProperties.ShowProgressBar;
        }

        function isLanguageChangeActionEnabled() {
            return surveyProperties.OnLanguageChange.IsEnabled || false;
        }

        function executeCallback() {
            var variable = surveyProperties.OnLanguageChange.TargetVariableName;
            var callback = surveyProperties.OnLanguageChange.Callback;
            var params = surveyProperties.OnLanguageChange.Parameters;
            var ans = r(variable);
            if (typeof ans[callback] == "function") {
                params = params.split(',').map(function (d) {
                    return d.trim();
                });
                ans[callback].apply(ans, params);
            }
        }

        function getSurveyEndApiPath() {
            var apiPath = surveyProperties.OnSurveyEnd.ApiPath || "";
            if (surveyProperties.OnSurveyEnd.Parameters) {
                apiPath += appendParams(surveyProperties.OnSurveyEnd.Parameters);
            }
            return apiPath;
        }

        function getSurveyLaunchApiPath() {
            var apiPath = surveyProperties.OnSurveyLaunch.ApiPath || "";
            if (surveyProperties.OnSurveyLaunch.Parameters) {
                apiPath += appendParams(surveyProperties.OnSurveyLaunch.Parameters);
            }
            return apiPath;
        }

        function appendParams(params) {
            var appendedParameters = "/";
            params = params.split(',');
            for (var i in params) {
                appendedParameters += r(params[i]).GetValue();
                if (params[parseInt(i) + 1])
                    appendedParameters += "/";
            }
            return appendedParameters;
        }

        function getLanguageSetting(){
            return surveyProperties.ShowLanguageDropdown;
        }

        function isThumbsUpAllowed() {
            return surveyProperties.ShowLogoOnEndPage;
        }
        function isSurveyByRebusCloudAllowed() {
            return surveyProperties.ShowSurveyByRebusCloud;
        }
        function isShowProgressBarTextAllowed() {
            return surveyProperties.ShowProgressBarText;
        }
        function isShowFooterLinkAllowed() {
            return surveyProperties.ShowFooterLink;
        }
        function getPlaceholders(){
            return surveyProperties.Placeholders;
        }
        function getErrors(){
            return surveyProperties.Errors;
        }
        function getHints(){
            return surveyProperties.Hints;
        }
        function getButtons(){
            return surveyProperties.Buttons;
        }
        function getFooterLinkTexts(){
            return surveyProperties.FooterLinkText;
        }
        function getFooterLinkURLs(){
            return surveyProperties.FooterLinkURL;
        }
        function isStartupEnabled() {
            return surveyProperties.IsStartupPageEnabled || false;
        }
        function isStartUpMediaEnabled() {
            return surveyProperties.IsStartupMediaEnabled || false;
        }
        function getStartUpMediaType() {
            return surveyProperties.StartupPageMediaType || false;
        }

        function getStartUpPageProperties() {
            return surveyProperties.StartUpPage;
        }

        function isLogoBasedOnLanguage() {
            return surveyProperties.IsLogoBasedOnLanguage;
        }

        function getAllLogos() {
            if(!isLogoBasedOnLanguage()){
                for(var i in getAllLanguages()){
                    surveyProperties.Logos[i] = surveyProperties.LogoPath || surveyProperties.Logos[i];
                }
            }
            return surveyProperties.Logos || {};
        }

        function setLogoForLang(lang, path) {
            if(surveyProperties.Logos){
                if(!isLogoBasedOnLanguage()){
                    for(var i in getAllLanguages()){
                        surveyProperties.Logos[i] = path;
                    }
                }else{
                    surveyProperties.Logos[lang] = path;
                }
            }
        }

        function getLogoPath() {
            if(!surveyProperties.Logos){
                surveyProperties.Logos = {};
            }
            if(!isLogoBasedOnLanguage()){
                for(var i in getAllLanguages()){
                    surveyProperties.Logos[i] = surveyProperties.LogoPath || surveyProperties.Logos[i];
                }
            }
            return surveyProperties.Logos[getSurveyLanguage()] || '';
        }

        function getSubmittedButtonText(){

         return surveyProperties.Buttons['Submitted'][getSurveyLanguage()] || surveyProperties.Buttons['Submitted'][getDefaultLanguage()] ;
        }

        function isSurveyVW(){

            var ProjectGUID = r("ProjectGUID").GetValue();
            if (ProjectGUID == '40b3974e-6deb-093a-8baf-37c341654656' || ProjectGUID == '9d810f1b-a166-176a-beb3-937683a06fd7' || ProjectGUID == '81918673-78ab-8971-1201-55a04426d2a9') {
                return true;
            }
            return false;
        }
    }
})(angular);
