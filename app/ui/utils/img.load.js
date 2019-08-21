/**
 * Created by AnkitS on 8/24/2017.
 */
(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine").directive('imageOnLoad', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('load', function () {
                    scope.$emit('ResourceLoaded', 1);
                });
                element.bind('error', function () {
                    scope.$emit('ResourceLoaded', 0);
                });
            }
        };
    }).directive('videoOnLoad', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var video = element[0];
                video.addEventListener('canplay' , function () {
                    scope.$emit('VideoLoaded', element[0]);
                });
            }
        };
    }).directive('seekDisable', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var video = element[0];
                var supposedCurrentTime = 0;
                video.addEventListener('timeupdate', function () {
                    if (!video.seeking) {
                        supposedCurrentTime = video.currentTime;
                    }
                });
                // prevent user from seeking
                video.addEventListener('seeking', function () {
                    // guard agains infinite recursion:
                    // user seeks, seeking is fired, currentTime is modified, seeking is fired, current time is modified, ....
                    var delta = video.currentTime - supposedCurrentTime;
                    if (Math.abs(delta) > 0.01) {
                        video.currentTime = supposedCurrentTime;
                    }
                });
                // delete the following event handler if rewind is not required
                video.addEventListener('ended', function () {
                    // reset state in order to allow for rewind
                    supposedCurrentTime = 0;
                });
            }
        };
    });
})(angular);
