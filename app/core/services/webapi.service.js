(function (angular) {

    "use strict";

    angular
        .module("SurveyEngineCore")
        .service("EngineCore.WebAPIService", ['$http', '$q', 'SurveyEngine.APIPathConstants', webService]);

    function webService($http, $q, APIPathConstants) {
        var vm = this;
        vm.BaseURL = APIPathConstants.BaseURL;
        vm.MediaUrl = APIPathConstants.MediaUrl;
        vm.AppInsightsKey = APIPathConstants.AppInsightsKey;

        vm.SetAPIPath = setProjectSubGUID;
        vm.SetSurveyAPI = setSurveyAPI;
        vm.Get = get;
        vm.Put = put;
        vm.Post = post;
        vm.Delete = deleteAPICall;
        vm.PostAndGetHeaders = postAndGetHeaders;
        vm.UploadFile = uploadFile;
        vm.SaveMedia = saveMedia;
        vm.GetMedia = getMedia;
        // Setting Auth in the headers
        // $http.defaults.headers.common['Authorization'] = 'Bearer' + token;

        function setProjectSubGUID(projectGUID, subsID) {
            vm.API = vm.BaseURL + "v3/Subscriptions/" + subsID + "/Projects/" + projectGUID;

            vm.mediaAPIPath = vm.API + "/media";
            vm.capturedMediaAPIPath = vm.API + "/mediadata/";
        }

        function setSurveyAPI(versionNumber) {
            vm.SurveyAPI = vm.API + "/Survey/" + versionNumber + "/";
        }

        function get(url) {
            var deferred = $q.defer();
            $http.get(url).then(function (response) {
                deferred.resolve(response.data);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function put(url, data) {
            var deferred = $q.defer();
            $http.put(url, data).then(function (response) {
                deferred.resolve(response.data);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function post(url, data) {
            var deferred = $q.defer();
            $http.post(url, data).then(function (response) {
                deferred.resolve(response.data);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function postAndGetHeaders(url, data) {
            var deferred = $q.defer();
            $http.post(url, data).then(function (response) {
                deferred.resolve(response.headers("location") || response.data);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function deleteAPICall(url, data) {
            var deferred = $q.defer();
            $http.delete(url, data).then(function (response) {
                deferred.resolve(response.data);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function uploadFile(url, formData) {
            var config = {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            };

            return $http.post(url, formData, config);
        }

        //uploading media
        function saveMedia(formData, respID) {
            var url = vm.capturedMediaAPIPath + respID;
            var deferred = $q.defer();
            uploadFile(url, formData).then(function (response) {
                deferred.resolve(response);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        //get media
        function getMedia(fileName, respID) {
            var deferred = $q.defer();
            var url = vm.capturedMediaAPIPath + respID + "?filename=" + fileName;
            get(url, {
                responseType: 'arraybuffer'
            }).then(function (data) {
                deferred.resolve(data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }
    }
})(angular);