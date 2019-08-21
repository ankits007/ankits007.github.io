(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyGrid", ['SurveyEngine.Enums', '$templateCache',grid]);

    function grid(enums, $templateCache) {
        var directive = {
            link: link,
            controller: ['$scope', controller],
            restrict: 'E',
            replace: true,
            template: $templateCache.get('grid.html')
        };
        return directive;

        function link(scope, element, attrs, cntrls) {

            scope.CalculateWidth = function (length) {
                return (100 / length) + '%';
            }

            scope.GetFirstKey = function (obj) {
                return Object.keys(obj)[0];
            }

            scope.$evalAsync(function(){
                var gridRows = element.find('tbody>tr');
            })
        }

        function controller($scope) {

            var totalColumns = 0,
                headerGroup = [],
                headerVariable = [],
                headerAttributes = [],
                variables = []

            $scope.GridData = {
                head: [],
                row: []
            };
            
            $scope.QuestionType = $scope.qObject.QuestionType;
            
            $scope.rowVariables = {

            };
            $scope.TotalBox = $scope.qObject.Properties.Total ? $scope.qObject.Properties.Total: "None";
            $scope.ShowAs = $scope.qObject.Properties["ShowAs"];

            
            if($scope.qObject.Properties.Transpose == 'true')
                transformTransposeData();
            else
                transformData();

            function transformData() {
                $scope.GridData.head.push(headerGroup);
                $scope.GridData.head.push(headerVariable);
                
                for (var qlIndex in $scope.qObject.QuestionLevelSequence) {
                    var qlObject = $scope.qObject.QuestionLevelSequence[qlIndex];

                    switch (qlObject.ObjectType) {
                        case enums.ObjectType.AttributeHeader:
                            var attrHeadRow = [];
                            attrHeadRow.push({
                                Id: qlObject.ID,
                                Property: 'AttributeHeaders'
                            });

                            for (var attrIndex in $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence) {
                                var attribute = $scope.qObject.Attributes[$scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence[attrIndex]],
                                    attributeRow = [];

                                attributeRow.push({
                                    Id: attribute.ID,
                                    Property: 'Attributes',
                                    InGroup: true
                                });

                                for (var gsqIndex in attribute.GroupSequence) {
                                    var group = $scope.qObject.Groups[attribute.GroupSequence[gsqIndex]];

                                    if (qlIndex == 0 && attrIndex == 0) {
                                        headerGroup.push({
                                            Id: group.ID,
                                            Property: 'Groups'
                                        })
                                    }

                                    for (var varIndex in group.VariableSequence) {
                                        var variable = {
                                            Id: group.VariableSequence[varIndex],
                                            Property: 'Variables',
                                            IsLastVariable: varIndex == group.VariableSequence.length - 1
                                        }

                                        if (qlIndex == 0 && attrIndex == 0)
                                            headerVariable.push(variable);

                                        if (attrIndex == 0)
                                            attrHeadRow.push({
                                                Property: 'Empty',
                                                IsLastVariable: varIndex == group.VariableSequence.length - 1
                                            })

                                        attributeRow.push(variable);
                                    }
                                }

                                if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {        
                                    attributeRow.push({     
                                        Id: attribute.ID,       
                                        Property: 'Text2',      
                                        InGroup: true,      
                                        HeaderId: qlObject.ID       
                                    });     
                                }

                                if (attrIndex == 0) {
                                    if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {        
                                        attrHeadRow.push({      
                                            Property: 'Empty',      
                                            IsLastVariable: varIndex == group.VariableSequence.length - 1       
                                        })      
                                        headerVariable.push({       
                                            Id: null,       
                                            Property: null      
                                        })      
                                    }
                                    $scope.GridData.row.push(attrHeadRow);
                                }

                                $scope.GridData.row.push(attributeRow);
                            }
                            break;
                        case enums.ObjectType.Attribute:
                            var attribute = $scope.qObject.Attributes[qlObject.ID],
                                attributeRow = [];

                            attributeRow.push({
                                Id: attribute.ID,
                                Property: 'Attributes',
                                InGroup: false
                            });

                            for (var gsqIndex in attribute.GroupSequence) {
                                var group = $scope.qObject.Groups[attribute.GroupSequence[gsqIndex]];

                                if (qlIndex == 0) {
                                    headerGroup.push({
                                        Id: group.ID,
                                        Property: 'Groups'
                                    })
                                }

                                for (var varIndex in group.VariableSequence) {
                                    var variable = {
                                        Id: group.VariableSequence[varIndex],
                                        Property: 'Variables',
                                        IsLastVariable: varIndex == group.VariableSequence.length - 1
                                    }

                                    // if($scope.QuestionType == 20 && variable.IsLastVariable){
                                    //     variable.IsLastVariable = false;
                                    // }

                                    if (qlIndex == 0)
                                        headerVariable.push(variable);

                                    attributeRow.push(variable);
                                }

                                if ($scope.qObject.QuestionType == enums.QuestionType.Distribution) {        
                                    attributeRow.push({     
                                        Id: attribute.ID,       
                                        Property: 'Text2',      
                                        InGroup: false,     
                                        HeaderId: undefined     
                                    });     
                                            
                                    if (qlIndex == 0) {     
                                        headerVariable.push({       
                                            Id: null,       
                                            Property: null      
                                        })      
                                    }       
                                }       
                                // if (attrIndex == 0) {        
                                //     $scope.GridData.row.push(attrHeadRow);       
                                // }        
                                if (qlIndex == 0) {     
                                    $scope.FirstAttribute = attribute.ID;       
                                }
                            }

                            // if (attrIndex == 0) {
                            //     $scope.GridData.row.push(attrHeadRow);
                            // }

                            $scope.GridData.row.push(attributeRow);
                            break;
                    }
                }
                switch($scope.qObject.QuestionType){
                    case enums.QuestionType.NumericGrid:
                    case enums.QuestionType.TextGrid:
                    case enums.QuestionType.SimpleGrid:
                    case enums.QuestionType.Distribution:
                        $scope.GridData.head.splice(0, 1);
                        break;
                }

                //Repeat Headers
                //variable 'headersPosition' is an array which contains the positions of Headers
                if ($scope.qObject.Properties.RepeatHeader == 'true') {
                    var numberOfRows = $scope.GridData.row.length;
                    var rowPosition = 0;
                    $scope.isHeader = new Array(numberOfRows);
                    if (numberOfRows > 5) {
                        var headersPosition = repeatHeaders(numberOfRows, 2);
                    }
                    for (var position in headersPosition) {
                        if (rowPosition == 0)
                            rowPosition += headersPosition[position]
                        else
                            rowPosition += headersPosition[position] + 1;
                        if (rowPosition <= numberOfRows) {
                            $scope.isHeader[rowPosition] = true;
                            var obj = {
                                Property: 'Empty'
                            }
                            if ($scope.qObject.QuestionType == enums.QuestionType.SimpleGrid) {
                                var rowData = angular.copy($scope.GridData.head[0]);
                            } else {
                                var rowData = angular.copy($scope.GridData.head[1]);
                            }
                            rowData.splice(0, 0, obj);
                            $scope.GridData.row.splice(rowPosition, 0, rowData);
                        }
                    }
                }

                function repeatHeaders(rows, dividingNumber) {
                    var newRowPositions = [];
                    var firstPosition = Math.ceil(rows / dividingNumber);
                    if (firstPosition > 5) {
                        newRowPositions = repeatHeaders(rows, ++dividingNumber);
                    }
                    else {
                        for (var i = 0; i < dividingNumber - 1; i++) {
                            newRowPositions.push(Math.ceil(rows / dividingNumber));
                        }
                    }
                    return newRowPositions;
                }

                //For Total column in the Constant Sum Grid
                if($scope.qObject.Properties["ShowAs"] == enums.ShowAsProperty.ConstantSum){
                    if($scope.TotalBox == 'RowTotal'){
                        for(var row in $scope.GridData.row){
                            if($scope.GridData.row[row][0].Property != "AttributeHeaders")
                                $scope.Total.sum.push(0);
                            else
                                $scope.Total.sum.push(-1);
                            }
                        }
                    else{
                        for(var header in $scope.GridData.head[0]){
                            $scope.Total.sum.push(0);
                        }
                    }
                }
            }

            function transformTransposeData(){
                $scope.GridData.head.push(headerAttributes); //Attributes to be shown as Headers in case of transpose grid 
                $scope.OptionsVariable = {};

                for(var qIndex in $scope.qObject.QuestionLevelSequence){
                    var qlObject = $scope.qObject.QuestionLevelSequence[qIndex];
                    switch(qlObject.ObjectType){
                        case enums.ObjectType.AttributeHeader:
                            for(var attribute in $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence){
                                var attrId = $scope.qObject.AttributeHeaders[qlObject.ID].AttributeSequence[attribute];
                                var attrObject = {
                                    Id: attrId,
                                    Property: "Attributes"
                                }
                                headerAttributes.push(attrObject);
                                for(var group in $scope.qObject.Attributes[attrId].GroupSequence){
                                    var groupVariables = [];
                                    var groupId = $scope.qObject.Attributes[attrId].GroupSequence[group];
                                    for(var item in $scope.qObject.Groups[groupId].VariableSequence){
                                        var varId = $scope.qObject.Groups[groupId].VariableSequence[item];
                                        var varObject = {
                                            Id: varId,
                                            Property: "Variables"
                                        }

                                        if($scope.qObject.QuestionType == 11){
                                            if(qIndex == 0 && attribute == 0){
                                                $scope.GridData.row.push(variables);
                                                $scope.OptionsVariable = varObject;
                                            }
                                            variables.push(varObject);
                                        }
                                        else{    
                                            //For grids other than Simple Grid
                                            //Number of Rows will be equal to number of columns

                                            if(item == 0 && attribute == 0){
                                                for(var rowVars in $scope.qObject.Groups[groupId].VariableSequence){
                                                    $scope.GridData.row.push([]);
                                                }
                                            }
                                            $scope.GridData.row[item].push(varObject);
                                            if($scope.qObject.Properties["ShowAs"] == enums.ShowAsProperty.ConstantSum){
                                                if($scope.TotalBox == 'RowTotal'){
                                                    for(var header in $scope.GridData.head[0]){
                                                            $scope.Total.sum.push(0);
                                                        }
                                                    }
                                                else{
                                                    for(var row in $scope.GridData.row){
                                                        $scope.Total.sum.push(0);
                                                    }
                                                }
                                            }
                                        }
                                        
                                    }
                                }
                            }
                            break;

                        case enums.ObjectType.Attribute:
                            var attrObject = {
                                Id: qlObject.ID,
                                Property: "Attributes"
                            }
                            headerAttributes.push(attrObject);
                            
                                for(var group in $scope.qObject.Attributes[qlObject.ID].GroupSequence){
                                    var groupVariables = [];
                                    var groupId = $scope.qObject.Attributes[qlObject.ID].GroupSequence[group];
                                    var groupObj = {
                                        Id: groupId,
                                        Property: "Groups"
                                    }
                                    for(var item in $scope.qObject.Groups[groupId].VariableSequence){
                                        var varId = $scope.qObject.Groups[groupId].VariableSequence[item];
                                        var varObject = {
                                            Id: varId,
                                            Property: "Variables"
                                        }

                                        if($scope.qObject.QuestionType == 11){
                                            if(qIndex == 0){
                                                $scope.GridData.row.push(variables);
                                            }
                                            if(qIndex == 0){
                                                $scope.OptionsVariable = varObject;
                                            }
                                            variables.push(varObject);
                                        }
                                        else{
                                            if(item == 0 && qIndex == 0){   
                                                for(var variable in $scope.qObject.Groups[groupId].VariableSequence){
                                                    $scope.GridData.row.push([]);
                                                }
                                            }
                                            $scope.GridData.row[item].push(varObject);
                                        }
                                        
                                    }
                                    
                                }
                                
                            break;
                    }
                }
            }

            function populateHeaders(attribute) {

            }
        }
    }
})(angular);