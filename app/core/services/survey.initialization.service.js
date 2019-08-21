(function (angular) {
    'use strict';

    angular.module('SurveyEngineCore').service('SurveyInitializationService', initializerService);

    initializerService.$inject = ['$q', 'SurveyEngine.RespondentService', 'SurveyEngine.SurveySettings',
        'SurveyEngine.Enums', '$location', '$rootScope', "EngineCore.TestGenerator", "EngineCore.SurveyTreeService", "SurveyEngine.PageRouteService"
    ];

    function initializerService($q, RespondentService, SurveySettings, Enums, $location, $rootScope, TestGenerator, SurveyTreeService, PageRouteService) {

        var vm = this;

        vm.InitSurvey = initSurvey;


        ////////////////////////////////////

        function initSurvey() {
            getPropertiesFromUrl();
            var deferred = $q.defer();
            // Only Check for locally stored survey if it is anonymous and resumed and live survey.
            if (RespondentService.IsTest == Enums.SurveyType.Live && SurveySettings.IsPropertiesStoredLocally() && RespondentService.IsRespondentStoredLocally(SurveySettings.QueryParameter.ProjectGUID)) {

                if (RespondentService.GetSurveyStatus() == Enums.SurveyStatus.Completed ||
                    RespondentService.GetSurveyStatus() == Enums.SurveyStatus.Terminated) {
                    // If Survey type is live then only check the multiple survey prevention,
                    // start a new survey if it is test
                    if (RespondentService.IsTest == Enums.SurveyType.Live &&
                        SurveySettings.IsMultipleSurveyPreventionEnabled()) {
                        // Show End of Survey Message
                        setTimeout(function () {
                            $rootScope.$broadcast('OnEndSurvey');
                            deferred.reject();
                        }, 0);
                    } else {
                        startSurvey().then(function () {
                            deferred.resolve();
                        });
                    }
                } else {
                    // Check if Survey is inActive or not
                    SurveySettings.GetSurveyProperties().then(function (surveyProperties) {
                        // Check data expiry only if the Survey Mode is not Preview
                        if (RespondentService.GetSurveyMode() !== Enums.SurveyMode.Preview) {
                            if (SurveySettings.IsPasswordProtectEnabled()) {
                                $rootScope.$broadcast('OnAuthorizationRequest');
                            }
                            RespondentService.SetSurveyMode(Enums.SurveyMode.Resume);
                            SurveySettings.SetSurveyProperties(surveyProperties, false);
                            if(SurveySettings.QueryParameter.Clang){
                                SurveySettings.SetSurveyLanguage(SurveySettings.QueryParameter.Clang);
                            }
                            PageRouteService.DrawStartUpPage();
                            SurveyTreeService.load();
                            isSurveyActive().then(function () {
                                deferred.resolve();
                            }, function () {
                                deferred.reject();
                            });
                        } else {
                            SurveySettings.SetSurveyProperties(surveyProperties, true);
                            SurveyTreeService.load();
                            deferred.resolve();
                        }
                    });
                }
            } else {
                startSurvey().then(function () {
                    deferred.resolve();
                });
            }
            return deferred.promise;
        }

        function startSurvey() {
            var deferred = $q.defer();
            // GetSurveyProperties : [true] ----- indicates that fetch new properties instead of locally stored
            SurveySettings.GetSurveyProperties(true).then(function (surveyProperties) {
                // Check data expiry only if the Survey Mode is not Preview
                // TODO : Increase the active survey version by 1 in test generator.
                if (RespondentService.GetSurveyMode() !== Enums.SurveyMode.Preview && !TestGenerator.isTestEnabled) {
                    SurveySettings.SetSurveyProperties(surveyProperties, false);
                } else {
                    SurveySettings.SetSurveyProperties(surveyProperties, true);
                }
                if(SurveySettings.QueryParameter.Clang){
                    SurveySettings.SetSurveyLanguage(SurveySettings.QueryParameter.Clang);
                }
                PageRouteService.DrawStartUpPage();
                if (RespondentService.GetSurveyMode() != Enums.SurveyMode.Review && RespondentService.GetSurveyMode() != Enums.SurveyMode.Resume && RespondentService.GetSurveyMode() != Enums.SurveyMode.View) {
                    SurveyTreeService.load();
                }
                if (SurveySettings.IsPasswordProtectEnabled() && !TestGenerator.isTestEnabled) {
                    $rootScope.$broadcast('OnAuthorizationRequest');
                }
                if (SurveySettings.IsCaptureGPSEnabled() && !TestGenerator.isTestEnabled) {
                    navigator.geolocation.getCurrentPosition(function (location) {
                        console.log(location.coords.latitude);
                        console.log(location.coords.longitude);
                        console.log(location.coords.accuracy);
                        RespondentService.SetLatLong(location.coords.latitude, location.coords.longitude);
                        RespondentService.SetCityCountry(location.coords.latitude, location.coords.longitude);
                        createAndGetResp(deferred);
                    }, function () {
                        // If GPS Unavailable check whether survey allowed if GPS not available.
                        if (!SurveySettings.IsAllowIfGPSUnavailable()) {
                            // GPS not available and stop the survey
                            $rootScope.$broadcast('OnEndSurvey');
                            deferred.reject();
                        } else {
                            createAndGetResp(deferred);
                        }
                    });
                } else {
                    setTimeout(function () {
                        createAndGetResp(deferred);
                    }, 0);
                }

                RespondentService.SetPanelMapping(SurveySettings.GetPanelVariables());
                // This initializes the respondent object.
                RespondentService.InitRespondent(SurveySettings.QueryParameter, SurveySettings.GetSurveyLanguage(), SurveySettings.GetQuesVersion());
            }, function (err) {
                $rootScope.$broadcast('ServerError', err.status);
            });

            return deferred.promise;
        }

        function createAndGetResp(deferred) {
            // If mode is preview then do not save the respondent on the server
            if (RespondentService.GetSurveyMode() === Enums.SurveyMode.Preview) {
                initLanguage();
                deferred.resolve();
            } else if (RespondentService.GetSurveyMode() === Enums.SurveyMode.Review || RespondentService.GetSurveyMode() === Enums.SurveyMode.View) {
                var source = "Processed";
                RespondentService.GetRespondent(null, SurveySettings.QueryParameter.RespID, source).then(function (data) {
                    var version = parseInt(data.Answers.QuestionnaireVersion.Values[0]);
                    SurveySettings.UpdateQVersion(version);
                    SurveyTreeService.load();
                    initLanguage();
                    RespondentService.SetSurveyMode(Enums.SurveyMode.Review);
                    RespondentService.AddQueryParamToRespondent();
                    deferred.resolve();
                }, function (err) {
                    $rootScope.$broadcast('ServerError', err.status);
                });
            } else {
                populateVariableBasedOnChannel();
                // If Auto test is enabled then set Question per page to a high number so that it will fetch questions in one shot and generate response in one go
                // No need to check if survey is active or not in auto test case
                if (TestGenerator.isTestEnabled) {
                    SurveySettings.QuestionPerPage = 99;
                    // If sync allowed then only Post a respondent
                    if (TestGenerator.AllowSync) {
                        createAndGet(deferred);
                    } else {
                        // Initializing the respondent ID as it is not synced
                        RespondentService.SetRespondentID(1);
                        deferred.resolve();
                    }
                } else {
                    isSurveyActive().then(function () {
                        createAndGet(deferred);
                    }, function () {
                        deferred.reject();
                    })
                }
            }

            function createAndGet(deferred) {
                RespondentService.CreateRespondent().then(function (data) {
                    RespondentService.GetRespondent(data).then(function (data) {
                        // i.e. resumed
                        if (data.FlowList.length > 0) {
                            var version = parseInt(data.Answers.QuestionnaireVersion.Values[0]);
                            var activeVersion = SurveySettings.GetQuesVersion();
                            if(version !== activeVersion){
                                SurveySettings.UpdateQVersion(version);
                                SurveyTreeService.flushQuestionnaire();
                                SurveyTreeService.load();
                            }
                            RespondentService.SetSurveyMode(Enums.SurveyMode.Resume);
                        } else {
                            RespondentService.SetSeed();
                            RespondentService.SetFingerPrintID();
                            initLanguage();
                        }
                        deferred.resolve();
                    });
                }, function (err) {
                    if(err.status === 500){
                        $rootScope.$broadcast('ServerError', 500);
                    }else if (err.status === 412) {
                        $rootScope.$broadcast('OnInactiveSurvey');
                    } else {
                        $rootScope.$broadcast('OnEndSurvey');
                    }
                    deferred.reject();
                });
            }
        }

        function initLanguage() {
            if (SurveySettings.IsLanguageSelectorEnabled() && !TestGenerator.isTestEnabled) {
                $rootScope.$broadcast('OnLanguageSelectRequest');
            } else if (SurveySettings.QueryParameter.Clang) {
                SurveySettings.SetSurveyLanguage(SurveySettings.QueryParameter.Clang);
                RespondentService.SetSurveyLanguage(SurveySettings.GetSurveyLanguage());
            } else if (typeof navigator.language === "string") {
                // If browser's language is present in survey languages then set that
                // else set default language
                var allLanguages = SurveySettings.GetAllVisibleLanguages();
                if(Object.keys(allLanguages).length === 0){
                    allLanguages = SurveySettings.GetAllLanguages();
                }
                if (navigator.language.toLowerCase() in allLanguages || navigator.language in allLanguages) {
                    SurveySettings.SetSurveyLanguage(navigator.language.toLowerCase());
                } else {
                    SurveySettings.SetSurveyLanguage(SurveySettings.GetDefaultLanguage());
                }
                RespondentService.SetSurveyLanguage(SurveySettings.GetSurveyLanguage());
            }
        }

        function isSurveyActive() {
            var deferred = $q.defer();
            SurveySettings.IsSurveyActive(SurveySettings.QueryParameter.CampaignID).then(function () {
                // Do nothing when survey is active
                deferred.resolve();
            }, function (err) {
                if(err.status === 500){
                    $rootScope.$broadcast('ServerError', 500);
                }else{
                    // Survey or Campaign stopped
                    $rootScope.$broadcast('OnInactiveSurvey');
                }
                deferred.reject();
            });

            return deferred.promise;
        }

        function populateVariableBasedOnChannel() {
            switch (RespondentService.Channel) {
                case Enums.Channel.AnonymousLink:
                case Enums.Channel.OfflineAnonymous:
                case Enums.Channel.AutoPersonalizedEmails:
                    break;

                case Enums.Channel.AnonymousEmailCampaignLink:
                case Enums.Channel.AnonymousSMSCampaignLink:
                    RespondentService.CreateSystemVariable("CampaignID", [SurveySettings.QueryParameter.CampaignID], Enums.VariableType.Text);
                    break;

                case Enums.Channel.PersonalizedLink:
                case Enums.Channel.PersonalizedEmailCampaignLink:
                case Enums.Channel.OfflinePersonalized:
                case Enums.Channel.PersonalizedSMSCampaignLink:
                    RespondentService.CreateSystemVariable("CampaignID", [SurveySettings.QueryParameter.CampaignID], Enums.VariableType.Text);
                    if(SurveySettings.QueryParameter.DistributionListID){
                        RespondentService.CreateSystemVariable("DistributionListID", [SurveySettings.QueryParameter.DistributionListID], Enums.VariableType.Text);
                    }
                    RespondentService.CreateSystemVariable("SampleID", [SurveySettings.QueryParameter.SampleID], Enums.VariableType.Text);
                    break;
            }
        }

        function getPropertiesFromUrl() {
            var encodedParams = $location.search();
            if(Object.keys(encodedParams).length == 0){
                location.search.replace('?','').split('&').map(function(d){var f= d.split("="); encodedParams[f[0]] = f[1] });
            }
            var url = {},
                decodedParam;
            var panelValues = {};
            for (var prop in encodedParams) {
                // Add properties which are not present in the url object
                // This will ensure the backward compatibility of the survey for older non-encoded query parameters
                if (!url.hasOwnProperty(prop)) {
                    url[prop] = encodedParams[prop];
                }
                if (prop == "rcparams") {
                    decodedParam = atob(encodedParams[prop]);
                    var splits = decodedParam.split("&");
                    for (var i = 0; i < splits.length; i++) {
                        var paramSplit = splits[i].split("=");
                        url[paramSplit[0]] = paramSplit[1];
                    }
                } else {
                    // Panel answers objects in respondent
                    panelValues[prop] = encodedParams[prop];
                }
            }
            RespondentService.SetPanelAnswers(panelValues);
            if (url.pid) {
                SurveySettings.QueryParameter.ProjectGUID = url.pid;
            }
             // Only applicable for offline
            if (url.platform) {
                SurveySettings.SetPlatform(parseInt(url.platform));
            }
            if (url.sid) {
                SurveySettings.QueryParameter.SubscriptionID = url.sid;
                SurveySettings.SetAPIPath();
            }
            if (url.cid) {
                SurveySettings.QueryParameter.CampaignID = url.cid;
            }
            if (url.dlid) {
                SurveySettings.QueryParameter.DistributionListID = url.dlid;
            }
            if (url.smpid) {
                SurveySettings.QueryParameter.SampleID = url.smpid;
            }
            if (url.rid) {
                SurveySettings.QueryParameter.RespID = url.rid;
            }
            if (url.mode) {
                SurveySettings.QueryParameter.Mode = parseInt(url.mode);
                RespondentService.SetSurveyMode(parseInt(url.mode));
            } else {
                // If survey mode is not passed in query parameter.
                // Set the mode to default : NEW
                SurveySettings.QueryParameter.Mode = RespondentService.GetSurveyMode();
            }
            if (url.lang) {
                SurveySettings.QueryParameter.Clang = url.lang;
            }
            if (url.ch) {
                SurveySettings.QueryParameter.Channel = parseInt(url.ch);
                RespondentService.Channel = SurveySettings.QueryParameter.Channel;
            } else {
                SurveySettings.QueryParameter.Channel = RespondentService.Channel;
            }
            if (url.test) {
                SurveySettings.QueryParameter.IsTest = parseInt(url.test);
                RespondentService.IsTest = SurveySettings.QueryParameter.IsTest;
            }
           
            if (url.auto == "true" && url.count) {
                TestGenerator.isTestEnabled = true;
                TestGenerator.MaxTestCount = parseInt(url.count);
                if (url.sync == "false") {
                    TestGenerator.AllowSync = false;
                }
            }
            if(url.sessionid){
                RespondentService.SetSessionID(url.sessionid);
            }
            if (url.data) {
                var answers = [];
                var data = url.data.split(';');
                for (var i = 0; i < data.length; i++) {
                    var varAns = data[i].split(',');
                    var ans = RespondentService.GetAnswerObject();
                    ans.VariableName = varAns[0].trim();
                    ans.QuestionID = varAns[1].trim()
                    ans.Values = [varAns[2].trim()];
                    ans.VariableType = parseInt(varAns[3].trim());
                    if (ans.VariableType == Enums.VariableType.SingleChoice || ans.VariableType == Enums.VariableType.MultipleChoice) {
                        ans.DisplayedValues = [varAns[2].trim()];
                    }
                    answers.push(ans);
                }
                if (answers.length > 0) {
                    RespondentService.SetQueryAnswers(answers);
                }
            }
        }

    }

})(angular);