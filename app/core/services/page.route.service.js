/**
 * Created by AnkitS on 2/20/2018.
 */

(function (angular) {
    'use strict';

    angular.module('SurveyEngineCore')
        .service("SurveyEngine.PageRouteService", ['SurveyEngine.Enums', routeService]);

    function routeService() {
        var vm = this,
            validationCallbacks = [],
            postValidation = null,
            warningCallback = null,
            beforeBackCallback = null,
            resetCallback = null,
            startupPageCallback = null;

        vm.AddStartUpPageCallback = function (callback) {
            startupPageCallback = callback;
        }

        vm.AddResetMovementCallback = function (callback) {
            resetCallback = callback;
        }

        vm.AddValidationCallback = function (callback) {
            if (typeof callback == "function") {
                validationCallbacks.push(callback);
            }
        };

        vm.AddPostValidationCallback = function (callback) {
            postValidation = callback;
        };

        vm.AddWarningCallback = function (callback) {
            warningCallback = callback;
        };

        vm.AddBeforeBackMoveCallback = function (callback) {
            beforeBackCallback = callback;
        };

        vm.RunValidation = function () {
            for (var i = 0; i < validationCallbacks.length; i++) {
                if (typeof validationCallbacks[i] == "function") {
                    validationCallbacks[i]();
                }
            }
        };

        vm.RunPostValidation = function (validationType, callback) {
            if(typeof postValidation == "function"){
                postValidation(validationType, callback);
            }
        };

        vm.ShowWarning = function (question) {
            if(typeof warningCallback == "function"){
                warningCallback(question);
            }
        };

        vm.ResetMovement = function () {
            if(typeof warningCallback == "function"){
                resetCallback();
            }
        };

        vm.RunBeforeBack =  function () {
            if(typeof beforeBackCallback == "function"){
                return beforeBackCallback();
            }
            return false;
        };

        vm.DrawStartUpPage = function () {
            if(typeof startupPageCallback == "function"){
                startupPageCallback();
            }
        }

        vm.Flush = function () {
            validationCallbacks.length = 0;
            postValidation = null;
        };
    }

})(angular);
