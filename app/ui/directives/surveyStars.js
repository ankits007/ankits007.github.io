(function (angular) {

    "use strict";

    angular
        .module("SurveyEngine")
        .directive('surveyStars', ['$timeout',surveyStars]);

    function surveyStars($timeout) {

        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E',
            scope: true,
            templateUrl: 'app/ui/views/surveyRatingTemplate.html'
        };

        return directive;

        function link(scope, element, attrs) {
            scope.OptionId = parseInt(attrs.optionId);
            scope.ExclusiveId = parseInt(attrs.exclusiveId);
            scope.smileyPath = scope.variable.Options[scope.OptionId].Media['en-us'];
           $timeout(function(){
               var id = scope.variable.Name +"-"+ scope.OptionId;
               if(document.getElementById(id))
                document.getElementById(id).setAttribute('d', scope.smileyPath);
            });
            
            if (!attrs.exclusiveId && scope.variable) {
                var exclusiveSeq = scope.variable.VariableLevelSequence.filter(function (seq) {
                    return scope.variable.Options[seq.ID].IsExclusive;
                });
                if (exclusiveSeq.length) {
                    scope.ExclusiveId = exclusiveSeq[0].ID;
                }
            }
            var bg = element[0].style;
           
        }

        function controller($scope) {
            // $scope.hover = {};
            // $scope.$on('setHoverID', function (evnt, id) {
            //     $scope.hover.HoverID = id;
            // })

            // $scope.$on('removeHoverID', function () {
            //     $scope.hover.HoverID = undefined;
            // })
         

        }
    }
})(angular);