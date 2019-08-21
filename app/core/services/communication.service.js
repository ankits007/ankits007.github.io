(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name module.service:service
     * @requires other
     **/
    angular.module('SurveyEngineCore').service('EngineCore.CommunicationService', ['$q', 'EngineCore.WebAPIService', 'EngineCore.IOService','SurveyEngine.ValidatorService', communicationService]);

    function communicationService($q, WebApiService, IOService, ValidatorService) {

        var vm = this, FULL_QUESTIONNAIRE;

        vm.ANDROID = 1;
        vm.WEB = 2;

        vm.PLATFORM = 2; //WEB

        // Default Online mode
        var ComService = WebApiService;

        vm.InitPlatform = function() {
            if (vm.PLATFORM === vm.WEB) {
                ComService = WebApiService;
            } else if (vm.PLATFORM === vm.ANDROID) {
                ComService = IOService;
            }
        }


        vm.UpdateAPIPath = function(projectGuid, subId) {
            if (vm.PLATFORM == vm.WEB) {
                ComService.SetAPIPath(projectGuid, subId);
                vm.MediaURL = ComService.MediaUrl + subId + "/" + projectGuid + "/multimediaassets/";
                //vm.MediaURL = "https://rebuscloudlivestorage.blob.core.windows.net/rebuscloud-v3-test-blobcontainerpublic/" + subId + "/" + projectGuid + "/multimediaassets/";
                // vm.MediaURL = RCAPI.PublicURL + subId + "/" + projectGuid + "/multimediaassets/";
            }else{
                ComService.SetAPIPath(projectGuid, subId);
            }
        }

        vm.UpdateSurveyAPI = function(versionNumber) {
            ComService.SetSurveyAPI(versionNumber);
        }

        vm.Authenticate = function(pass) {
            var deferred = $q.defer();
            var apiPath = ComService.API + '/Survey/SurveyProperties/CheckSurveyPassword';
            //  var data = {"password" : pass};
            ComService.Post(apiPath, JSON.stringify(pass)).then(function(data) {
                deferred.resolve(data);
            }, function(reject) {
                deferred.reject();
            });
            return deferred.promise;
        }

        vm.GetSurveyProperties = function() {
            var deferred = $q.defer();
            var apiPath = ComService.API + '/Survey/SurveyProperties/';
            ComService.Get(apiPath).then(function(data) {
                deferred.resolve(data);
            }, function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        vm.UpdateSurveyProperties = function(surveyProperties) {
            var deferred = $q.defer();
            var apiPath = ComService.API + '/Survey/SurveyProperties/';
            ComService.Put(apiPath, surveyProperties).then(function(data) {
                deferred.resolve();
            }, function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        vm.IsSurveyActive = function(campaignID) {
            var deferred = $q.defer();
            var apiPath = ComService.API + '/Data/Expiry';
            if (campaignID) {
                apiPath += "?campaignID=" + campaignID;
            }
            ComService.Get(apiPath).then(function(data) {
                deferred.resolve(data);
            }, function(err) {
                deferred.reject(err)
            });

            return deferred.promise;
        }

        vm.CreateRespondent = function(resp, uid, rid) {
            var deferred = $q.defer();
            var apiPath = ComService.API + '/Data';
            if(uid && rid){
                apiPath += '?sessionid=' + uid + '&rId=' + rid;
            }
            ComService.PostAndGetHeaders(apiPath, resp).then(function(data) {
                deferred.resolve(data);
            }, function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        vm.GetRespondent = function(path, respID, source, uid) {
            var deferred = $q.defer();
            if (!path) {
                path = ComService.API + '/Data/' + respID + '?source=' + source + '&sessionid=' + uid;
            }
            if(uid){
                path += '&sessionid=' + uid;
            }
            ComService.Get(path).then(function(data) {
                deferred.resolve(data);
            },function(err){
                deferred.reject(err);
            });

            return deferred.promise;
        }

        vm.UpdateRespondent = function(resp, id, action, uid) {
            var deferred = $q.defer();
            var apiPath = ComService.API + '/Data/' + id;
            if (action) {
                apiPath += "?action=" + action;
            }
            if(uid){
                apiPath += '&sessionid=' + uid;
            }
            ComService.Put(apiPath, resp, id).then(function(data) {
                deferred.resolve(data);
            }, function(err){
                deferred.reject(err);
            });
            return deferred.promise;
        }

        vm.GetSurveyTree = function(treeType) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'SurveyTree/' + treeType;
            ComService.Get(apiPath).then(function(data) {
                deferred.resolve(data.RootNodes);
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }


        vm.GetSection = function(sectionId) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Sections/' + sectionId;
            if(typeof FULL_QUESTIONNAIRE == "object" && sectionId in FULL_QUESTIONNAIRE){
                deferred.resolve(FULL_QUESTIONNAIRE[sectionId]);
            }else{
                ComService.Get(apiPath, sectionId).then(function(data) {
                    deferred.resolve(data);
                });
            }
            return deferred.promise;
        }

        vm.GetQuestion = function(questionId) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Questions/' + questionId;
            if(typeof FULL_QUESTIONNAIRE == "object" && questionId in FULL_QUESTIONNAIRE){
                deferred.resolve(FULL_QUESTIONNAIRE[questionId]);
            }else{
                ComService.Get(apiPath, questionId).then(function(data) {
                    deferred.resolve(data);
                });
            }
            return deferred.promise;
        }

        vm.GetScript = function(scriptId) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Scripts/' + scriptId;
            if(typeof FULL_QUESTIONNAIRE == "object" && scriptId in FULL_QUESTIONNAIRE){
                deferred.resolve(FULL_QUESTIONNAIRE[scriptId]);
            }else{
                ComService.Get(apiPath, scriptId).then(function(data) {
                    deferred.resolve(data);
                }, function() {
                    deferred.reject();
                });
            }
            return deferred.promise;
        }

        vm.GetSurveyEndNode = function(id) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'SurveyEnd/' + id;
            if(typeof FULL_QUESTIONNAIRE == "object" && id in FULL_QUESTIONNAIRE){
                deferred.resolve(FULL_QUESTIONNAIRE[id]);
            }else {
                ComService.Get(apiPath).then(function (data) {
                    deferred.resolve(data);
                });
            }
            return deferred.promise;
        }


        vm.GetMediaFiles = function(type, place) {
            var apiPath, deferred;
            apiPath = ComService.mediaAPIPath + "?type=" + type + "&place=" + place;
            deferred = $q.defer();

            ComService.Get(apiPath).then(function(response) {
                deferred.resolve(response);
            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        vm.UploadMedia = function(file, type, place) {
            var apiPath, deferred;
            deferred = $q.defer();
            apiPath = ComService.mediaAPIPath + "?type=" + type + "&place=" + place;
            var formData = new FormData();
            formData.append('file', file);
            var config = {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            };
            ComService.UploadFile(apiPath, formData, config).then(function(response) {
                deferred.resolve(response);

            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        vm.GetOS = function() {
            if (vm.PLATFORM == vm.ANDROID) {
                // device operating System
                return ComService.GetOS();
            } else if (vm.PLATFORM == vm.WEB) {
                return window.jsrcb.os;
            }
        }

        vm.SaveMedia = function(formData, respID, mediaType, qGuid){
            var deferred = $q.defer();
            ComService.SaveMedia(formData, respID, mediaType, qGuid).then(function(mediaPath){
                deferred.resolve(mediaPath);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        }

        vm.GetMedia = function(fileName, respID){
            var deferred = $q.defer();
            ComService.GetMedia(fileName, respID).then(function(mediaPath){
                deferred.resolve(mediaPath);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        }

        vm.GetQuotaNode = function (id) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Quota/' + id;
            if(typeof FULL_QUESTIONNAIRE == "object" && id in FULL_QUESTIONNAIRE){
                var quotaNode = {};
                if(!FULL_QUESTIONNAIRE[id].hasOwnProperty("Quota")){
                    quotaNode.Quota = FULL_QUESTIONNAIRE[id];
                }else{
                    quotaNode = FULL_QUESTIONNAIRE[id];
                }
                deferred.resolve(quotaNode);
            }else {
                ComService.Get(apiPath).then(function (data) {
                    var quotaNode = {};
                    if(!data.hasOwnProperty("Quota")){
                        quotaNode.Quota = data;
                    }else{
                        quotaNode = data;
                    }
                    deferred.resolve(quotaNode);
                });
            }
            return deferred.promise;
        }

        vm.CheckQuota = function (id, answers) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Quota/' + id;
            //  var data = {"password" : pass};
            ComService.Post(apiPath, JSON.stringify(answers)).then(function(data) {
                deferred.resolve(data);
            }, function(reject) {
                deferred.reject();
            });
            return deferred.promise;
        }

        vm.GetBulkQuota = function (ids) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Quota?quotaIds=' + ids.join(',');
            ComService.Get(apiPath).then(function(data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        }

        vm.CheckBulkQuota = function (ids) {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Quota/CheckQuotas';
            ComService.Post(apiPath, JSON.stringify(ids)).then(function(data) {
                deferred.resolve(data);
            }, function(reject) {
                deferred.reject();
            });
            return deferred.promise;
        }

        vm.StartRecording = function (name, time) {
            if (vm.PLATFORM == vm.ANDROID) {
                ComService.StartRecording(name, time);
            }
        }

        vm.StopRecording = function () {
            if (vm.PLATFORM == vm.ANDROID) {
                ComService.StopRecording();
            }
        }

        vm.CloseWebview = function (backCheck, isClose) {
            if (vm.PLATFORM == vm.ANDROID) {
                ComService.CloseWebview(backCheck, isClose);
            }
        }

        vm.GetFullQuestionnaire = function () {
            var deferred = $q.defer();
            var apiPath = ComService.SurveyAPI + 'Questions/GetAllQuestions';
            ComService.Get(apiPath).then(function(b64Data) {
                try{
                    // load decompressed file in case of ANDROID
                    if (vm.PLATFORM == vm.ANDROID){
                        try{
                            FULL_QUESTIONNAIRE = JSON.parse(b64Data);
                            deferred.resolve();
                        }catch (e){
                            // exception while parsing data only when the data is compressed and not a valid JSON
                            decompress(b64Data, deferred);
                        }
                    }else{
                        decompress(b64Data, deferred);
                    }
                }catch (e){
                    console.log('error while decoding questionnaire');
                    deferred.resolve();
                }
            }, function(reject) {
                // resolve the promise as full questionnaire will not be available in preview version or
                // for the old surveys for backward compatibility.
                deferred.resolve();
            });
            return deferred.promise;

            function decompress(b64Data, deferred) {
                require(['pako'], function () {
                    var strData     = atob(b64Data);
                    // Convert binary string to character-number array
                    var charData    = strData.split('').map(function(x){return x.charCodeAt(0);});
                    // Turn number array into byte-array
                    var binData     = new Uint8Array(charData);
                    // Pako magic
                    var data        = pako.inflate(binData);
                    // Convert gunzipped byteArray back to ascii string:
                    if(typeof TextDecoder == "function"){
                        var strData     =  new TextDecoder("utf-8").decode(data);
                        FULL_QUESTIONNAIRE = JSON.parse(strData);
                        deferred.resolve();
                    }else{
                        require(['encoder'], function () {
                            var strData     =  new TextDecoderLite("utf-8").decode(data);
                            FULL_QUESTIONNAIRE = JSON.parse(strData);
                            deferred.resolve();
                        });
                    }
                });
            }
        }

        vm.GetLatitude = function () {
            if (vm.PLATFORM == vm.ANDROID) {
                return ComService.GetLatitude();
            }
        }

        vm.GetLongitude = function () {
            if (vm.PLATFORM == vm.ANDROID) {
                return ComService.GetLongitude();
            }
        }

        vm.HitApi = function (path){
            var deferred = $q.defer();
            ComService.Get(path).then(function(res){
                deferred.resolve();
            },function(error){
                deferred.reject(error);
            })
            return deferred.promise;
        }

        vm.SendOTP = function(mobileNumber, respID, mode){
            var deferred = $q.defer();
            var path = ComService.API + "/otp/" + mobileNumber + "/" + respID +"?mode="+mode ;
            if(vm.PLATFORM == vm.WEB){
                ComService.Get(path).then(function(response){
                    ValidatorService.SetOTP(response);
                    deferred.resolve(response);
                },function(err){
                    deferred.reject(err);
                });
            }else if(vm.PLATFORM == vm.ANDROID){
                ComService.GetOTP(mobileNumber, respID, mode).then(function(response){
                    ValidatorService.SetOTP(response);
                    deferred.resolve(response);
                },function(err){
                    deferred.reject(err);
                });
            }
            return deferred.promise;
        }

    }


})(angular);