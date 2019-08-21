/**
 * Created by AnkitS on 1/24/2017.
 */

(function (angular) {
    'use strict';

    angular.module('SurveyEngineCore')
        .service("SurveyEngine.UIService", ["SurveyEngine.SurveySettings", 'SurveyEngine.Enums', uiService]);

    function uiService(SurveySettings, Enums) {
        var vm = this;

        // To be initialised in Flow controller after survey initialization.
        vm.SurveyMode;

        vm.GetHeader = getHeader;
        vm.GetSectionName = getSectionName;
        vm.GetToast = getToast;
        vm.GetQuestion = getQuestion;
        vm.GetSurveyEnd = getSurveyEnd;
        vm.GetNavButtons = getNavButtons;
        vm.GetFooter = getFooter;
        vm.EndNodeFooter = endNodeFooter;
        vm.GetAuthView = getAuthView;
        vm.GetNextNavButton = getNextNavButton;
        vm.GetLanguageSelectorView = getLanguageSelectorView;
        vm.AdjustHeight = adjustHeight;
        vm.DetectBrowser = detectBrowser;
        vm.ShowAudioListener = showAudioListener;
        vm.GetStartUpLayout = startUpLayout;
        vm.GetWaitingView = getWaitingView;
        vm.GetErrorView = getErrorView;


        function getHeader(surveyTitle, showLanguageDropdown) {
            var html = "" +
                "<div class='hdrLayout' id='hdr-Layout'><div class='header-design' id='header_top' style='max-width:800px;margin:0 auto;position:relative;'><div id='survey-header' class='padding-5 text-center'>" +
                getLogoHeader() +
                '     <span class="font-size-Xlg text-center" style="display: inline-block;" ng-style="{ \'width\' : \'' + SurveySettings.LogoPosition + '\'== \'topLeft\' || \'' + SurveySettings.LogoPosition + '\'== \'topRight\' ? \'50%\' : \'60%\', \'display\' : \'' + SurveySettings.LogoPosition + '\'== \'topLeft\' || \'' + SurveySettings.LogoPosition + '\'== \'topRight\' ? \'none\' : \'inline-block\' }">' +
                "               <center class='survey-title-text-color'>" +
                surveyTitle +
                "               </center>" +
                "       </span>";

            html += '<div style="float:left" ng-class="{\'Lang-right\' : \'' + SurveySettings.LogoPosition + '\' ==\'topLeft\',\'Lang-left\' : \'' + SurveySettings.LogoPosition + '\'==\'topRight\'}">'
            if (showLanguageDropdown) {
                html += '<div id="languageSelector" class="dropdown" style="padding: 0px;border:0px!important">' +
                    '<a class="btn btn-link dropdown-toggle btn-sm" tabindex="0" ng-click="ShowLanguages()"><i class="fa fa-globe" style="margin-right:3px;"></i>{{UserSelected.Language}}<i class="icon icon-caret"></i></a>' +
                    '</div></div>';
            }
            if (vm.SurveyMode === Enums.SurveyMode.Review) {
                html += '<div style="position:absolute;right:-250px;width:240px;top:57px;"><button ng-click="Reject()" class="btn btn-primary" style="font-size: 1rem;padding: 0px 5px;height: initial;margin-right:3px;">Reject</button>' +
                    '<button ng-click="Accept()" class="btn btn-primary" style="font-size: 1rem;padding: 0px 5px;height: initial;margin-right:10px;">Accept</button></div>';
            }
            // html += '</div>';
            // html += '' + '</div>';
            if (SurveySettings.Settings.Header) {
                html += "<div class='section-header survey-topHdr'  id='survey-topHdr'>" +
                    "     <div class='padding-5 font-size'>" + "<center id='header-txt'>" +
                    SurveySettings.Settings.Header +
                    "</center></div></div>";
            }
            html += "</div><div style='clear:both'></div></div></div></div>";

            return html;
        }

        function getLogo() {
            var html = "";
            if (SurveySettings.LogoPosition == 'bottomLeft' && SurveySettings.GetLogoPath() != '') {
                html += "<img src='" + SurveySettings.GetLogoPath() + "' style='width:auto;position: absolute; top: 0px; left: 0px;'>";
            } else if (SurveySettings.LogoPosition == 'bottomRight' && SurveySettings.GetLogoPath() != '') {
                html += "<img src='" + SurveySettings.GetLogoPath() + "' style='width:auto;position: absolute; top: 0px; right: 0px;'>";
            } else if (SurveySettings.LogoPosition == 'bottomMiddle' && SurveySettings.GetLogoPath() != '') {
                html += "<img id='bottom-middle' src='" + SurveySettings.GetLogoPath() + "' style='max-height:40px;'>";
            }
            if (SurveySettings.RedirectURL) {
                html = "<a href='" + SurveySettings.RedirectURL + "' target='_blank'> " + html + " </a>";
            }

            return html;
        }

        function getLogoHeader() {
            var html = "";
            if (SurveySettings.LogoPosition == 'topLeft' && SurveySettings.GetLogoPath() != '') {
                html += "<img src='" + SurveySettings.GetLogoPath() + "' style='float:left'>";
            } else if (SurveySettings.LogoPosition == 'topRight' && SurveySettings.GetLogoPath() != '') {
                html += "<img src='" + SurveySettings.GetLogoPath() + "' style='float:right;padding-right:10px;'>";
            } else if (SurveySettings.LogoPosition == 'topMiddle' && SurveySettings.GetLogoPath() != '') {
                html += "<img id='logo-middle' src='" + SurveySettings.GetLogoPath() + "' style='width:auto;position: absolute; top: 0px;'>";
            }
            if (SurveySettings.RedirectURL) {
                html = "<a href='" + SurveySettings.RedirectURL + "' target='_blank'> " + html + " </a>";
            }

            return html;
        }

        function getSectionName(name) {
            return "<div class='section-header padding-5'>" + name + "</div>"
        }

        function getToast() {
            return '<div class="toast toast-danger" ng-show="showToastMessage">' +
                '<i class="icon icon-error_outline"></i>' +
                '{{toastMessage}}' +
                '</div>';
        }

        function showAudioListener() {
            return '<div id="recording-toast" class="toast toast-danger" style="position: fixed;bottom: 51px;z-index: 9;left: 0;">' +
                '<button class="btn btn-clear float-right" onclick="window.closeRecording()"></button>' +
                '<span style="margin-right: 2em;">Recorded Audio</span>' +
                // '<audio id="recording" style="width: 72%;vertical-align: middle;" controls type="audio/mp3"></audio>' +
                '</div>';
        }

        window.closeRecording = function () {
            var toast = document.getElementById('recording-toast');
            toast.style.display = "none";
        }

        function getQuestion(i, validationScriptID) {
            var html = "<survey-question  class='surveyQues' q-object='PageBufferObject[" + i + "]' language='" + SurveySettings.GetSurveyLanguage() + "'></survey-question>";
            if (validationScriptID) {
                html += "<span class='requiredText'>{{ValidationMessage['" + validationScriptID + "']}}</span>";
            }
            html += "<div ng-if='" + SurveySettings.Settings.ShowSeperator + "'></div>";

            return html;

        }

        function getSurveyEnd(endMessage, enableButton, endNode) {
            var html = "<h1 class='endMsg font-size-XXlg card' id='endText' style='font-weight:normal'>" + endMessage + "<br>";
            if (enableButton) {
                html += "<div ng-if='!Navigation.hideSubmit' class='text-center'><div class='button navend enabled  display-inline-block' style='margin-top:30px' id='submit' ng-class='{\"disabled\" :Navigation.isSubmitDisabled}'  ng-click='OnSubmitResponse(\"" + encodeURIComponent(endMessage) + "\", " + JSON.stringify(endNode) + ")'>" + (SurveySettings.GetButtons()['Submit'][SurveySettings.GetSurveyLanguage()] || SurveySettings.GetButtons()['Submit'][SurveySettings.GetDefaultLanguage()]) + "</div></div>";
            }
            html += "<span class='display-none'>Now <b>create your own</b> — it's easy & beautiful</span><div class='button-wrapper display-none' style='margin-top: 30px;'><a class='button general full enabled' target='_blank' href='https://app.rebuscode.com'>Create a <strong>RebusCloud</strong></a></div></h1>";
            return html;
        }

        function getNavButtons() {
            return "" +
                "<div class='footer-design'><div class='pos-rel' id='engine-container' style='width: 90%;margin:0 auto'>" +
                '   <div class="left-btn">' +
                '       <div class="prev-next clickable" title="Previous" ng-click="BroadcastBeforeBack()" ng-class="{\'disabled\' : Navigation.isBackDisabled}">' +
                SurveySettings.Settings.NavigationButtons.Back +
                '       </div>' +
                '   </div>' +
                '   <div class="right-btn">' +
                '       <div class="prev-next clickable" title="Next" ng-click="ValidateBeforeNext()" ng-class="{\'disabled\' : Navigation.isNextDisabled}">' +
                SurveySettings.Settings.NavigationButtons.Next +
                '       </div>' +
                '   </div>' +
                '   <div style="clear:both"></div>' +
                '</div></div>';
        }

        function getNextNavButton() {
            return "" +
                "<div class='footer-design font-75' id='footer-design'><div style='bottom: 0;max-width:800px;height:40px;margin : 0 auto'>" +
                '<div class="text-center middle-pane">' +
                getLogo() +
                // '       <div class="text-center"><div ng-class="{\'invisible\' : ' + !SurveySettings.ShowRebusCloudLogo + '}" id="survey-Logo" class="display-inline-block"></div></div>' +
                // '       <div class="text-center" ng-class="{\'invisible\' : ' + !SurveySettings.ShowRebusCloudLogo + '}">' +
                //  '       <span class="font-size"><i>Where your Questions get Answered</i> </span></div>' +
                '       <div class="text-center"><center class="font-size" id="footer-txt">' +
                SurveySettings.Settings.Footer +
                '           </center></div></div>' +
                '<div class="right-btn">' +
                '       <div ng-class="{\'invisible\' : ' + !window.jsrcb.isMobile + '}"  class="prev-next clickable" style="float:right" title="Next" ng-click="SelectLanguage()">' +
                '<i class="icon icon-arrow-down"></i>' +
                '       </div>' +
                // Buttom for Web
                '       <div ng-class="{\'invisible\' : ' + window.jsrcb.isMobile + '}"  class="prev-next clickable" style="float:right" title="Next" ng-click="SelectLanguage()">' +
                SurveySettings.Settings.NavigationButtons.Next +
                '<i class="icon icon-arrow-down" style="margin-left:5px;"></i>' +
                '       </div>' +
                '<span class="display-inline-block border-radius invisible" style="float:right"><img src="assets/images/logo.png"/></span>'
            '   </div>' +
            '   <div style="clear:both"></div>' +
            '</div></div></div>';
        }

        function endNodeFooter(progressText, value, showProgressBar, footerMessage) {
            var html = "";
            html += '<div class="survey-bottomHdr footer-design" id="survey-bottomHdr"><div class="pos-rel" style="bottom: 0;max-width:800px;height:40px;margin : 0 auto">'
            if (showProgressBar) {
                html += '   <div class="left-btn"><div class="end-progress" id="progress">' +
                    "<div>";
                if (SurveySettings.ProgressBarType == 'text') {
                    html += "<div class='ques-count' style='text-align: left'>" + progressText + "</div>";
                } else if (SurveySettings.ProgressBarType == 'percentage') {
                    html += "<div class='ques-count' style='text-align: left'> 100% </div>";
                }
                html += "<div class='progress ques-bar'>" +
                    "   <div class='progress-bar ques-progress' style='width:100%;'>" +
                    "   </div>" +
                    "</div>" +
                    "</div>" +
                    '</div></div>';
            }
            html += ' <div class="text-center middle-pane">' +
                getLogo();
            if (SurveySettings.Settings.Footer) {
                html += '<div class="text-center"><center class="font-size" id="footer-txt">' +
                    SurveySettings.Settings.Footer +
                    '           </center></div>';
            }
            html += '</div>';
            html += ' <div class="right-btn">' +
                // Button for mobile
                '<div ng-class="{\'disabled\' : Navigation.isBackDisabled}"  class="prev-next clickable mobilebtn" title="Previous" style="float:right" ng-click="GoBack()">' +
                '<i class="icon icon-arrow-up"    ng-class="{\'rotate-left\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\'}"></i>' +
                '       </div>' +
                // Buttom for Web

                '<div ng-class="{\'disabled\' : Navigation.isBackDisabled}"  class="prev-next clickable webbtn" title="Previous" style="float:right" ng-click="GoBack()" >' +
                '<i class="icon icon-arrow-up"   ng-class="{\'rotate-left visible\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\',\'hidden\' : \'' + SurveySettings.ArrowPosition + '\' !=\'leftRight\'}" style="margin-left:5px;"></i>' +
                 (SurveySettings.GetButtons()['Back'][SurveySettings.GetSurveyLanguage()] || SurveySettings.GetButtons()['Back'][SurveySettings.GetDefaultLanguage()]) +
                '<i class="icon icon-arrow-up"   ng-class="{\'hidden\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\'}" style="margin-left:5px;"></i>' +
                '       </div>' +
                '<span id="rebusLogo" ng-class="{\'invisible\' : ' + !SurveySettings.ShowRebusCloudLogo + '}"  class="display-inline-block border-radius invisible" style="float:right"><img src="assets/images/logo.png"/></span></div><div style="clear:both"></div>'

            html += '</div>'
            if (SurveySettings.IsShowFooterLinkAllowed()) {
                //     var footerLinkTexts = SurveySettings.GetFooterLinkTexts();
                //     var footerLinkURLs = SurveySettings.GetFooterLinkURLs();
                //     html += '<div style="bottom: 0;max-width:800px;height:40px;margin : 0 auto"><ul class="marginZero paddingZero footerLinks">';
                //     for (var l = 0; l < footerLinkTexts.length; l++) {
                //         if(footerLinkURLs[l] && footerLinkURLs[l].hasOwnProperty(SurveySettings.GetSurveyLanguage())){
                //         html += '<li><a href=' + footerLinkURLs[l][SurveySettings.GetSurveyLanguage()] + ' target="_blank">' + footerLinkTexts[l][SurveySettings.GetSurveyLanguage()] + '</a></li>'
                //     }
                // }
                html += '<div style="max-width:800px;padding: 8px 5px;margin : 0 auto" class="footerRTE">' + footerMessage + '</div>';

            }
            html += '</div>';
            return html;
        }

        function getFooter(showNavButtons, showProgressBar, footerMessage) {
            var html = "";
            html += '<div class="survey-bottomHdr footer-design" id="survey-bottomHdr"><div class="pos-rel" style="bottom: 0;max-width:800px;height:40px;margin : 0 auto">'
            if (showProgressBar) {
                html += '   <div class="left-btn"><div class="s-progress" id="progress">' +
                    '<div>' +
                    '<e-progress-bar callbacks="progressBar.Callbacks" progress-type="' + SurveySettings.ProgressBarType + '"></e-progress-bar>' +
                    '</div></div></div>';
            }
            html += ' <div class="text-center middle-pane">' +
                getLogo(); 
                //  '       <div class="text-center"><div ng-class="{\'invisible\' : ' + !SurveySettings.ShowRebusCloudLogo + '}" id="survey-Logo" class="display-inline-block"></div></div>' +
                //  '       <div class="text-center" ng-class="{\'invisible\' : ' + !SurveySettings.ShowRebusCloudLogo + '}">' +
                // '       <span class="font-size"><i>Where your Questions get Answered</i> </span>
                // '</div>' +
            if(SurveySettings.Settings.Footer){
            html += '<div class="text-center"><center class="font-size" id="footer-txt">' +
                SurveySettings.Settings.Footer +
                '           </center></div>';
            }
            html += '</div>';
            if (showNavButtons) {
                html += ' <div class="right-btn">' +
                    // Button for mobile
                    '       <div ng-class="{\'disabled\' : Navigation.isNextDisabled}" class="prev-next clickable mobilebtn" style="float:right" title="Next" ng-click="ValidateBeforeNext()" ng-class="{\'disabled\' : Navigation.isNextDisabled}">' +
                    '<i class="icon icon-arrow-down" ng-class="{\'rotate-right\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\'}"></i>' +
                    '       </div>' +
                    '<div ng-class="{\'disabled\' : Navigation.isBackDisabled}"  class="prev-next clickable mobilebtn" title="Previous" style="float:right" ng-click="BroadcastBeforeBack()" ng-class="{\'disabled\' : Navigation.isBackDisabled}">' +
                    '<i class="icon icon-arrow-up" ng-class="{\'rotate-left\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\'}"></i>' +
                    '       </div>' +
                    // Buttom for Web
                    '       <div ng-class="{\'disabled\' : Navigation.isNextDisabled}"  class="prev-next clickable webbtn" style="float:right" title="Next" ng-click="ValidateBeforeNext()" id="nxt-btn">' +
                    (SurveySettings.GetButtons()['Next'][SurveySettings.GetSurveyLanguage()] || SurveySettings.GetButtons()['Next'][SurveySettings.GetDefaultLanguage()]) +
                    '<i class="icon icon-arrow-down"   ng-class="{\'rotate-left\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\'}" style="margin-left:5px;"></i>' +
                    '       </div>' +
                    '<div ng-class="{\'disabled\' : Navigation.isBackDisabled}"  class="prev-next clickable webbtn" title="Previous" style="float:right" ng-click="BroadcastBeforeBack()" id="bck-btn">' +
                    '<i class="icon icon-arrow-up"   ng-class="{\'rotate-left visible\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\',\'hidden\' : \'' + SurveySettings.ArrowPosition + '\' !=\'leftRight\'}" style="margin-left:5px;"></i>' +
                    (SurveySettings.GetButtons()['Back'][SurveySettings.GetSurveyLanguage()] || SurveySettings.GetButtons()['Back'][SurveySettings.GetDefaultLanguage()]) +
                    '<i class="icon icon-arrow-up"   ng-class="{\'hidden\' : \'' + SurveySettings.ArrowPosition + '\' ==\'leftRight\'}" style="margin-left:5px;"></i>' +
                    '       </div>' +
                    '<span id="rebusLogo" ng-class="{\'invisible\' : ' + !SurveySettings.ShowRebusCloudLogo + '}"  class="display-inline-block border-radius invisible" style="float:right"><img src="assets/images/logo.png"/></span></div><div style="clear:both"></div>'

            }
            html += '</div>'
            if (SurveySettings.IsShowFooterLinkAllowed()) {
                // var footerLinkTexts = SurveySettings.GetFooterLinkTexts();
                // var footerLinkURLs = SurveySettings.GetFooterLinkURLs();
                // html += '<div style="bottom: 0;max-width:800px;height:40px;margin : 0 auto"><ul class="marginZero paddingZero footerLinks">';
                // for (var l = 0; l < footerLinkTexts.length; l++) {
                //     if(footerLinkURLs[l] && footerLinkURLs[l].hasOwnProperty(SurveySettings.GetSurveyLanguage())){
                //     html += '<li><a href=' + footerLinkURLs[l][SurveySettings.GetSurveyLanguage()] + ' target="_blank">' + footerLinkTexts[l][SurveySettings.GetSurveyLanguage()] + '</a></li>'
                // }}
                html += '<div style="max-width:800px;padding: 8px 5px;margin : 0 auto" class="footerRTE">' + footerMessage + '</div>';
            }
            html += '</div>';
            return html;
        }



        function getAuthView() {
            return "" +
                "<div class='engine-container footer-design'>" +
                "   <div class='padding-5 card center-div'>" +
                "       <span class='font-size'>Password</span>" +
                "       <input ng-keyup='OnPassKeyUp($event)' type='password' ng-model='UserSelected.Password' class='input-txt'>" +
                "   </div>" +
                "   <div ng-show='UserSelected.isFailed' class='font-size padding-5'>" +
                "       <span>Authentication failed</span>" +
                "   </div>" +
                "   <div>" +
                "       <div ng-click='Authenticate()' class='md-primary display-inline-block font-size clickable'>" +
                "          Sign in " +
                "       </div>" +
                "   </div>" +
                "</div></div>";
        }


        function getLanguageSelectorView(langs) {
            var html = "";
            if (SurveySettings.Settings.InputButtonType == 1) {
                for (var i in langs) {
                    html += '<label class="form-radio">' +
                        '<input type="radio" name="' + i + '" ng-model="UserSelected.Language" value="' + i + '"/>' +
                        '<i class="form-icon"></i>' +
                        '<span class="survey-option-text">' + langs[i] + '</span>' +
                        '</label></br>';
                }
            } else {
                for (var i in langs) {
                    html += '<div class="option-as-label language pos-rel" ng-click="SetLanguage(\'' + i + '\')" ng-class="{\'option-checked\' : UserSelected.Language == \'' + i + '\'}" ><i class="icon icon-check pos-abs" ng-if="UserSelected.Language == \'' + i + '\'" style="top:10px;right:5px;"></i><div class="bd"></div><div class="bg"></div>' +
                        '<span class="survey-option-text">' + langs[i] + '</span>' +
                        '</div>';
                }
            }
            return html;
        }

        function adjustHeight(progressBarProperties, screenHeight) {
            var sumOfHeights = 0;
            // var SurveyTopHdr = document.getElementById('survey-topHdr').offsetHeight;
            // var SurveyBottomHdr = document.getElementById("survey-bottomHdr").offsetHeight;
            if (document.getElementById("engine-container") != null) {
                var engineContainer = document.getElementById("engine-container").offsetHeight;
                sumOfHeights += engineContainer;
            }
            //var surveyHeader = document.getElementById("survey-header").offsetHeight;
            sumOfHeights += SurveyTopHdr + SurveyBottomHdr + surveyHeader;
            if (SurveySettings.ScreenSize != '') {
                // document.getElementById("scrollable").style.height = (screenHeight-110) + 'px';
                if (document.getElementById("surveyEnd") != null) {
                    // document.getElementById("surveyEnd").style.height = (screenHeight - 110) + 'px';
                }
            } else {
                if (progressBarProperties.hasOwnProperty('Bar') && progressBarProperties.Bar) {
                    //  document.getElementById("scrollable").style.height = (screenHeight - 110) + 'px';
                    if (document.getElementById("surveyEnd") != null) {
                        //   document.getElementById("surveyEnd").style.height = (screenHeight - 110) + 'px';
                    }
                } else {
                    // document.getElementById("scrollable").style.height = (screenHeight - 110) + 'px';
                    if (document.getElementById("surveyEnd") != null) {
                        // document.getElementById("surveyEnd").style.height = (screenHeight - 110) + 'px';
                    }
                }
            }
        }

        function detectBrowser() {
            //Browser Detection Code
            // Opera 8.0+
            var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

            // Firefox 1.0+
            var isFirefox = typeof InstallTrigger !== 'undefined';

            // Safari 3.0+ "[object HTMLElementConstructor]" 
            var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
                return p.toString() === "[object SafariRemoteNotification]";
            })(!window['safari'] || safari.pushNotification);

            // Internet Explorer 6-11
            var isIE = /*@cc_on!@*/ false || !!document.documentMode;

            // Edge 20+
            var isEdge = !isIE && !!window.StyleMedia;

            // Chrome 1+
            var isChrome = !!window.chrome && !!window.chrome.webstore;

            // Blink engine detection
            var isBlink = (isChrome || isOpera) && !!window.CSS;
            if (isChrome == true) {
                document.getElementById("body-content").className += ' chrome'
            } else if (isIE == true) {
                document.getElementById("body-content").className += ' IE'
            } else if (isSafari == true) {
                document.getElementById("body-content").className += ' Safari'
            } else if (isEdge == true) {
                document.getElementById("body-content").className += ' Edge'
            } else if (isFirefox == true) {
                document.getElementById("body-content").className += ' Firefox'
            } else if (isOpera == true) {
                document.getElementById("body-content").className += ' Opera'
            }
        }

        function startUpLayout() {
            var properties = SurveySettings.GetStartUpPageProperties();
            var text = properties.Text[SurveySettings.GetSurveyLanguage()] || properties.Text[SurveySettings.GetDefaultLanguage()];
            var description = properties.Description[SurveySettings.GetSurveyLanguage()] || properties.Description[SurveySettings.GetDefaultLanguage()];
            var media = properties.Media[SurveySettings.GetSurveyLanguage()] || properties.Media[SurveySettings.GetDefaultLanguage()];
            var button = properties.ButtonText[SurveySettings.GetSurveyLanguage()] || properties.ButtonText[SurveySettings.GetDefaultLanguage()];
            var mediaHTML = "";
            if (SurveySettings.IsStartUpMediaEnabled()) {
                if (SurveySettings.GetStartUpMediaType() == Enums.MediaType.Picture) {
                    mediaHTML += "<img class='img-responsive display-inline-block' src='" + media + "' />";
                } else if (SurveySettings.GetStartUpMediaType() == Enums.MediaType.Video) {
                    mediaHTML += '<iframe class="video-responsive" src="' + media + '"></iframe>'
                }
            }
            var html = "";
            html += ["<div class='start-up-wrapper column col-12' style='padding: 0px'>",
                "<div class='content-wrap empty padding-5' style='background: none;'>",
                "<div class='img-wrapper'>",
                mediaHTML,
                "</div>",
                "<div class='text-wrapper'>",
                "<p class='empty-title' style='font-size: 1.5rem; font-weight: 500;'>" + text + "</p>",
                "<div class='empty-subtitle'>" + description + "</div>",
                "<div>",
                "<span class='prev-next clickable empty-action' ng-click='CloseStartUpPage()' title='Start Survey'>" + button + "</span>",
                // "<span> press ENTER</span>",
                "</div>",
                "</div>",
                "</div>",
                "</div>"
            ].join('');
            return html;
        }

        function getWaitingView() {
            var html = "<h1 class='endMsg font-size-XXlg card text-center' id='waitText' style='font-weight:normal'><b>" + "Please wait while we are saving your answers...." + "</b><br>";
            return html;
        }

        function getErrorView(errorCode) {
            if (errorCode == 404) {
                return '<section class="error-container">\n' +
                    '    <span>4</span>\n' +
                    '    <span class="err-zero"><span class="screen-reader-text">O</span></span>\n' +
                    '    <span class="err-number" style="margin-left: -18px;" class="err-number">4</span>\n' +
                    '</section>' +
                    '<section style="height: 100px;font-size: 3rem;width: 70%; margin: 0px auto;" class="error-container"><span class="err-msge">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</span></section>';
            }

            return '<section class="error-container">\n' +
                '    <span>5</span>\n' +
                '    <span class="err-zero"><span class="screen-reader-text">O</span></span>\n' +
                '    <span class="err-zero"><span class="screen-reader-text">O</span></span>\n' +
                '</section>' +
                '<section style="height: 100px;font-size: 3rem;" class="error-container"><span class="err-msge">Sorry! something went wrong at our side.</span></section>' +
                '<section style="height: 90px;font-size: 2rem;" class="error-container"><span onclick="location.reload()" class="err-msge err-rl-btn">Reload</span></section>'
        }
    }
})(angular);
