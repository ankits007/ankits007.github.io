(function (angular) {
    "use strict";

    angular
        .module("SurveyEngineCore")
        .service("SurveyEngine.RespondentService", ['$q', 'SurveyEngine.Enums', 'EngineCore.CommunicationService',
            'EngineCore.SurveyTreeService', 'EngineCore.TraversalListService', respondentService
        ]);

    function respondentService($q, Enums, CommunicationService, SurveyTreeService, TraversalListService) {
        var vm = this,
            respondent = {},
            // preResp is used to rollback the changes made in the respondent object before rejecting it.
            preResp = {},
            _PossibleLoopIterations = [],
            _QueryAnswers = null,
            _PanelAnswers,
            _PanelMap,_SESSION_ID;
        var _SurveyMode = Enums.SurveyMode.New;
        var _GUID = {
            ID: "52566c16-87d2-46ec-9d5a-4723879f8299",
            UniqueID: "26981f44-7337-4e26-9e54-5a55df288103",
            SubscriptionID: "07d0b94e-0ba6-41a1-92a8-fbe07f7ddd3f",
            ProjectGUID: "a61e4ce9-1aef-45f1-985a-bc8db8fc7505",
            CampaignID: "9101ff59-3258-4840-97f1-f49d605f03db",
            DistributionListID: "57bc041b-ce14-40b6-a149-6515a9355f1e",
            SampleID: "1f0fb4f1-df27-4670-8c74-2fc707c32338",
            Mode: "5f776e5e-8fba-47fa-b637-2e3ce3af0cdf",
            Clang: "de6bbb5e-d95d-4934-a22c-56fe904eef10",
            Channel: "32207bd9-f663-4f29-afbf-8351bd21de28",
            IsTest: "e8e5fbc2-f1be-4cb6-a7ec-faf069bb1e0d",
            CreatedOn: "99f8a570-dad0-4cbd-8688-358fce28fc98",
            CreatedBy: "1b8c6739-ea7b-45d8-b106-fb093a8ffe24",
            ModifiedOn: "589cf806-4b1f-48dd-b795-76f8ef1c54a8",
            ModifiedBy: "3c4bee96-19f7-4262-b134-f9b572ca8b60",
            SynchronizedOn: "f8bd5474-5b12-4744-9409-1952d06bca17",
            SynchronizedBy: "5fd190b1-928f-4cae-817f-d2cb6f825ccf",
            IsClosed: "c369d90a-5acf-42c3-b541-4a41422bb484",
            SurveyStatus: "04a55893-4529-41f2-8963-bed49ca341de",
            BackCheckStatus: "8d543353-a64e-4717-a8b8-345990ef253f",
            IsPublished: "c62783c0-b3c3-4f6c-ab1d-b545169ef022",
            InterviewStartTime: "3ec61dd7-e123-4c0f-a5d8-1f1b2b72474f",
            InterviewEndTime: "6c6af18e-5b6f-4b86-ac39-1f41dc735c2d",
            InterviewDuration: "6b588a21-69f9-4fb3-8d35-85aa271bf581",
            Latitude: "042419af-971b-4be5-88a4-5015b4ee2ce0",
            Longitude: "4e0e97a5-4046-435c-8a62-9741628b29e4",
            QuestionnaireVersion: "1ceecf13-317e-4db4-846f-381c502ccfbb",
            IPAddress: "60827025-0ed0-4794-9c66-8e829fdaa925",
            OperatingSystem: "b09c34d3-70a4-4d45-8d46-00a647a46fb5",
            ScreenSize: "043758dc-6b46-4896-a34f-1daeed33a57c",
            Browser: "7f562222-edd1-4028-90df-6d2fcf286c88",
            APKVersion: "2dbf43c9-0ba7-4771-be9e-3946a78e2de8",
            SurveyEngineVersion: "d4dc393f-96ca-4b7d-92d6-1cfcb88107ab",
            DeviceModel: "f480d090-61d6-4edd-b058-5c1d92241e37",
            DeviceUUID: "469744c3-e802-4f8e-821f-1570f65de00a",
            Country: "db3710d8-772d-4d73-8875-75bc310713cc",
            Region: "693fda89-35fa-46b7-8fdc-f8e4e8b1e6ad",
            City: "fcf54a26-2c76-4142-b912-23c68262e06f",
            Seed: "06f4e08a-f396-971a-3f9c-f1d72cdaf814"
        }

        var currentIteration = null;
        var respondentLocation = null;
        var isOnReviewAtEndPage = false, listeners= [], questionStopWatch = null, animationType = "fadeInUpBig";

        if (CommunicationService.PLATFORM === CommunicationService.WEB) {
            vm.Channel = Enums.Channel.AnonymousLink; // Default is Anonymous Link
        } else if (CommunicationService.PLATFORM === CommunicationService.ANDROID) {
            vm.Channel = Enums.Channel.OfflineAnonymous; // Default is Offline Anonymous
        }

        vm.SystemVariables = _GUID;

        vm.StopWatch = new StopWatch();

        vm.StopWatchStart = function () {
            questionStopWatch = new StopWatch();
            questionStopWatch.start();
        }

        vm.GetElapsedTime = function () {
            if (questionStopWatch != null) {
                questionStopWatch.stop();
                return questionStopWatch.getElapsedMs(0);
            }

            return -1;
        }

        vm.IsTest = Enums.SurveyType.Live; // 1=Live & 2=Test

        vm.IsRespondentStoredLocally = function (projectGUID) {
            if (CommunicationService.PLATFORM === CommunicationService.WEB && localStorage.getItem("Respondent_" + projectGUID) != null) {
                respondent = JSON.parse(localStorage.getItem("Respondent_" + projectGUID));
                _SESSION_ID = respondent.Answers.UniqueID.Values[0];
                return true;
            }
            // vm.InitRespondent();
            return false;
        }

        vm.InitRespondent = function () {
            var id = new Chance().guid();
            var args = Array.prototype.slice.call(arguments);
            respondent = {
                FlowList: [],
                Answers: {
                    UniqueID: new Answer([id], Enums.VariableType.Text, "UniqueID", _GUID.UniqueID),
                    SubscriptionID: new Answer([args[0].SubscriptionID], Enums.VariableType.Numeric, "SubscriptionID", _GUID.SubscriptionID),
                    ProjectGUID: new Answer([args[0].ProjectGUID], Enums.VariableType.Text, "ProjectGUID", _GUID.ProjectGUID),
                    Mode: new Answer([_SurveyMode], Enums.VariableType.SingleChoice, "Mode", _GUID.Mode),
                    SurveyStatus: new Answer([Enums.SurveyStatus.Partial], Enums.VariableType.SingleChoice, "SurveyStatus", _GUID.SurveyStatus),
                    CLang: new Answer([getLangCode(args[1])], Enums.VariableType.SingleChoice, "CLang", _GUID.Clang),
                    IsTest: new Answer([vm.IsTest], Enums.VariableType.SingleChoice, "IsTest", _GUID.IsTest),
                    IsClosed: new Answer([Enums.SurveyClosed.Open], Enums.VariableType.SingleChoice, "IsClosed", _GUID.IsClosed), // 1= Open, 2=Closed
                    BackCheckStatus: new Answer([Enums.BackCheckStatus.NotDone], Enums.VariableType.SingleChoice, "BackCheckStatus", _GUID.BackCheckStatus),
                    // IsPublished 1=true; 2 = false
                    IsPublished: new Answer([2], Enums.VariableType.SingleChoice, "IsPublished", _GUID.IsPublished),
                    OperatingSystem: new Answer([getOperatingSystem()], Enums.VariableType.SingleChoice, "OperatingSystem", _GUID.OperatingSystem),
                    ScreenSize: new Answer([window.jsrcb.screen], Enums.VariableType.Text, "ScreenSize", _GUID.ScreenSize),
                    Channel: new Answer([vm.Channel], Enums.VariableType.SingleChoice, "Channel", _GUID.Channel),
                    QuestionnaireVersion: new Answer([args[2]], Enums.VariableType.Numeric, "QuestionnaireVersion", _GUID.QuestionnaireVersion),
                    SynchronizedBy: new Answer(["Anonymous"], Enums.VariableType.Text, "SynchronizedBy", _GUID.SynchronizedBy),
                    ModifiedBy: new Answer(["Anonymous"], Enums.VariableType.Text, "ModifiedBy", _GUID.ModifiedBy),
                    CreatedBy: new Answer(["Anonymous"], Enums.VariableType.Text, "CreatedBy", _GUID.CreatedBy),
                    Browser: new Answer([window.jsrcb.browser], Enums.VariableType.Text, "Browser", _GUID.Browser),
                    InterviewDuration: new Answer([0], Enums.VariableType.Numeric, "InterviewDuration", _GUID.InterviewDuration)
                }
            };

            if(args[0].RespID){
                respondent.Answers.ID = new Answer([args[0].RespID], Enums.VariableType.Numeric, "ID", _GUID.ID);
            }

            if(_SESSION_ID){
                respondent.Answers.UniqueID = new Answer([_SESSION_ID], Enums.VariableType.Text, "UniqueID", _GUID.UniqueID);
            }

            vm.AddQueryParamToRespondent();

            if (vm.Channel == Enums.Channel.PanelLink && _PanelAnswers && _PanelMap) {
                for (var name in _PanelAnswers) {
                    if (name in _PanelMap) {
                        var ans = new Answer([_PanelAnswers[name]], Enums.VariableType.Text, _PanelMap[name][0], _PanelMap[name][1]);
                        vm.SaveAnswer(ans);
                    }
                }
            }
        }

        window.r = function () {
            var variableName = arguments[0];
            var callback = arguments[1];
            var callbackParams = arguments[2];
            var sectionID = arguments[3];
            // Operator operand passed when operation like selected count is compared with the passed value.
            var operator = arguments[4];
            var operand = arguments[5];
            // IsCurrent is passed to check whether to apply the logic on the current iteration or any iteration of the loop.
            var isCurrentIteration = arguments[6];

            var ans = new Answer();
            if (isInvalidVariableName(variableName)) {
                return ans;
            }

            if (arguments.length >= 4) {
                var iterations = [];
                if (isCurrentIteration && currentIteration != null) {
                    iterations.push(currentIteration);
                } else {
                    iterations = TraversalListService.getLoopIterations(sectionID);
                }
                var result = false;
                for (var i = 0; i < iterations.length; i++) {
                    var aObj = ans;
                    var vName = variableName + "." + iterations[i];
                    if (!vm.GetAnswers().hasOwnProperty(vName)) {
                        aObj.VariableName = vName;
                    } else {
                        respondent.Answers[vName].__proto__ = aObj.__proto__;
                        aObj = respondent.Answers[vName];
                    }
                    if (typeof aObj === "object" && !aObj.IsMasked) {
                        //aObj.__proto__ = ans.__proto__;
                        if (typeof aObj[callback] === "function") {
                            var cbResult;
                            if (callbackParams) {
                                var params = callbackParams.split(',').map(function (d) {
                                    return d.trim();
                                })
                                cbResult = aObj[callback].apply(aObj, params);
                            } else {
                                cbResult = aObj[callback]();
                            }
                            if (operator && operand) {
                                cbResult = eval(cbResult + " " + operator + " " + operand);
                            }
                            result = result || cbResult;
                        }
                    }
                }
                return result;
            } else {
                if (!vm.GetAnswers().hasOwnProperty(variableName)) {
                    ans.VariableName = variableName;
                    ans.IsMasked = true;
                } else {
                    respondent.Answers[variableName].__proto__ = ans.__proto__;
                    ans = respondent.Answers[variableName];
                }
                if (!ans.QuestionID) {
                    ans.QuestionID = SurveyTreeService.getQuestionID(variableName);
                }

                return ans;
            }
        }

        vm.load = function (projectGUID) {
            var deferred = $q.defer();
            setTimeout(function () {
                if (CommunicationService.PLATFORM == CommunicationService.WEB && respondent == null) {
                    respondent = JSON.parse(localStorage.getItem("Respondent_" + projectGUID));
                }
                deferred.resolve(respondent.FlowList);
            }, 0);
            return deferred.promise;
        }

        // API Calls to Create, Save, Get and Close respondent

        vm.CreateRespondent = function () {
            var deferred = $q.defer();
            var rid;
            if(respondent.Answers.hasOwnProperty('ID')){
                rid = respondent.Answers.ID.Values[0];
            }
            CommunicationService.CreateRespondent(respondent, _SESSION_ID, rid).then(function (data) {
                var pathSplits = data.split('?');
                var params = pathSplits[1], newParams = [];
                if(params){
                    newParams = params.split('&').filter(function (d) {
                        if(d.toLowerCase().indexOf("sessionid") > -1){
                            _SESSION_ID = d.split('=')[1];
                            return false;
                        }
                        return true;
                    });
                }
                respondentLocation = pathSplits[0] + "?" + newParams.join("&");
                var projectGuid = respondent.Answers.ProjectGUID.Values[0];
                if (CommunicationService.PLATFORM === CommunicationService.WEB) {
                    localStorage.setItem("Link_" + projectGuid, respondentLocation.toString());
                }
                deferred.resolve(respondentLocation);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        vm.GetRespondent = function (path, rid, source) {
            var deferred = $q.defer();
            CommunicationService.GetRespondent(path, rid, source, getUniqueID()).then(function (data) {
                for (var i in respondent.Answers) {
                    // Check for variables punched while the respondent creation was called.
                    // Example GeoLocation is fetched from Google APIs using Lat & Lon which is resolved after
                    // the respondent is created
                    if (!data.Answers.hasOwnProperty(i)) {
                        data.Answers[i] = respondent.Answers[i];
                    }
                    // If language chosen from language selector then replace it with chosen language.
                    // if (i === "CLang" && data.Answers[i].Values[0] !== respondent.Answers[i].Values[0]) {
                    //     data.Answers[i].Values[0] = respondent.Answers[i].Values[0]
                    // }
                }
                respondent = data;
                respondent.FlowList = data.FlowList || [];
                if (allowLocalStorage()) {
                    var projectGuid = respondent.Answers.ProjectGUID.Values[0];
                    localStorage.setItem("Respondent_" + projectGuid, JSON.stringify(respondent));
                }

                preResp = angular.copy(respondent);
                deferred.resolve(respondent);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        vm.SaveRespondent = function (action) {
            var deferred = $q.defer();
            vm.StopWatch.stop();
            if (vm.GetSurveyMode() != Enums.SurveyMode.Review) {
                if (!respondent.Answers.hasOwnProperty("InterviewDuration")) {
                    respondent.Answers.InterviewDuration = new Answer([0], Enums.VariableType.Numeric, "InterviewDuration", _GUID.InterviewDuration);
                }
                respondent.Answers.InterviewDuration.Values[0] = vm.StopWatch.getElapsedTimeInSeconds(respondent.Answers.InterviewDuration.Values[0]);
            }
            CommunicationService.UpdateRespondent(respondent, vm.GetRespondentID(), action, getUniqueID()).then(function () {
                vm.StopWatch.reset();
                if (allowLocalStorage()) {
                    var projectGuid = respondent.Answers.ProjectGUID.Values[0];
                    localStorage.setItem("Respondent_" + projectGuid, JSON.stringify(respondent));
                }
                deferred.resolve();
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        vm.SetRespondentEndVariables = function (status) {
            // Set the Status to Completed or Terminated.
            respondent.Answers.SurveyStatus = new Answer([status], Enums.VariableType.SingleChoice, "SurveyStatus", _GUID.SurveyStatus);
            respondent.Answers.IsClosed = new Answer([Enums.SurveyClosed.Closed], Enums.VariableType.SingleChoice, "IsClosed", _GUID.IsClosed);
        }

        vm.SetSessionID = function(id){
            _SESSION_ID = id;
        }

        vm.CloseRespondent = function (status) {
            var deferred = $q.defer();
            if (status) {
                vm.SetRespondentEndVariables(status);
                if (vm.GetSurveyMode() != Enums.SurveyMode.Review) {
                    if (!respondent.Answers.hasOwnProperty("InterviewDuration")) {
                        respondent.Answers.InterviewDuration = new Answer([0], Enums.VariableType.Numeric, "InterviewDuration", _GUID.InterviewDuration);
                    }
                    respondent.Answers.InterviewDuration.Values[0] = vm.StopWatch.getElapsedTimeInSeconds(respondent.Answers.InterviewDuration.Values[0]);
                }
            }
            CommunicationService.UpdateRespondent(respondent, vm.GetRespondentID(), "CloseSurvey", getUniqueID()).then(function () {
                if (allowLocalStorage()) {
                    var projectGuid = respondent.Answers.ProjectGUID.Values[0];
                    localStorage.setItem("Respondent_" + projectGuid, JSON.stringify(respondent));
                }
                deferred.resolve();
            }, function () {
                deferred.reject();
            });
            return deferred.promise;
        }

        // Undo all the changes made in the respondent object
        vm.RollbackRespondent = function () {
            respondent = angular.copy(preResp);
        }

        //----------------- Get/Set Respondent Variables

        // Call this only after respondent initialization
        vm.CreateSystemVariable = function (variableName, values, type) {
            var ans = vm.GetAnswerObject();
            ans.QuestionID = _GUID[variableName];
            ans.Values = values;
            ans.VariableType = type;
            ans.VariableName = variableName;

            vm.SaveAnswer(ans);
        }

        vm.GetSeed = function () {
            if (respondent.Answers.hasOwnProperty("Seed") && Array.isArray(respondent.Answers.Seed.Values)) {
                return parseInt(respondent.Answers.Seed.Values[0]);
            }
            return parseInt(vm.GetRespondentID());
        }

        vm.SetSeed = function (id) {
            if (!id) {
                id = vm.GetRespondentID();
            }
            respondent.Answers.Seed = new Answer([id], Enums.VariableType.Numeric, "Seed", _GUID.Seed);
        }

        vm.SetFingerPrintID = function () {
            if(CommunicationService.PLATFORM === CommunicationService.WEB){
                require(['Fingerprint2'], function () {
                    if(typeof Fingerprint2 === "function"){
                        new Fingerprint2().get(function (result, composition) {
                            respondent.Answers.DeviceUUID = new Answer([result], Enums.VariableType.Text, "DeviceUUID", _GUID.DeviceUUID);
                        });
                    }
                });
            }
        }

        vm.GetRespondentID = function () {
            // In Preview the ID is not populated therefore return a random number;
            if (_SurveyMode === Enums.SurveyMode.Preview) {
                return 2;
            }

            return parseInt(respondent.Answers.ID.Values[0]);
        }

        vm.SetRespondentID = function (id) {
            respondent.Answers.ID = new Answer([id], Enums.VariableType.Numeric, "ID", _GUID.ID);
        }

        vm.GetSurveyStatus = function () {
            return respondent.Answers.SurveyStatus.Values[0];
        }

        vm.SetBackCheck = function (status) {
            respondent.Answers.BackCheckStatus = new Answer([status], Enums.VariableType.SingleChoice, "BackCheckStatus", _GUID.BackCheckStatus);
        }

        vm.SetSurveyMode = function (mode) {
            if (respondent.hasOwnProperty("Answers")) {
                respondent.Answers.Mode.Values[0] = mode;
            }
            _SurveyMode = mode;
        }

        vm.GetSurveyMode = function () {
            return _SurveyMode;
        }

        vm.SetSurveyLanguage = function () {
            respondent.Answers.CLang = new Answer([getLangCode(arguments[0])], Enums.VariableType.SingleChoice, "CLang", _GUID.Clang);
        };

        vm.GetLanguageCode = function (lang) {
            return getLangCode(lang);
        }

        vm.SetLatLong = function (lat, long) {
            respondent.Answers.Latitude = new Answer([lat], Enums.VariableType.Numeric, "Latitude", _GUID.Latitude);
            respondent.Answers.Longitude = new Answer([long], Enums.VariableType.Numeric, "Longitude", _GUID.Longitude);
        }

        vm.SetCityCountry = function (lat, long) {
            codeLatLng(lat, long).then(function (geoLoc) {
                if (geoLoc.Country != null) {
                    respondent.Answers.Country = new Answer([geoLoc.Country], Enums.VariableType.Text, "Country", _GUID.Country);
                }
                if (geoLoc.Region != null) {
                    respondent.Answers.Region = new Answer([geoLoc.Region], Enums.VariableType.Text, "Region", _GUID.Region);
                }
                if (geoLoc.City != null) {
                    respondent.Answers.City = new Answer([geoLoc.City], Enums.VariableType.Text, "City", _GUID.City);
                }
            });
        }

        vm.SetDisplayedValues = function (variableName, variableType, qID, dispVals) {
            // do not set displayed values when review at end enabled
            if (!respondent.Answers || variableName == "" || isOnReviewAtEndPage || dispVals.length == 0)
                return;
            if (respondent.Answers[variableName] == undefined) {
                var ansObject = vm.GetAnswerObject();
                ansObject.VariableName = variableName;
                ansObject.VariableType = variableType;
                // clean iteration number from loop question GUID
                if (qID) {
                    ansObject.QuestionID = qID.split('|')[0];
                }
                vm.SaveAnswer(ansObject);
            }
            respondent.Answers[variableName].Values = intersect(dispVals, respondent.Answers[variableName].Values).filter(function (d) {
                return respondent.Answers[variableName].Values.hasItem(d);
            });
            respondent.Answers[variableName].DisplayedValues = dispVals;
        }

        vm.GetDisplayedValues = function (variableName) {
            if (respondent.Answers && respondent.Answers.hasOwnProperty(variableName) && respondent.Answers[variableName].hasOwnProperty("DisplayedValues"))
                return respondent.Answers[variableName].DisplayedValues;

            return [];
        }

        vm.GetAnswerObject = function () {
            var args = Array.prototype.slice.call(arguments);
            var ans = new Answer(args[0], args[1], args[2], args[3]);
            var displayedValues = vm.GetDisplayedValues(ans.VariableName);
            if(displayedValues.length > 0){
                ans.DisplayedValues = displayedValues;
            }
            return ans;
        };

        vm.AddListener = function (listener) {
            listeners.push(listener)
        };

        vm.DestroyListeners = function () {
            listeners.map(function (d) {
                if (typeof d == "function") {
                    d();
                }
            });
            listeners = [];
        };

        vm.SaveAnswer = function (answerObj) {
            if (answerObj.VariableName != "") {
                answerObj.IsMasked = false;
                // clean iteration number from loop question GUID
                if (answerObj.QuestionID) {
                    answerObj.QuestionID = answerObj.QuestionID.split('|')[0];
                }
                respondent.Answers[answerObj.VariableName] = angular.copy(answerObj);
            }
        }

        vm.GetAnswers = function () {
            return respondent.Answers;
        }

        vm.SetAnswers = function (variableName, variableType, id, ans) {
            if (variableName == "")
                return;

            // clean iteration number from loop question GUID
            if (id) {
                respondent.Answers[variableName].QuestionID = id.split('|')[0];
            }
            respondent.Answers[variableName].VariableType = variableType;
            respondent.Answers[variableName].Values = angular.copy(ans);
            respondent.Answers[variableName].IsMasked = false;
        }

        vm.GetVariableAnswers = function (variable) {
            if (respondent.Answers && respondent.Answers[variable])
                return angular.copy(respondent.Answers[variable].Values);
            else
                return [];
        }

        vm.GetVariableType = function (variableName) {
            if (respondent.Answers[variableName])
                return respondent.Answers[variableName].VariableType;

            return null;
        }

        vm.SetQueryAnswers = function (answers) {
            _QueryAnswers = answers;
        }

        vm.SetPossibleLoopIterations = function (iterations) {
            _PossibleLoopIterations = iterations;
        }

        vm.GetPossibleLoopIterations = function (iterations) {
            return _PossibleLoopIterations || [];
        }


        /**
         * Use to set the masking bit of the given variable inside respondent answers.
         * Masking bit decides whether the variable should include in analysis or not.
         * @param variableName : name of the variable which the user responded.
         * @param flag : To set the masking flag, true when variable is masked.
         */
        vm.SetMaskingBit = function (variableName, flag) {
            if (variableName == "") {
                return;
            }
            if (typeof respondent.Answers[variableName] === 'object') {
                respondent.Answers[variableName].IsMasked = flag;
            } else {
                // **** Removed as there is no question GIUD and varraible type while defining
                // respondent.Answers[variableName] = r(variableName);
                // respondent.Answers[variableName].IsMasked = flag;
            }
        }

        vm.SetCurrentIteration = function (iteration) {
            currentIteration = iteration;
        }

        vm.GetCurrentIteration = function () {
            return currentIteration;
        }

        vm.SetPanelAnswers = function (answers) {
            _PanelAnswers = answers;
        }

        vm.SetPanelMapping = function (map) {
            _PanelMap = map;
        }

        vm.SetOnReviewAtEndPage = function (isEnabled) {
            isOnReviewAtEndPage = isEnabled;
        }

        vm.Union = union;
        vm.Intersect = intersect;

        vm.AddQueryParamToRespondent = function () {
            if (_QueryAnswers != null && Array.isArray(_QueryAnswers)) {
                for (var x = 0; x < _QueryAnswers.length; x++) {
                    respondent.Answers[_QueryAnswers[x].VariableName] = _QueryAnswers[x];
                }
            }
        }

        vm.IsOffline = function () {
            return CommunicationService.PLATFORM == CommunicationService.ANDROID;
        }

        vm.GetAnimation = function () {
            return animationType;
        }

        vm.SetAnimation = function (a) {
            animationType = a;
        }

        function getUniqueID() {
            return _SESSION_ID;
        }

        function getOperatingSystem() {
            if (CommunicationService.PLATFORM == CommunicationService.ANDROID) {
                var os = CommunicationService.GetOS();
                var osParts = os.split("-");
                var osName = osParts[0];
                var version = osParts[1].split(".");
                var major = version[0];
                var minor = version[1];

                return getOSCode(osName, major, minor);
            } else if (CommunicationService.PLATFORM == CommunicationService.WEB) {
                return window.jsrcb.osCode;
            }
        }

        /*
         *   Answer class instance will be used to store answer for particular variable
         *   Below this class will be prototyped with some utility function which can be used to
         *   modify answer object directly from script.
         * */
        function Answer() {
            var args = Array.prototype.slice.call(arguments);
            this.QuestionID = args[3] || '';
            this.VariableName = args[2] || '';
            this.VariableType = args[1] || '';
            this.Values = args[0] || [];
            if (this.VariableType == Enums.VariableType.SingleChoice || this.VariableType == Enums.VariableType.MultipleChoice) {
                this.DisplayedValues = args[0] || [];
            } else {
                this.DisplayedValues = [];
            }
        }

        Answer.prototype.SetValue = function () {
            var args = Array.prototype.slice.call(arguments);
            var questionGUID = args[0];
            var variableType = args[1];
            var values = args.splice(2);

            if (isInvalidVariableName(this.VariableName)) {
                return;
            }

            if (!respondent.Answers.hasOwnProperty(this.VariableName)) {
                respondent.Answers[this.VariableName] = this;
            }
            // For multi choice variable array is passed as argument.
            if (values.length > 0 && Array.isArray(values[0])) {
                this.Values = values[0].filter(function (d) {
                    return d != null;
                });
                this.DisplayedValues = SurveyTreeService.getOrderedOptions(this.QuestionID, this.VariableName);
            } else {
                this.Values = values.filter(function (d) {
                    return d != null;
                });
                if (variableType == Enums.VariableType.SingleChoice || variableType == Enums.VariableType.MultipleChoice) {
                    this.DisplayedValues = SurveyTreeService.getOrderedOptions(this.QuestionID, this.VariableName);
                }
            }
            this.VariableType = variableType;
            this.QuestionID = questionGUID;
            // If variable is hidden and value is set by setValue then its masking bit should be false else it won't show in analysis.
            this.IsMasked = false;
        }

        Answer.prototype.GetValue = function () {
            if (!respondent.Answers.hasOwnProperty(this.VariableName))
                return null;

            if (Array.isArray(this.Values) && this.Values.length > 0) {
                // In case of numeric/category return parsed value.
                if (this.VariableType == Enums.VariableType.MultipleChoice) {
                    return this.Values.slice();
                } else if (this.VariableType == Enums.VariableType.Numeric) {
                    return parseFloat(this.Values[0]);
                } else {
                    return this.Values[0];
                }
            }

            return null;
        }

        Answer.prototype.SelectedValues = function () {
            var addedCodes = arguments[0] || [];
            if (!respondent.Answers.hasOwnProperty(this.VariableName))
                return [];

            if (Array.isArray(this.Values)) {
                return intersect(this.DisplayedValues, union(this.Values, addedCodes));
            }

            return [];
        }

        Answer.prototype.UnSelectedValues = function () {
            var addedCodes = arguments[0] || [];
            if (!respondent.Answers.hasOwnProperty(this.VariableName))
                return [];

            if (Array.isArray(this.Values) && Array.isArray(this.DisplayedValues)) {
                if (Array.isArray(addedCodes) && addedCodes.length > 0) {
                    return intersect(addedCodes, difference(this.DisplayedValues, this.Values));
                }
                return difference(this.DisplayedValues, this.Values);
            }

            return [];
        }

        Answer.prototype.AllDisplayedValues = function () {
            if (Array.isArray(this.DisplayedValues)) {
                return this.DisplayedValues.slice();
            }

            return [];
        }

        Answer.prototype.NotDisplayedValues = function () {
            if (Array.isArray(this.Values) && Array.isArray(this.DisplayedValues)) {
                var allOptions = SurveyTreeService.getAllOptions(this.QuestionID, this.VariableName);
                return difference(allOptions, this.DisplayedValues);
            }

            return [];
        }

        Answer.prototype.AllValues = function () {
            return SurveyTreeService.getAllOptions(this.QuestionID, this.VariableName) || [];
        }

        /*
         *  This functions are applicable for Category Type Questions
         * */
        Answer.prototype.ItemSelected = function () {
            if (this.IsMasked)
                return false;

            var args = Array.prototype.slice.call(arguments);
            var intersectedValues = intersect(this.Values, this.DisplayedValues);
            return intersectedValues.hasItem(args[0]);
        }

        Answer.prototype.AnyItemsSelected = function () {
            if (this.IsMasked)
                return false;

            var args = Array.prototype.slice.call(arguments);
            var intersectedValues = intersect(this.Values, this.DisplayedValues);
            return args.reduce(function (pre, val) {
                return pre || intersectedValues.hasItem(val);
            }, false);
        }

        Answer.prototype.AllItemsSelected = function () {
            if (this.IsMasked)
                return false;

            var args = Array.prototype.slice.call(arguments);
            var intersectedValues = intersect(this.Values, this.DisplayedValues);
            return args.reduce(function (pre, val) {
                return pre && intersectedValues.hasItem(val);
            }, true);
        }

        Answer.prototype.SelectedCount = function () {
            if (this.IsMasked)
                return 0;

            var selectedValues = r(this.VariableName).GetValue();
            if (Array.isArray(selectedValues))
                return selectedValues.length;

            return 0;
        }

        Answer.prototype.ItemDisplayed = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre && answer.DisplayedValues.hasItem(val);
            }, true);
        }

        Answer.prototype.AnyItemsDisplayed = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre || answer.DisplayedValues.hasItem(val);
            }, false);
        }

        Answer.prototype.AllItemsDisplayed = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre && answer.DisplayedValues.hasItem(val);
            }, true);
        }

        /*
         *  This functions are applicable for All Questions
         * */

        /*
         *  Checks if the variable was displayed to the respondent.
         * */
        Answer.prototype.Displayed = function () {
            if (this.IsMasked) {
                return false;
            }
            return true;
        }

        Answer.prototype.NotDisplayed = function () {
            return !this.Displayed();
        }

        Answer.prototype.Answered = function () {
            if (this.IsMasked)
                return false;

            if (Array.isArray(this.Values) && this.Values.length > 0) {
                // for category type question is answered only if intersection of displayed and answered values has item.
                if (this.VariableType == Enums.VariableType.SingleChoice || this.VariableType == Enums.VariableType.MultipleChoice) {
                    var intersectedValues = intersect(this.Values, this.DisplayedValues);
                    return intersectedValues.length > 0;
                }

                return true;
            }
            return false;
        }

        Answer.prototype.NotAnswered = function () {
            return !this.Answered();
        }

        /*
         *  Applicable for Numeric type Questions
         * */
        Answer.prototype.NumberGreaterThan = function () {
            if (this.IsMasked)
                return false;

            if (parseFloat(this.Values[0]) > parseFloat(arguments[0])) {
                return true
            }
            return false;
        }

        Answer.prototype.NumberGreaterThanOrEqualTo = function () {
            if (this.IsMasked)
                return false;

            if (parseFloat(this.Values[0]) >= parseFloat(arguments[0])) {
                return true
            }
            return false;
        }

        Answer.prototype.NumberLessThan = function () {
            if (this.IsMasked)
                return false;

            if (parseFloat(this.Values[0]) < parseFloat(arguments[0])) {
                return true
            }
            return false;
        }

        Answer.prototype.NumberLessThanOrEqualTo = function () {
            if (this.IsMasked)
                return false;

            if (parseFloat(this.Values[0]) <= parseFloat(arguments[0])) {
                return true
            }
            return false;
        }

        Answer.prototype.NumberEqualTo = function () {
            if (this.IsMasked)
                return false;

            if (parseFloat(this.Values[0]) == parseFloat(arguments[0])) {
                return true
            }
            return false;
        }

        Answer.prototype.DateGreaterThan = function () {
            if (this.IsMasked)
                return false;

            // TODO : Change date in same format as respondent then compare
            if (arguments[0] > this.Values[0]) {
                return true;
            }
            return false;
        }

        Answer.prototype.DateGreaterThanOrEqualTo = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre && answer.Values.indexOf(val);
            }, false);
        }

        Answer.prototype.DateLessThan = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre && answer.Values.indexOf(val);
            }, false);
        }

        Answer.prototype.DateLessThanOrEqualTo = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre && answer.Values.indexOf(val);
            }, false);
        }

        Answer.prototype.DateEqualTo = function () {
            if (this.IsMasked)
                return false;

            var answer = this;
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (pre, val) {
                return pre && answer.Values.indexOf(val);
            }, false);
        }

        Answer.prototype.TextEqualTo = function () {
            if (this.IsMasked)
                return false;

            if (this.Values.length > 0 && arguments[0].toLowerCase() === this.Values[0].toLowerCase()) {
                return true
            }
            return false;
        }

        Answer.prototype.TextContains = function () {
            if (this.IsMasked)
                return false;

            if (this.Values.length > 0 && this.Values[0].toLowerCase().indexOf(arguments[0].toLowerCase()) > -1) {
                return true;
            }
            return false;
        }

        Answer.prototype.TextDoesNotContain = function () {
            if (this.IsMasked)
                return true;

            if (this.Values.length > 0 && this.Values[0].toLowerCase().indexOf(arguments[0].toLowerCase()) === -1) {
                return true;
            }
            return false;
        }

        Answer.prototype.TextMatchesRegex = function () {
            if (this.IsMasked)
                return false;

            var regex = arguments[0];
            var regExp = new RegExp(regex);
            if (this.Values.length > 0 && regExp.test(this.Values[0])) {
                return true
            }
            return false;
        }

        Answer.prototype.Jump = function (value) {
            return value;
        }

        /*
         *   Text piping methods
         * */
        Answer.prototype.GetSelectedCasesText = function () {
            if (this.VariableType == Enums.VariableType.SingleChoice ||
                this.VariableType == Enums.VariableType.MultipleChoice) {

                var text = [];
                var intersectedValues = [];
                if (!SurveyTreeService.isSurveyQuestion(this.QuestionID)) {
                    intersectedValues = this.Values;
                } else {
                    intersectedValues = intersect(this.Values, this.DisplayedValues);
                }
                for (var i = 0; i < intersectedValues.length; i++) {
                    text.push(SurveyTreeService.getText(this.QuestionID, this.VariableName, intersectedValues[i]));
                }
                if (text.indexOf(null) > -1) {
                    return undefined;
                }

                return text.join(', ');
            }
            return "";
        }

        Answer.prototype.GetUnselectedCasesText = function () {
            if (this.VariableType == Enums.VariableType.SingleChoice ||
                this.VariableType == Enums.VariableType.MultipleChoice) {

                var text = [];
                var selectedChoices = [];
                if (!SurveyTreeService.isSurveyQuestion(this.QuestionID)) {
                    selectedChoices = this.Values;
                } else {
                    selectedChoices = intersect(this.Values, this.DisplayedValues);
                }
                for (var i = 0; i < this.DisplayedValues.length; i++) {
                    // if the selected choice is not in the displayed values then means it was answered else not
                    if (selectedChoices.hasItem(this.DisplayedValues[i]) === -1)
                        text.push(SurveyTreeService.getText(this.QuestionID, this.VariableName, this.DisplayedValues[i]));
                }
                if (text.indexOf(null) > -1) {
                    return undefined;
                }

                return text.join(', ');
            }
            return "";
        }

        Answer.prototype.GetChoicesText = function () {
            var text = [];
            var allOptions = SurveyTreeService.getAllOptions(this.QuestionID, this.VariableName);
            for (var i = 0; i < allOptions.length; i++) {
                text.push(SurveyTreeService.getText(this.QuestionID, this.VariableName, allOptions[i]));
            }
            if (text.indexOf(null) > -1) {
                return undefined;
            }

            return text.join(', ');
        }

        Answer.prototype.GetDisplayedChoicesText = function () {

            if (this.VariableType == Enums.VariableType.SingleChoice ||
                this.VariableType == Enums.VariableType.MultipleChoice) {

                var text = [];
                for (var i = 0; i < this.DisplayedValues.length; i++) {
                    text.push(SurveyTreeService.getText(this.QuestionID, this.VariableName, this.DisplayedValues[i]));
                }
                if (text.indexOf(null) > -1) {
                    return undefined;
                }

                return text.join(', ');
            }
            return "";
        }

        Answer.prototype.GetNotDisplayedChoicesText = function () {
            if (this.VariableType == Enums.VariableType.SingleChoice ||
                this.VariableType == Enums.VariableType.MultipleChoice) {

                var text = [];
                var allOptions = SurveyTreeService.getAllOptions(this.QuestionID, this.VariableName);
                for (var i = 0; i < allOptions.length; i++) {
                    if (this.DisplayedValues.indexOf(allOptions[i]) === -1)
                        text.push(SurveyTreeService.getText(this.QuestionID, this.VariableName, this.DisplayedValues[i]));
                }
                if (text.indexOf(null) > -1) {
                    return undefined;
                }

                return text.join(', ');
            }
            return "";
        }

        Answer.prototype.GetLoopText = function () {
            var optCode = arguments[0];
            if (optCode) {
                return r(this.VariableName).GetOptionText(optCode);
            }
            return "";
        }

        Answer.prototype.GetLoopIteration = function () {
            return vm.GetCurrentIteration();
        }

        Answer.prototype.GetLoopCount = function () {
            return Array.isArray(this.Values) ? this.Values.length : 0;
        }

        Answer.prototype.GetQuestionText = function () {
            var qid = arguments[0] || this.QuestionID;
            var text = SurveyTreeService.getText(qid);
            if (text === null) {
                setTimeout(function () {
                    text = SurveyTreeService.getText(qid);
                }, 0);
            } else {
                return text;
            }
        }

        Answer.prototype.GetOptionText = function () {
            var optCode = arguments[0];
            var context = arguments[1] || this;
            var otherVar = SurveyTreeService.getOtherVariable(context.QuestionID, context.VariableName, optCode);
            if (otherVar === null) {
                var text = SurveyTreeService.getText(context.QuestionID, context.VariableName, optCode);
                if (text === null) {
                    setTimeout(function () {
                        text = SurveyTreeService.getText(context.QuestionID, context.VariableName, optCode);
                    }, 0);
                } else {
                    return text;
                }
            } else {
                return r(otherVar).GetAnswerText();
            }
        }

        Answer.prototype.GetOtherOptionText = function () {
            var otherVar = SurveyTreeService.getOtherVariable(this.QuestionID, this.VariableName, arguments[0]);
            return r(otherVar).GetAnswerText();
        }

        Answer.prototype.GetAnswerText = function () {
            var context = arguments[0] || this;
            if (!Array.isArray(this.Values) || this.Values.length == 0) {
                return "";
            }
            // If category return first answered value
            // For other type return the text.
            if (this.VariableType == Enums.VariableType.SingleChoice ||
                this.VariableType == Enums.VariableType.MultipleChoice) {

                var text = SurveyTreeService.getText(this.QuestionID, this.VariableName, this.Values[0]);
                if (text === null) {
                    setTimeout(function () {
                        text = SurveyTreeService.getText(context.QuestionID, context.VariableName, context.Values[0]);
                    }, 0);
                } else {
                    return text;
                }
            } else {
                return this.Values[0];
            }
        }

        // Utility functions for advance scripting

        Answer.prototype.ClearValue = function () {
            this.Values = [];
            if (this.VariableType == Enums.VariableType.SingleChoice || this.VariableType == Enums.VariableType.MultipleChoice)
                this.DisplayedValues = [];
        }

        Answer.prototype.Intersection = function () {
            var args = Array.prototype.slice.call(arguments);
            if (!Array.isArray(this.Values) || args.length == 0)
                return [];

            return args.reduce(function (prev, n) {
                if (!Array.isArray(n))
                    n = [n];
                return intersect(prev, n);
            }, this.Values);
        }

        Answer.prototype.Union = function () {
            var args = Array.prototype.slice.call(arguments);
            if (!Array.isArray(this.Values) || args.length == 0)
                return [];

            return args.reduce(function (prev, n) {
                if (!Array.isArray(n))
                    n = [n];
                return union(prev, n);
            }, this.Values);
        }

        // Find the difference between the answered values and passed array of values.
        Answer.prototype.Difference = function () {
            var args = Array.prototype.slice.call(arguments);
            if (!Array.isArray(this.Values) || args.length == 0)
                return [];

            return args.reduce(function (prev, n) {
                if (!Array.isArray(n))
                    n = [n];
                return difference(prev, n);
            }, this.Values);
        }

        Answer.prototype.Unique = function () {
            if (!Array.isArray(this.Values))
                return [];

            return unique(this.Values);
        }

        Answer.prototype.GetRandomSet = function () {
            if (!Array.isArray(this.Values))
                return [];

            return pickXRandom(vm.GetSeed(), this.Values, arguments[0]);
        }

        Answer.prototype.GetLatitude = function () {
            return CommunicationService.GetLatitude();
        };

        Answer.prototype.GetLongitude = function () {
            return CommunicationService.GetLongitude();
        };


        function codeLatLng(lat, lng) {
            var deferred = $q.defer();
            var reverseCode = {
                City: null,
                Region: null,
                Country: null
            };

            try {
                var geocoder = new google.maps.Geocoder();
                var latlng = new google.maps.LatLng(lat, lng);
                geocoder.geocode({
                    'latLng': latlng
                }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            //find country name
                            for (var i = 0; i < results[0].address_components.length; i++) {
                                for (var b = 0; b < results[0].address_components[i].types.length; b++) {

                                    //there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
                                    if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
                                        //this is the object you are looking for
                                        reverseCode.Region = results[0].address_components[i].long_name;
                                        break;
                                    }
                                    if (results[0].address_components[i].types[b] == "administrative_area_level_2") {
                                        //this is the object you are looking for
                                        reverseCode.City = results[0].address_components[i].long_name;
                                        break;
                                    }
                                    if (results[0].address_components[i].types[b] == "country") {
                                        //this is the object you are looking for
                                        reverseCode.Country = results[0].address_components[i].long_name;
                                        break;
                                    }
                                }
                            }
                            deferred.resolve(reverseCode);
                        } else {
                            console.log("No results found");
                        }
                    } else {
                        console.log("Geocoder failed due to: " + status);
                    }
                });
            } catch (e) {
                // Error while getting GeoLocation from Lat/Long
                deferred.reject();
            }

            return deferred.promise;
        }

        function StopWatch() {
            var totalElapsedMs = 0;
            var elapsedMs = 0;
            var startTime;
            var timerPromise;

            this.start = function () {
                if (!timerPromise) {
                    startTime = new Date();
                    timerPromise = window.setInterval(function () {
                        var now = new Date();
                        elapsedMs = now.getTime() - startTime.getTime();
                    }, 31);
                }
            };
            this.stop = function () {
                if (timerPromise) {
                    window.clearInterval(timerPromise);
                    timerPromise = undefined;
                    totalElapsedMs += elapsedMs;
                    elapsedMs = 0;
                }
            };
            this.reset = function () {
                startTime = new Date();
                totalElapsedMs = elapsedMs = 0;
            };
            this.getElapsedMs = function () {
                return totalElapsedMs + elapsedMs;
            };
            this.getElapsedTimeInSeconds = function (prev) {
                return parseInt((totalElapsedMs + elapsedMs) / 1000) + parseInt(prev);
            }
        }

        Object.defineProperty(Array.prototype, "hasItem", {
            enumerable: false,
            writable: true,
            value: function () {
                var value = arguments[0];
                for (var i = 0; i < this.length; i++) {
                    if (this[i] == value)
                        return true;
                }
                return false;
            }
        });

        Object.defineProperty(Array.prototype, "getIndexOf", {
            enumerable: false,
            writable: true,
            value: function () {
                var value = arguments[0];
                for (var i = 0; i < this.length; i++) {
                    if (this[i] == value)
                        return i;
                }
                return -1;
            }
        });

        function intersect(array1, array2) {
            return array1.filter(function (n) {
                return array2.hasItem(n);
            });
        }

        function union(x, y) {
            var obj = {};
            for (var i = x.length - 1; i >= 0; --i)
                obj[x[i]] = x[i];
            for (var i = y.length - 1; i >= 0; --i)
                obj[y[i]] = y[i];
            var res = [];
            for (var k in obj) {
                res.push(obj[k]);
            }
            return res;
        }

        function difference(array1, array2) {
            return array1.filter(function (n) {
                return !array2.hasItem(n);
            });
        }

        function unique(array) {
            var u = {},
                a = [];
            for (var i = 0, l = array.length; i < l; ++i) {
                if (u.hasOwnProperty(array[i])) {
                    continue;
                }
                a.push(array[i]);
                u[array[i]] = 1;
            }
            return a;
        }

        function pickXRandom(id, array, x) {
            var chance = new Chance(id);
            var shuffle = chance.shuffle(array);
            if (typeof x == "number" && x < shuffle.length)
                shuffle.length = x;
            return shuffle;
        }

        (function (window) {
            {
                var unknown = '-';

                // screen
                var screenSize = '';
                if (screen.width) {
                    var width = (screen.width) ? screen.width : '';
                    var height = (screen.height) ? screen.height : '';
                    screenSize += '' + width + " x " + height;
                }

                // browser
                var nVer = navigator.appVersion;
                var nAgt = navigator.userAgent;
                var browser = navigator.appName;
                var version = '' + parseFloat(navigator.appVersion);
                var majorVersion = parseInt(navigator.appVersion, 10);
                var nameOffset, verOffset, ix;

                // Opera
                if ((verOffset = nAgt.indexOf('Opera')) != -1) {
                    browser = 'Opera';
                    version = nAgt.substring(verOffset + 6);
                    if ((verOffset = nAgt.indexOf('Version')) != -1) {
                        version = nAgt.substring(verOffset + 8);
                    }
                }
                // Opera Next
                if ((verOffset = nAgt.indexOf('OPR')) != -1) {
                    browser = 'Opera';
                    version = nAgt.substring(verOffset + 4);
                }
                // Edge
                else if ((verOffset = nAgt.indexOf('Edge')) != -1) {
                    browser = 'Microsoft Edge';
                    version = nAgt.substring(verOffset + 5);
                }
                // MSIE
                else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
                    browser = 'Microsoft Internet Explorer';
                    version = nAgt.substring(verOffset + 5);
                }
                // Chrome
                else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
                    browser = 'Chrome';
                    version = nAgt.substring(verOffset + 7);
                }
                // Safari
                else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
                    browser = 'Safari';
                    version = nAgt.substring(verOffset + 7);
                    if ((verOffset = nAgt.indexOf('Version')) != -1) {
                        version = nAgt.substring(verOffset + 8);
                    }
                }
                // Firefox
                else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
                    browser = 'Firefox';
                    version = nAgt.substring(verOffset + 8);
                }
                // MSIE 11+
                else if (nAgt.indexOf('Trident/') != -1) {
                    browser = 'Microsoft Internet Explorer';
                    version = nAgt.substring(nAgt.indexOf('rv:') + 3);
                }
                // Other browsers
                else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                    browser = nAgt.substring(nameOffset, verOffset);
                    version = nAgt.substring(verOffset + 1);
                    if (browser.toLowerCase() == browser.toUpperCase()) {
                        browser = navigator.appName;
                    }
                }
                // trim the version string
                if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
                if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
                if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

                majorVersion = parseInt('' + version, 10);
                if (isNaN(majorVersion)) {
                    version = '' + parseFloat(navigator.appVersion);
                    majorVersion = parseInt(navigator.appVersion, 10);
                }

                // mobile version
                var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

                // system
                var os = unknown;
                var clientStrings = [{
                        s: 'Windows 10',
                        r: /(Windows 10.0|Windows NT 10.0)/
                    },
                    {
                        s: 'Windows 8.1',
                        r: /(Windows 8.1|Windows NT 6.3)/
                    },
                    {
                        s: 'Windows 8',
                        r: /(Windows 8|Windows NT 6.2)/
                    },
                    {
                        s: 'Windows 7',
                        r: /(Windows 7|Windows NT 6.1)/
                    },
                    {
                        s: 'Windows Vista',
                        r: /Windows NT 6.0/
                    },
                    {
                        s: 'Windows Server 2003',
                        r: /Windows NT 5.2/
                    },
                    {
                        s: 'Windows XP',
                        r: /(Windows NT 5.1|Windows XP)/
                    },
                    {
                        s: 'Windows 2000',
                        r: /(Windows NT 5.0|Windows 2000)/
                    },
                    {
                        s: 'Windows ME',
                        r: /(Win 9x 4.90|Windows ME)/
                    },
                    {
                        s: 'Windows 98',
                        r: /(Windows 98|Win98)/
                    },
                    {
                        s: 'Windows 95',
                        r: /(Windows 95|Win95|Windows_95)/
                    },
                    {
                        s: 'Windows NT 4.0',
                        r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
                    },
                    {
                        s: 'Windows CE',
                        r: /Windows CE/
                    },
                    {
                        s: 'Windows 3.11',
                        r: /Win16/
                    },
                    {
                        s: 'Android',
                        r: /Android/
                    },
                    {
                        s: 'Open BSD',
                        r: /OpenBSD/
                    },
                    {
                        s: 'Sun OS',
                        r: /SunOS/
                    },
                    {
                        s: 'Linux',
                        r: /(Linux|X11)/
                    },
                    {
                        s: 'iOS',
                        r: /(iPhone|iPad|iPod)/
                    },
                    {
                        s: 'Mac OS X',
                        r: /Mac OS X/
                    },
                    {
                        s: 'Mac OS',
                        r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
                    },
                    {
                        s: 'QNX',
                        r: /QNX/
                    },
                    {
                        s: 'UNIX',
                        r: /UNIX/
                    },
                    {
                        s: 'BeOS',
                        r: /BeOS/
                    },
                    {
                        s: 'OS/2',
                        r: /OS\/2/
                    },
                    {
                        s: 'Search Bot',
                        r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
                    }
                ];
                for (var id in clientStrings) {
                    var cs = clientStrings[id];
                    if (cs.r.test(nAgt)) {
                        os = cs.s;
                        break;
                    }
                }

                var osVersion = unknown;

                var majorOSVersion = unknown;
                var minorOSVersion = unknown;

                if (/Windows/.test(os)) {
                    osVersion = /Windows (.*)/.exec(os)[1];
                    var versions = osVersion.split(".");
                    majorOSVersion = versions[0];
                    minorOSVersion = versions[1];
                    os = 'Windows';
                }

                switch (os) {
                    case 'Mac OS X':
                        osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                        try {
                            osVersion = osVersion.replace(/\_/g, '.');
                            var versions = osVersion.split(".");
                            majorOSVersion = versions[0];
                            minorOSVersion = versions[1];
                        } catch (e) {
                            console.log(e);
                        }
                        break;

                    case 'Android':
                        osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                        var versions = osVersion.split(".");
                        majorOSVersion = versions[0];
                        minorOSVersion = versions[1];
                        break;

                    case 'iOS':
                        osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                        osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                        var versions = osVersion.split(".");
                        majorOSVersion = versions[0];
                        minorOSVersion = versions[1];
                        break;
                }
                var osCode = getOSCode(os, majorOSVersion, minorOSVersion);
            }

            window.jsrcb = {
                screen: screenSize,
                browser: browser + " " + version,
                os: os + ' ' + osVersion,
                osCode: osCode,
                isMobile: mobile
            };
        }(window));

        // Get the Option Code based on the Os name, and its minor & major versions.
        function getOSCode(osName, major, minor) {
            var osCode = 46; // other
            var oses = {
                "windows": {
                    "10": 1,
                    "8.1": 2,
                    "8": 3,
                    "7": 4,
                    "Vista": 5,
                    "Server 2003": 6,
                    "XP": 7,
                    "2000": 8,
                    "ME": 9,
                    "98": 10,
                    "95": 11,
                    "NT 4.0": 12,
                    "CE": 13,
                    "3.11": 14
                },
                "android": {
                    "2.3": 15,
                    "3.0": 16,
                    "3.1": 16,
                    "3.2": 16,
                    "4.0": 17,
                    "4.1 ": 18,
                    "4.2": 18,
                    "4.3": 18,
                    "4.4": 19,
                    "5.0": 20,
                    "5.1": 20,
                    "5.2": 20,
                    "6.0": 21,
                    "7.0": 22,
                    "7.1": 22,
                },
                "mac os x": {
                    "10.6": 31,
                    "10.7": 32,
                    "10.8": 33,
                    "10.9": 34,
                    "10.10": 35,
                    "10.11": 36,
                    "10.12": 37
                },
                "ios": {
                    "3.0": 23,
                    "4.0": 24,
                    "5.0": 25,
                    "6.0": 26,
                    "7.0": 27,
                    "8.0": 28,
                    "9.0": 29,
                    "10.0": 30
                },
                "macos": {},
                'open bsd': 38,
                'sun os': 39,
                'linux': 40,
                'qnx': 41,
                'unix': 42,
                'beos': 43,
                'os/2': 44,
                'search bot': 45
            }

            for (var i in oses) {
                if (i.indexOf(osName.toLowerCase()) > -1) {
                    if (typeof oses[i] == "object") {
                        for (var v in oses[i]) {
                            if (minor == undefined && v.indexOf(major.toLowerCase()) > -1) {
                                osCode = oses[i][v];
                                break;
                            }
                            if (v.indexOf((major + "." + minor).toLowerCase()) > -1) {
                                osCode = oses[i][v];
                                break;
                            }
                        }
                    } else {
                        osCode = oses[i];
                        break;
                    }
                }
            }
            return osCode;
        }

        // Get Language code based on the language short code
        function getLangCode(language) {
            language = typeof language == "string" ? language.toLowerCase() : "";
            var map = {
                "af": 1,
                "af-za": 2,
                "sq": 3,
                "sq-al": 4,
                "gsw-fr": 5,
                "am-et": 6,
                "ar": 7,
                "ar-dz": 8,
                "ar-bh": 9,
                "ar-eg": 10,
                "ar-iq": 11,
                "ar-jo": 12,
                "ar-kw": 13,
                "ar-lb": 14,
                "ar-ly": 15,
                "ar-ma": 16,
                "ar-om": 17,
                "ar-qa": 18,
                "ar-sa": 19,
                "ar-sy": 20,
                "ar-tn": 21,
                "ar-ae": 22,
                "ar-ye": 23,
                "hy": 24,
                "hy-am": 25,
                "as-in": 26,
                "az": 27,
                "az-cyrl-az": 28,
                "az-latn-az": 29,
                "ba-ru": 30,
                "eu": 31,
                "eu-es": 32,
                "be": 33,
                "be-by": 34,
                "bn-bd": 35,
                "bn-in": 36,
                "bs-cyrl-ba": 37,
                "bs-latn-ba": 38,
                "br-fr": 39,
                "bg": 40,
                "bg-bg": 41,
                "ca": 42,
                "ca-es": 43,
                "zh-hk": 44,
                "zh-mo": 45,
                "zh-cn": 46,
                "zh-hans": 47,
                "zh-sg": 48,
                "zh-tw": 49,
                "zh-hant": 50,
                "co-fr": 51,
                "hr": 52,
                "hr-hr": 53,
                "hr-ba": 54,
                "cs": 55,
                "cs-cz": 56,
                "da": 57,
                "da-dk": 58,
                "prs-af": 59,
                "div": 60,
                "div-mv": 61,
                "nl": 62,
                "nl-be": 63,
                "nl-nl": 64,
                "en": 65,
                "en-au": 66,
                "en-bz": 67,
                "en-ca": 68,
                "en-029": 69,
                "en-in": 70,
                "en-ie": 71,
                "en-jm": 72,
                "en-my": 73,
                "en-nz": 74,
                "en-ph": 75,
                "en-sg": 76,
                "en-za": 77,
                "en-tt": 78,
                "en-gb": 79,
                "en-us": 80,
                "en-zw": 81,
                "et": 82,
                "et-ee": 83,
                "fo": 84,
                "fo-fo": 85,
                "fil-ph": 86,
                "fi": 87,
                "fi-fi": 88,
                "fr": 89,
                "fr-be": 90,
                "fr-ca": 91,
                "fr-fr": 92,
                "fr-lu": 93,
                "fr-mc": 94,
                "fr-ch": 95,
                "fy-nl": 96,
                "gl": 97,
                "gl-es": 98,
                "ka": 99,
                "ka-ge": 100,
                "de": 101,
                "de-at": 102,
                "de-de": 103,
                "de-li": 104,
                "de-lu": 105,
                "de-ch": 106,
                "el": 107,
                "el-gr": 108,
                "kl-gl": 109,
                "gu": 110,
                "gu-in": 111,
                "ha-latn-ng": 112,
                "he": 113,
                "he-il": 114,
                "hi": 115,
                "hi-in": 116,
                "hu": 117,
                "hu-hu": 118,
                "is": 119,
                "is-is": 120,
                "ig-ng": 121,
                "id": 122,
                "id-id": 123,
                "iu-latn-ca": 124,
                "iu-cans-ca": 125,
                "ga-ie": 126,
                "xh-za": 127,
                "zu-za": 128,
                "it": 129,
                "it-it": 130,
                "it-ch": 131,
                "ja": 132,
                "ja-jp": 133,
                "kn": 134,
                "kn-in": 135,
                "kk": 136,
                "kk-kz": 137,
                "km-kh": 138,
                "qut-gt": 139,
                "rw-rw": 140,
                "sw": 141,
                "sw-ke": 142,
                "kok": 143,
                "kok-in": 144,
                "ko": 145,
                "ko-kr": 146,
                "ky": 147,
                "ky-kg": 148,
                "lo-la": 149,
                "lv": 150,
                "lv-lv": 151,
                "lt": 152,
                "lt-lt": 153,
                "wee-de": 154,
                "lb-lu": 155,
                "mk": 156,
                "mk-mk": 157,
                "ms": 158,
                "ms-bn": 159,
                "ms-my": 160,
                "ml-in": 161,
                "mt-mt": 162,
                "mi-nz": 163,
                "arn-cl": 164,
                "mr": 165,
                "mr-in": 166,
                "moh-ca": 167,
                "mn": 168,
                "mn-mn": 169,
                "mn-mong-cn": 170,
                "ne-np": 171,
                "no": 172,
                "nb-no": 173,
                "nn-no": 174,
                "oc-fr": 175,
                "or-in": 176,
                "ps-af": 177,
                "fa": 178,
                "fa-ir": 179,
                "pl": 180,
                "pl-pl": 181,
                "pt": 182,
                "pt-br": 183,
                "pt-pt": 184,
                "pa": 185,
                "pa-in": 186,
                "quz-bo": 187,
                "quz-ec": 188,
                "quz-pe": 189,
                "ro": 190,
                "ro-ro": 191,
                "rm-ch": 192,
                "ru": 193,
                "ru-ru": 194,
                "smn-fi": 195,
                "smj-no": 196,
                "smj-se": 197,
                "se-fi": 198,
                "se-no": 199,
                "se-se": 200,
                "sms-fi": 201,
                "sma-no": 202,
                "sma-se": 203,
                "sa": 204,
                "sa-in": 205,
                "sr": 206,
                "sr-cyrl-ba": 207,
                "sr-cyrl-sp": 208,
                "sr-latn-ba": 209,
                "sr-latn-sp": 210,
                "nso-za": 211,
                "tn-za": 212,
                "si-lk": 213,
                "sk": 214,
                "sk-sk": 215,
                "sl": 216,
                "sl-si": 217,
                "es": 218,
                "es-ar": 219,
                "es-bo": 220,
                "es-cl": 221,
                "es-co": 222,
                "es-cr": 223,
                "es-do": 224,
                "es-ec": 225,
                "es-sv": 226,
                "es-gt": 227,
                "es-hn": 228,
                "es-mx": 229,
                "es-ni": 230,
                "es-pa": 231,
                "es-py": 232,
                "es-pe": 233,
                "es-pr": 234,
                "es-es": 235,
                "es-us": 236,
                "es-uy": 237,
                "es-ve": 238,
                "sv": 239,
                "sv-fi": 240,
                "sv-se": 241,
                "syr": 242,
                "syr-sy": 243,
                "tg-cyrl-tj": 244,
                "tzm-latn-dz": 245,
                "ta": 246,
                "ta-in": 247,
                "tt": 248,
                "tt-ru": 249,
                "te": 250,
                "te-in": 251,
                "th": 252,
                "th-th": 253,
                "bo-cn": 254,
                "tr": 255,
                "tr-tr": 256,
                "tk-tm": 257,
                "ug-cn": 258,
                "uk": 259,
                "uk-ua": 260,
                "wen-de": 261,
                "ur": 262,
                "ur-pk": 263,
                "uz": 264,
                "uz-cyrl-uz": 265,
                "uz-latn-uz": 266,
                "vi": 267,
                "vi-vn": 268,
                "cy-gb": 269,
                "wo-sn": 270,
                "sah-ru": 271,
                "ii-cn": 272,
                "yo-ng": 273
            };
            return map[language];
        }

        function allowLocalStorage() {
            return respondent.Answers.Channel.Values[0] == Enums.Channel.AnonymousLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.AnonymousEmailCampaignLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.AnonymousSMSCampaignLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.FacebookLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.TwitterLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.LinkedinLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.GooglePlusLink ||
                respondent.Answers.Channel.Values[0] == Enums.Channel.PanelLink;
        }

        function isInvalidVariableName(name) {
            return name == undefined || name == null || name == "";
        }
    }
})(angular);