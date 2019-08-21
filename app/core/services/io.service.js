(function (angular) {

    "use strict";

    angular.module("SurveyEngineCore")
        .service("EngineCore.IOService", ['$http', '$q', 'SurveyEngine.Enums', ioService]);

    function ioService($http, $q, enums) {
        var vm = this;
        var otpPath = "";

        vm.MediaUrl = "https://rebuscloudlivestorage.blob.core.windows.net/rebuscloud-v3-live-blobcontainerpublic/";

        vm.SetSurveyAPI = setSurveyAPI;
        vm.SurveyAPI = "";
        vm.Get = get;
        vm.Put = update;
        vm.PostAndGetHeaders = postAndGetHeaders;
        vm.GetOS = getOS;
        vm.SaveMedia = saveMedia;
        vm.GetMedia = getMedia;
        vm.StartRecording = startRecording;
        vm.StopRecording = stopRecording;
        vm.Version = 1;
        vm.SetAPIPath = function (projectGUID, subsID) {
            otpPath = APIPathConstants.BaseURL + "v3/Subscriptions/" + subsID + "/Projects/" + projectGUID;
        };
        vm.CloseWebview = closeWebview;
        vm.GetLatitude = getLatitude;
        vm.GetLongitude = getLongitude;

        function setSurveyAPI(versionNumber) {
            vm.API = versionNumber + '/';
        }

        
        vm.GetOTP = function (mob, rid, mode) {
            var deferred = $q.defer();
            var path = otpPath + '/otp/' + mob + '/' + rid +"?mode="+mode; //"https://beta-v3-live-webrole.rebuscode.com/v3/Subscriptions/145/Projects/9923ada8-8ea6-0b25-536c-e309eaff861b/otp/" + mob + "/" + rid ;
            var promise = $http.get(path);
            promise.success(function (data) {
                deferred.resolve(data);
            });
            promise.error(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function get(url, id) {
            var data,
                deferred = $q.defer();
            setTimeout(function () {
                if (url.indexOf('GetAllQuestions') != -1) {
                    if (typeof DataService.getFullQuestionnaire == "function") {
                        data = DataService.getFullQuestionnaire(url);
                        if (data == "") {
                            deferred.reject();
                        } else {
                            deferred.resolve(data);
                        }
                        return;
                    } else {
                        deferred.reject();
                    }
                } else if (url.indexOf('SurveyProperties') !== -1) {
                    data = DataService.getSurveyProperties(url);
                } else if (url.indexOf('SurveyTree') !== -1) {
                    data = DataService.getSurveyTree(url);
                } else if (url.indexOf('Data') > -1) {
                    data = DataService.getRespondent();
                } else if (url.indexOf('Quota') > -1) {
                    url = url.replace('Quota', 'Quotas');
                    var quota = DataService.readJson(url);
                    data = {};
                    data.Quota = JSON.parse(quota);
                    deferred.resolve(data);
                } else {
                    data = DataService.readJson(url);
                }
                if (data != null && data != "") {
                    data = JSON.parse(data);
                }
                deferred.resolve(data);
            })

            return deferred.promise;
        }

        function update(url, data) {
            var deferred = $q.defer();
            setTimeout(function () {
                if (typeof data == "object") {
                    var action = url.split('=')[1];
                    DataService.updateRespondent(JSON.stringify(data), action);
                }
                deferred.resolve(data);
            })
            return deferred.promise;
        }

        function postAndGetHeaders(url, data) {
            var deferred = $q.defer();
            setTimeout(function () {
                if (data != undefined && data != "") {
                    data = JSON.stringify(data);
                }
                DataService.createRespondent(data);
                deferred.resolve();
            });
            return deferred.promise;
        }

        function getOS() {
            return DataService.getOS();
        }

        function saveMedia(data, respID, mediaType, qGuid) {
            var mediaPath,
                deferred = $q.defer();
            setTimeout(function () {
                mediaPath = DataService.performFileSearch(mediaType, qGuid);
                deferred.resolve(mediaPath);
            });
            return deferred.promise;
        }

        function getMedia(fileName) {
            var mediaPath,
                deferred = $q.defer();
            setTimeout(function () {
                mediaPath = DataService.getFilePath(fileName);
                deferred.resolve(mediaPath);
            });
            return deferred.promise;
        }

        function startRecording(name, time) {
            if (typeof DataService.startAudioRecording == "function") {
                DataService.startAudioRecording(name, time);
            }
        }

        function stopRecording() {
            if (typeof DataService.stopAudioRecording == "function") {
                DataService.stopAudioRecording();
            }
        }

        function closeWebview(backCheck, isClose) {
            if (typeof DataService.closeWebview == "function") {
                DataService.closeWebview(backCheck, isClose);
            }
        }

        function getLatitude() {
            if (typeof DataService.getLat == "function") {
                return parseFloat(DataService.getLat());
            }
        }

        function getLongitude() {
            if (typeof DataService.getLong == "function") {
                return parseFloat(DataService.getLong());
            }
        }
    }
})(angular);