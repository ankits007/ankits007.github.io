/**
 * Created by AnkitS on 6/15/2017.
 */
(function (angular) {
    'use strict';
    angular.module('SurveyEngineCore').factory('EngineCore.ReviewScrollService', ['EngineCore.SurveyTreeService', 'SurveyEngine.RespondentService',
        function (SurveyTreeService, RespondentService) {

            var Rview = function () {
                this.items = [];
                this.busy = false;
                this.qids = [];
                this.index = 0;
                this.keys = {};
                this.displayedStartIndex = 0;
                this.displayedEndIndex = 4;
            };

            function dispatchEvent() {
                var event; // The custom event that will be created

                if (window.document.createEvent) {
                    event = window.document.createEvent("HTMLEvents");
                    event.initEvent("PageLoaded", true, true);
                } else {
                    event = window.document.createEventObject();
                    event.eventType = "PageLoaded";
                }

                event.eventName = "PageLoaded";
                console.log('Preparing to dispatch event.')
                if (window.document.createEvent) {
                    window.document.dispatchEvent(event);
                } else {
                    window.document.fireEvent("on" + event.eventType, event);
                }
            }

            Rview.prototype.nextQuestion = function (index) {
                this.index = index || this.displayedStartIndex;
                if (this.busy) return;
                if (this.index == undefined || this.index == null) return;
                if (!this.qids[this.index]) return;
                if (this.index > this.qids.length) {
                    // dispatch event to the phantom so that it knows the page is loaded fully.
                    dispatchEvent();
                    return;
                }
                this.busy = true;
                
                var splits = this.qids[this.index].split('|');
                var id = splits[0];
                var iteration;
                if (splits.length > 1) {
                    iteration = splits[splits.length - 1];
                }
                SurveyTreeService.getQuestion(id).then(function (data) {
                    this.addQuestion(angular.copy(data), iteration);
                    this.busy = false;
                    if (this.index < this.displayedEndIndex) {
                        this.index++;
                        this.nextQuestion(this.index);
                    }
                }.bind(this));
            };

            Rview.prototype.addQuestion = function (question, iteration) {
                if (iteration) {
                    question.Name += "." + iteration;
                    question.ID += "|" + iteration;
                    for (var i in question.Variables) {
                        question.Variables[i].Name += "." + iteration;
                    }
                }
                if(question.Properties.MobileFriendly == 'true'){
                    question.Properties.MobileFriendly = 'false';
                    question.disableInputOnly = true;
                }
                for (var x in question.Variables) {
                    var srq = [];
                    for (var v = 0; v < question.Variables[x].VariableLevelSequence.length; v++) {
                        maskOptions(question.Variables[x]);
                    }
                }
              //  if (!(question.ID in this.keys)) {
                    this.items.push(question);
                    this.keys[question.ID] = true;
               // }
            }

            function maskOptions(variable) {
                var options = variable.VariableLevelSequence || [];
                var optionsToShow = [];
                for (var i = 0; i < options.length; i++) {
                    if (options[i].IsOption) {
                        if (RespondentService.GetDisplayedValues(variable.Name).hasItem(options[i].ID))
                            optionsToShow.push(options[i]);
                    } else {
                        var grpOpts = variable.OptionGroups[options[i].ID].OptionSequence;
                        var grpOptsToShow = [];
                        for (var j = 0; j < grpOpts.length; j++) {
                            if (RespondentService.GetDisplayedValues(variable.Name).hasItem(options[i].ID)) {
                                grpOptsToShow.push(grpOpts[j]);
                            }
                        }
                        if (grpOptsToShow.length > 0) {
                            variable.OptionGroups[options[i].ID].OptionSequence = grpOptsToShow;
                            optionsToShow.push(options[i]);
                        }
                    }
                }
                variable.VariableLevelSequence = optionsToShow;
            }

            return Rview;
        }
    ]);
})(angular);