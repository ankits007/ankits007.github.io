(function (angular) {
    'use strict';

    angular
        .module('SurveyEngine')
        .directive('singleChoiceGamify', ['SurveyEngine.RespondentService', '$timeout', '$interval', '$templateCache', singleChoiceGamify]);

    function singleChoiceGamify(respondentService, $timeout, $interval, $templateCache) {
        return {
            scope: {
                Variable: '=variable'
            },
            link: gamifyLink,
            restrict: 'E',
            require: ['^surveyQuestion'],
            template: $templateCache.get('gamifyOptions.html')
        };

        function gamifyLink(scope, element, attrs, controllers) {
            var questionController = controllers[0];

            scope.Language = questionController.Language;
            scope.DefaultLanguage = questionController.DefaultLanguage;
            scope.Options = [];
            scope.OptionIndex = 0;
            scope.ShowPlayButton = false;
            scope.ShowOptions = false;
            scope.Answer = "";

            scope.Play = play;

            initialize();

            function initialize() {
                scope.Options = getOptions();
                var answer = respondentService.GetVariableAnswers(scope.Variable.Name);

                if (answer.length == 0) {
                    scope.ShowPlayButton = true;
                } else {
                    scope.ShowOptions = true;
                    scope.Answer = getOptionText(answer[0]);
                }
            }

            function getOptions() {
                var options = [];

                for (var i = 0; i < scope.Variable.VariableLevelSequence.length; i++) {
                    if (scope.Variable.VariableLevelSequence[i].IsOption == true) {
                        options.push(scope.Variable.Options[scope.Variable.VariableLevelSequence[i].ID]);
                    } else {
                        var optionGroup = scope.Variable.OptionGroups[scope.Variable.VariableLevelSequence[i].ID];

                        for (var j = 0; j < optionGroup.OptionSequence.length; j++) {
                            options.push(scope.Variable.Options[optionGroup.OptionSequence[j]]);
                        }
                    }
                }

                return options;
            }

            // function play() {
            //     scope.ShowPlayButton = false;
            //     scope.ShowOptions = true;

            //     var interval = $interval(function () {
            //         scope.OptionIndex++;

            //         if (scope.OptionIndex == scope.Options.length) {
            //             scope.OptionIndex = 0;
            //         }
            //     }, 100);

            //     $timeout(function () {
            //         $interval.cancel(interval);

            //         scope.ShowPlayButton = false;
            //         scope.OptionIndex = Math.floor(Math.random() * scope.Options.length);
            //         questionController.SaveAnswer(scope.Variable.Name, scope.Variable.VariableType, [scope.Options[scope.OptionIndex].Code], true);
            //     }, 3000);
            // }



            var theWheel = new Winwheel({
                'canvasId': 'win-canvas',
                'numSegments': scope.Options.length,
                // 'outerRadius': 130,
                'textFontSize': 12,
                'segments': getSegments(),
                'animation':           // Specify the animation to use.
                    {
                        'type': 'spinToStop',
                        'duration': 5,     // Duration in seconds.
                        'spins': 8,     // Number of complete spins.
                        'callbackFinished': savePrize
                    }
            });

            var wheelPower = 0;
            var wheelSpinning = false;

            function getSegments() {
                var colors = ["#eae56f", "#89f26e", "#7de6ef", "#e7706f"],
                    colorIndex = 0,
                    segments = [];

                for (var i in scope.Options) {
                    var element = scope.Options[i];

                    var entry = {
                        'fillStyle': colors[colorIndex++],
                        'text': element.Text[scope.Language],
                        'code': element.Code
                    }

                    if (colorIndex == colors.length)
                        colorIndex = 0;

                    segments.push(entry);
                }

                return segments;
            }

            function play() {
                if (wheelSpinning == false) {
                    theWheel.animation.spins = 15;

                    // Disable the spin button so can't click again while wheel is spinning.
                    // document.getElementById('spin_button').src       = "spin_off.png";
                    // document.getElementById('spin_button').className = "";

                    // Begin the spin animation by calling startAnimation on the wheel object.
                    theWheel.startAnimation();

                    // Set to true so that power can't be changed and spin button re-enabled during
                    // the current animation. The user will have to reset before spinning again.
                    wheelSpinning = true;
                }
                // console.log(scope.Options);
                // console.log(scope.Language);
            }

            function savePrize(indicatedSegment) {
                // Do basic alert of the segment text. You would probably want to do something more interesting with this information.
                // alert("You have won " + indicatedSegment.code);
                questionController.SaveAnswer(scope.Variable.Name, scope.Variable.VariableType, indicatedSegment.code, true);
                scope.ShowPlayButton = false;
                scope.Answer = indicatedSegment.text;
                scope.$apply();
            }

            function getOptionText(code) {
                for (var i in scope.Options) {
                    var element = scope.Options[i];

                    if(element.Code == code)
                        return element.Text[scope.Language];
                }
            }
        }
    }
})(angular);