(function (angular) {

    'use strict';

    angular.module('SurveyEngineCore').service('SurveyEngine.ValidatorService', ['SurveyEngine.Enums', '$timeout', ValidatorService])

    function ValidatorService(enums, $timeout) {
        var vm = this;
        vm.IsDataValid = true;
        vm.WarningShown = false;
        vm.VerifiedQuestionOTPMap = {};
        vm.QuestionOTPMap = {};
        var ErrorCallback = {};
        var HideErrorCallback = {};
        vm.ValidOTP = null;

        window.IsOTPValid = function(questionGuid){
            return vm.VerifiedQuestionOTPMap[questionGuid];

        }

        vm.AddErrorCallback = function (callback, qname) {
            ErrorCallback[qname] = callback;
        }

        vm.AddHideErrorCallback = function (callback, qname) {
            HideErrorCallback[qname] = callback;
        }

        vm.ShowError = function (IsWarning, message, qname) {
            if (typeof ErrorCallback[qname] == "function") {
                vm.WarningShown = IsWarning;
                 ErrorCallback[qname](IsWarning, message);
             }
        }

        vm.HideError = function (qname) {
            if (typeof HideErrorCallback[qname] == "function") {
                HideErrorCallback[qname]();
            }
        }

        vm.ResetWarning = function () {
            vm.WarningShown = false;
        }

        vm.ContainsValidData = function (variable, values) {
            var isValid = false;
            switch (variable.VariableType) {
                case enums.VariableType.SingleChoice:
                    isValid = (values.length == 1 && vm.IsNotNull(values[0])) || values.length == 0;
                    break;

                case enums.VariableType.MultipleChoice:
                    values = values.filter(function (d) {
                        return vm.IsNotNull(d);
                    });
                    isValid = true;
                    break;

                case enums.VariableType.Numeric:
                    if (values.length == 1) {
                        isValid = !isNaN(values[0]) && vm.IsNotNull(values[0]);
                        if (!isNaN(variable.Properties.Min) && vm.IsNotNull(variable.Properties.Min)) {
                            isValid = isValid && (parseInt(values[0]) >= parseInt(variable.Properties.Min));
                        }
                        if (!isNaN(variable.Properties.Max) && vm.IsNotNull(variable.Properties.Max)) {
                            isValid = isValid && (parseInt(values[0]) <= parseInt(variable.Properties.Max));
                        }
                    }
                    break;

                case enums.VariableType.Text:
                    if (values.length == 1) {
                        isValid = vm.IsNotNull(values[0])  && vm.IsNotEmpty(values[0]);

                        if (!isNaN(variable.Properties.Min) && vm.IsNotNull(variable.Properties.Min)) {
                            isValid = isValid && (values[0].length >= variable.Properties.Min);
                        }
                        if (!isNaN(variable.Properties.Max) && vm.IsNotNull(variable.Properties.Max)) {
                            isValid = isValid && (values[0].length <= variable.Properties.Max);
                        }
                        var regexp = new RegExp(variable.Properties.RegexValue1);
                        isValid = isValid && regexp.test(values[0]);
                    }
                    break;

                case enums.VariableType.DateTime:
                    if (values.length == 1) {
                        isValid = vm.IsNotNull(values[0]);
                        var startDate = new Date(variable.Properties.StartDate);
                        var endDate = new Date(variable.Properties.EndDate);
                        var inputDate = new Date(values[0]);
                        inputDate.setHours(12);
                        isValid = isValid && !((startDate && inputDate < startDate) || (endDate && inputDate > endDate));
                    }
                    break;
            }

            return isValid;
        }

        vm.IsNotNull = function (value) {
            return value != null && value != undefined;
        }

        vm.ShakeMe = function () {
            var scrollable = document.getElementById('scrollable');
            if (scrollable.classList.contains('shake')) {
                scrollable.classList.remove('shake');
            }
            $timeout(function () {
                scrollable.classList.add('shake');
            })

        }

        vm.IsNotNullOrEmpty = function (value) {
                return value != null && value != undefined && value.toString().trim() != "";

        }

        vm.IsNotEmpty = function (value) {
            return value != "";
        }

        vm.MakeBorderRed = function(elementId){
            var element = document.getElementById(elementId);
            if(element){
            if(element.classList.contains('border-red')){
                element.classList.remove('border-red');
            }
            $timeout(function(){
                element.classList.add('border-red');
            });
        }
        }

        vm.RemoveBorderRed = function(elementId){
            var element = document.getElementById(elementId);
            if(element && element.classList.contains('border-red')){
                element.classList.remove('border-red');
            }
        }

        vm.VerifyOTP = function(mobileNumber, respID, enteredOTP){
            var validOTP = vm.GetOTP();//generateOTP(mobileNumber, respID);
            return validOTP === parseInt(enteredOTP);
        }

        vm.SetOTP = function(otp){
            var salt = 79;
            vm.ValidOTP = parseInt(otp) - salt;
        }

        vm.GetOTP = function(){
            return vm.ValidOTP;
        }

        vm.ResetErrorCallbacks = function(){
            ErrorCallback = {};
            HideErrorCallback = {};
        }
        // using paring function to generate a unique number from two numbers
        function generateOTP(mobileNumber, respID){
           var k1 = parseInt(mobileNumber);
           var k2 =  parseInt(respID);
            var str = Math.round((((k1+k2)*(k1+k2+1))/2) + k2).toString();
            var subStr = str.substr(0,6);
            return parseInt(subStr);
        }
    }
})(angular)