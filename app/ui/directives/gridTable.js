(function (angular) {
    "use strict";

    angular
        .module("SurveyEngine")
        .directive("surveyTable", ['$rootScope', '$timeout', '$compile', 'SurveyEngine.Enums', surveyTable]);


    function surveyTable($rootScope, $timeout, $compile, enums) {
        var directive = {
            link: link,
            replace: true,
            restrict: 'E'
        };
        return directive;

        function link(scope, element, attrs, cntrls) {

            $timeout(function () {
                if (scope.qObject.Properties.Transpose == 'true')
                    createTransposedGrid();
                else
                    createGrid();
                    $rootScope.$broadcast('table-drawn');
            })

            scope.FirstAttribute = scope.qObject.MasterAttribute.ID;

            scope.$on('IsDirty', function () {
                element.empty();
                if (scope.qObject.Properties.Transpose == 'true')
                    createTransposedGrid();
                else
                    createGrid();

            })

            function createGrid() {
                var info = {
                    data: [],
                    mergeCells: [],
                    cellProperties: {},
                    cell: [],
                    borderCols: [],
                    totalCols: 1,
                    totalRows: getTotalRows(scope.qObject),
                    enableRightText: false,
                    repeatHeader: scope.qObject.Properties.RepeatHeader == 'true',
                    repeatPositions: [],
                    isRowTotal: scope.qObject.QuestionType == 14 && scope.qObject.Properties.ShowAs == '11' && scope.qObject.Properties.Total == "RowTotal",
                    isColTotal: scope.qObject.QuestionType == 14 && scope.qObject.Properties.ShowAs == '11' && scope.qObject.Properties.Total == "ColumnTotal"
                },
                    tableInfo = {
                        instance: null,
                        cellMap: null
                    },

                    rowIndex = 0,
                    isSlider = false,
                    totalHeaderRows = 0;

                info.repeatPositions = info.repeatHeader ? repeatHeadersPositions(info.totalRows) : [];
                info.totalCols += getTotalColumns(scope.qObject, info);

                if (scope.qObject.QuestionType != enums.QuestionType.Slider) {
                    rowIndex = headers(scope.qObject, info);
                    totalHeaderRows = rowIndex + 1;
                    info.cell.push({ row: rowIndex, col: 0, className: "qGrid-cell qGrid-border-bot" })
                } else {
                    rowIndex = -1;
                    isSlider = true;
                }

                if (info.enableRightText) {
                    info.cell.push({ row: rowIndex, col: info.isNoAnsAdded ? (info.totalCols - 2) : (info.totalCols - 1), className: "qGrid-cell qGrid-border-bot qGrid-cell-head" });
                }
                if (info.isRowTotal) {
                    info.cell.push({ row: rowIndex, col: (info.totalCols - 1), className: "qGrid-cell qGrid-border-bot qGrid-cell-head" });
                    info.data[rowIndex] = new Array(1);
                    info.data[rowIndex][info.totalCols - 1] = "Total";
                }
                createGridBody(scope.qObject, info, ++rowIndex);

                if (info.isColTotal) {
                    var i = 1,
                        colIndex = 1,
                        rowIndex = info.data.length,
                        cellKey = "";

                    info.data[rowIndex] = new Array(info.totalCols);
                    info.data[rowIndex][colIndex - 1] = "Total";
                    info.cell.push({ row: rowIndex, col: 0, className: "qGrid-cell qGrid-border-top qGrid-cell-head qGrid-cell-header" })

                    for (var i; i < info.totalCols; i++) {
                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-variable-cell qGrid-border-top" + (i == (info.totalCols - 1) ? " qGrid-cell-border" : "") })

                        cellKey = "r" + rowIndex + "c" + colIndex;

                        info.cellProperties[cellKey] = {
                            IsHeader: true,
                            CellType: enums.ObjectType.Variable,
                            OptionCode: null,
                            ID: null,
                            IsConstantSum: true
                        }
                        colIndex++;
                    }
                }

                var tableProperties = {
                    data: info.data,
                    rowHeaders: false,
                    colHeaders: false,
                    // contextMenu: scope.showContextMenu ? scope.showContextMenu : false,
                    fillHandle: false,
                    renderAllRows: true,
                    disableVisualSelection: true,
                    readOnly: true,
                    // fixedRowsTop: totalHeaderRows,
                    mergeCells: info.mergeCells,
                    cell: info.cell,
                    cells: function (row, col, prop) {
                        var cellProperties = {},
                            cellKey = "r" + row + "c" + col,
                            cellInfo = scope.Table.Info.cellProperties[cellKey];

                        if (cellInfo) {
                            if (!cellInfo.IsHeader) {
                                var variable = scope.qObject.Variables[cellInfo.ID],
                                    elemKey = variable.Name + "o" + cellInfo.OptionCode;

                                switch (variable.VariableType) {
                                    case enums.VariableType.SingleChoice:
                                        cellProperties.renderer = scope.Table.Renderers.SingleChoiceRenderer;
                                        cellProperties.variable = variable;
                                        cellProperties.elemKey = elemKey;
                                        cellProperties.cellInfo = cellInfo;
                                        break;

                                    case enums.VariableType.MultipleChoice:
                                        cellProperties.renderer = scope.Table.Renderers.MultiChoiceRenderer;
                                        cellProperties.variable = variable;
                                        cellProperties.elemKey = elemKey;
                                        cellProperties.cellInfo = cellInfo;
                                        break;

                                    case enums.VariableType.Text:
                                        cellProperties.renderer = scope.Table.Renderers.TextboxRenderer;
                                        break;

                                    case enums.VariableType.Numeric:
                                        cellProperties.renderer = scope.Table.Renderers.NumericRenderer;
                                        cellProperties.variable = variable;
                                        cellProperties.IsRowTotal = info.isRowTotal;
                                        cellProperties.IsColumnTotal = info.isColTotal;
                                        cellProperties.isSlider = isSlider;
                                        break;

                                    case enums.VariableType.DateTime:
                                        cellProperties.renderer = scope.Table.Renderers.DateTimeRenderer;
                                        break;
                                }
                            } else if (cellInfo.IsConstantSum) {
                                cellProperties.renderer = scope.Table.Renderers.NumericTotalRenderer;
                            } else {
                                cellProperties.renderer = scope.Table.Renderers.HeaderRenderer;
                                cellProperties.cellInfo = cellInfo;
                                cellProperties.cellKey = cellKey;
                                cellProperties.IsRowTotal = info.isRowTotal;
                                cellProperties.IsColumnTotal = info.isColTotal;
                            }
                        }

                        return cellProperties;
                    }
                };

                if (scope.Table.Info != undefined) {
                    scope.Table.Info["cellProperties"] = info.cellProperties;
                }

                if (scope.Table.Callbacks) {
                    for (var key in scope.Table.Callbacks)
                        tableProperties[key] = scope.Table.Callbacks[key];
                }

                tableInfo.instance = new Handsontable(element[0], tableProperties);

                scope.IsTableCompiled = false;

                function getTotalColumns(question, info) {
                    var count = 0;
                    for (var g in question.MasterAttribute.GroupSequence) {
                        var group = question.Groups[question.MasterAttribute.GroupSequence[g]];

                        for (var v in group.VariableSequence) {
                            var variable = question.Variables[group.VariableSequence[v]];

                            switch (variable.VariableType) {
                                case enums.VariableType.SingleChoice:
                                case enums.VariableType.MultipleChoice:
                                    if (variable.Properties.ShowAs == "2")
                                        count++;
                                    else
                                        // count += Object.keys(variable.Options).length;
                                        for (var op in variable.VariableLevelSequence) {
                                            var optionInfo = variable.VariableLevelSequence[op];

                                            if (optionInfo.IsOption) {
                                                count++;
                                            }
                                        }
                                    break;

                                case enums.VariableType.Text:
                                case enums.VariableType.Numeric:
                                case enums.VariableType.DateTime:
                                    count++;
                                    break;
                            }
                        }

                        info.borderCols.push(count);
                    }

                    if (question.QuestionType == enums.QuestionType.Distribution2 || info.isRowTotal) {
                        info.enableRightText = true;
                        count++;
                    }
                    if(question.QuestionType == enums.QuestionType.Distribution2){
                        var group = question.Groups[question.MasterAttribute.GroupSequence[0]];
                        var variable = question.Variables[group.VariableSequence[0]];
                        Object.keys(variable.Options).map(function(id){
                           if(variable.Options[id].IsExclusive === true)
                           info.isNoAnsAdded = true;
                        });
                    }

                    return count;
                }

                function getTotalRows(question) {
                    var count = 0;
                    for (var sqIndex in question.QuestionLevelSequence) {
                        var sqObject = question.QuestionLevelSequence[sqIndex];

                        if (sqObject.ObjectType == enums.ObjectType.AttributeHeader)
                            for (var item in question.AttributeHeaders[sqObject.ID].AttributeSequence) {
                                count++;
                            }

                        count++;
                    }

                    return count;
                }

                function headers(question, info) {
                    var colIndex = 1,
                        finalRowIndex = 0,
                        showGroup = question.QuestionType == enums.QuestionType.ComplexGrid,
                        cellKey = "";

                    for (var g in question.MasterAttribute.GroupSequence) {
                        var group = question.Groups[question.MasterAttribute.GroupSequence[g]],
                            groupColIndex = colIndex,
                            rowIndex = 0,
                            cellKey = "r" + rowIndex + "c" + colIndex;

                        info.cellProperties[cellKey] = {
                            IsHeader: true,
                            CellType: enums.ObjectType.Group,
                            OptionCode: null,
                            ID: group.ID,
                            GroupIndex: g,
                            ClassName: "qGrid-cell qGrid-cell-head qGrid-group-cell qGrid-cell-border"
                        }


                        if (info.data[rowIndex] == undefined)
                            info.data[rowIndex] = new Array(info.totalCols);

                        if (showGroup) {
                            info.data[rowIndex][colIndex] = group.Text[scope.language];
                            info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-group-cell qGrid-cell-border" })

                            rowIndex++;
                            // colIndex++;

                            if (info.data[rowIndex] == undefined)
                                info.data[rowIndex] = new Array(info.totalCols);
                        }


                        for (var v in group.VariableSequence) {
                            var variable = question.Variables[group.VariableSequence[v]];

                            switch (variable.VariableType) {
                                case enums.VariableType.SingleChoice:
                                case enums.VariableType.MultipleChoice:
                                    if (variable.Properties.ShowAs == "2") {
                                        info.data[rowIndex][colIndex] = variable.Text[scope.language];
                                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "") });

                                        cellKey = "r" + rowIndex + "c" + colIndex;

                                        info.cellProperties[cellKey] = {
                                            IsHeader: true,
                                            CellType: enums.ObjectType.Variable,
                                            OptionCode: null,
                                            ID: variable.ID,
                                            ParentID: group.ID,
                                            ClassName: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "")
                                        }
                                        colIndex++;
                                    } else {
                                        for (var op in variable.VariableLevelSequence) {
                                            var optionInfo = variable.VariableLevelSequence[op];

                                            if (optionInfo.IsOption) {
                                                var optionCol = colIndex;
                                                var option = variable.Options[optionInfo.ID];
                                                if(question.QuestionType == enums.QuestionType.Distribution2 && option.IsExclusive){
                                                    optionCol = info.totalCols - 1;
                                                }

                                                info.data[rowIndex][optionCol] = option.Text[scope.language];
                                                info.cell.push({ row: rowIndex, col: optionCol, className: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "") })

                                                cellKey = "r" + rowIndex + "c" + optionCol;

                                                info.cellProperties[cellKey] = {
                                                    IsHeader: true,
                                                    CellType: enums.ObjectType.Option,
                                                    OptionCode: option.Code.toString(),
                                                    ID: variable.ID,
                                                    OptionID: option.ID,
                                                    ParentID: group.ID,
                                                    ClassName: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(optionCol) > -1 ? " qGrid-cell-border" : "")
                                                }

                                                colIndex++;
                                            }
                                        }
                                    }
                                    break;

                                case enums.VariableType.Text:
                                case enums.VariableType.Numeric:
                                case enums.VariableType.DateTime:
                                    info.data[rowIndex][colIndex] = variable.Text[scope.language];
                                    info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "") })

                                    cellKey = "r" + rowIndex + "c" + colIndex;

                                    info.cellProperties[cellKey] = {
                                        IsHeader: true,
                                        CellType: enums.ObjectType.Variable,
                                        OptionCode: null,
                                        ID: variable.ID,
                                        ParentID: group.ID,
                                        ClassName: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "")
                                    }
                                    colIndex++;
                                    break;
                            }
                        }

                        if (showGroup) {
                            info.mergeCells.push({
                                row: 0,
                                col: groupColIndex,
                                rowspan: 1,
                                colspan: colIndex - groupColIndex
                            });
                        }

                        finalRowIndex = rowIndex;
                    }

                    // info.totalCols = colIndex - 1;
                    return finalRowIndex;
                }

                function createGridBody(question, info, rowIndex) {
                    for (var sqIndex in question.QuestionLevelSequence) {
                        var sqObject = question.QuestionLevelSequence[sqIndex],
                            cellKey = "";

                        info.data[rowIndex] = new Array(info.totalCols);
                        if (sqObject.ObjectType == enums.ObjectType.AttributeHeader) {
                            info.data[rowIndex][0] = question.AttributeHeaders[sqObject.ID].Text[scope.language];
                            info.cell.push({ row: rowIndex, col: 0, className: "qGrid-cell qGrid-cell-head qGrid-attribute-head-cell" });

                            for (var index in info.borderCols)
                                info.cell.push({ row: rowIndex, col: info.borderCols[index], className: "qGrid-cell qGrid-cell-head qGrid-cell-border" });

                            cellKey = "r" + rowIndex + "c" + 0;
                            rowIndex++;

                            if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                info.data[rowIndex] = new Array(info.totalCols);
                                createRepeatedHeader(info.data[totalHeaderRows - 1], (totalHeaderRows - 1), rowIndex);
                                rowIndex++;
                            }

                            info.cellProperties[cellKey] = {
                                IsHeader: true,
                                CellType: sqObject.ObjectType,
                                OptionCode: null,
                                ID: sqObject.ID,
                                ClassName: "qGrid-cell qGrid-cell-head qGrid-attribute-head-cell"
                            }

                            for (var item in question.AttributeHeaders[sqObject.ID].AttributeSequence) {
                                var attribute = question.Attributes[question.AttributeHeaders[sqObject.ID].AttributeSequence[item]];

                                createAttributeRow(question, attribute, rowIndex++, info, true, sqObject.ID);

                                if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                    info.data[rowIndex] = new Array(info.totalCols);
                                    createRepeatedHeader(info.data[totalHeaderRows - 1], (totalHeaderRows - 1), rowIndex);
                                    rowIndex++;
                                }
                            }
                        } else {
                            var attribute = question.Attributes[sqObject.ID];

                            createAttributeRow(question, attribute, rowIndex++, info, false);

                            if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                info.data[rowIndex] = new Array(info.totalCols);
                                createRepeatedHeader(info.data[totalHeaderRows - 1], (totalHeaderRows - 1), rowIndex);
                                rowIndex++;
                            }
                        }
                    }
                }

                function createRepeatedHeader(headerRow, headerRowIndex, rowIndex) {
                    var i,
                        cellKey = "",
                        refCellKey = "";

                    info.cell.push({ row: rowIndex, col: 0, className: "qGrid-cell qGrid-border-bot" });

                    for (i in headerRow) {
                        if (i == 0)
                            continue;

                        info.data[rowIndex][i] = headerRow[i];
                        info.cell.push({ row: rowIndex, col: i, className: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(i) > -1 ? " qGrid-cell-border" : "") })

                        cellKey = "r" + rowIndex + "c" + i;
                        refCellKey = "r" + headerRowIndex + "c" + i;

                        info.cellProperties[cellKey] = info.cellProperties[refCellKey];
                    }
                }

                function createAttributeRow(question, attribute, rowIndex, info, isInGroup, parentID) {
                    var colIndex = 0,
                        cellKey = "";

                    info.data[rowIndex] = new Array(info.totalCols);
                    info.data[rowIndex][colIndex] = attribute.Text[scope.language];
                    info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-attribute-cell" + (isInGroup ? " qGrid-attribute-ingroup" : "" ) + (question.QuestionType == enums.QuestionType.Distribution2 ? " simpleGrid" : "") });
                    cellKey = "r" + rowIndex + "c" + colIndex;

                    info.cellProperties[cellKey] = {
                        IsHeader: true,
                        CellType: enums.ObjectType.Attribute,
                        OptionCode: null,
                        ID: attribute.ID,
                        ParentID: parentID,
                        ClassName: "qGrid-cell qGrid-cell-head qGrid-attribute-cell" + (isInGroup ? " qGrid-attribute-ingroup" : "") + (question.QuestionType == enums.QuestionType.Distribution2 ? " simpleGrid" : "")
                    }

                    colIndex++;
                    for (var gsq in attribute.GroupSequence) {
                        var group = question.Groups[attribute.GroupSequence[gsq]];

                        for (var vsq in group.VariableSequence) {
                            var variable = question.Variables[group.VariableSequence[vsq]];

                            switch (variable.VariableType) {
                                case enums.VariableType.SingleChoice:
                                case enums.VariableType.MultipleChoice:
                                    if (variable.Properties.ShowAs == "2") {
                                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-variable-cell" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "") })

                                        cellKey = "r" + rowIndex + "c" + colIndex;

                                        info.cellProperties[cellKey] = {
                                            IsHeader: false,
                                            CellType: enums.ObjectType.Variable,
                                            OptionCode: null,
                                            ID: variable.ID
                                        }
                                        colIndex++;
                                    } else {
                                        for (var op in variable.VariableLevelSequence) {
                                            var optionInfo = variable.VariableLevelSequence[op];
                                            var optionCol = colIndex;
                                            if (optionInfo.IsOption) {
                                                var option = variable.Options[optionInfo.ID];
                                                if(question.QuestionType == enums.QuestionType.Distribution2 && option.IsExclusive){
                                                    optionCol = info.totalCols - 1;
                                                }
                                                // info.data[rowIndex][colIndex] = option.Text[scope.language];
                                                info.cell.push({ row: rowIndex, col: optionCol, className: "qGrid-cell qGrid-option-cell" + (info.borderCols.indexOf(optionCol) > -1 ? " qGrid-cell-border" : "")  + (attribute.Media[scope.language] || attribute.Media[scope.DefaultLanguage] ? " image-attribute " : "") })

                                                cellKey = "r" + rowIndex + "c" + optionCol;

                                                info.cellProperties[cellKey] = {
                                                    IsHeader: false,
                                                    CellType: enums.ObjectType.Option,
                                                    OptionCode: option.Code.toString(),
                                                    OptionID: option.ID,
                                                    ID: variable.ID
                                                }
                                                colIndex++;
                                            }
                                        }
                                    }
                                    break;

                                case enums.VariableType.Text:
                                case enums.VariableType.Numeric:
                                case enums.VariableType.DateTime:
                                    // info.data[rowIndex][colIndex] = variable.Text[scope.language]; 
                                    info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-variable-cell" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "") })

                                    cellKey = "r" + rowIndex + "c" + colIndex;

                                    info.cellProperties[cellKey] = {
                                        IsHeader: false,
                                        CellType: enums.ObjectType.Variable,
                                        OptionCode: null,
                                        ID: variable.ID
                                    }
                                    colIndex++;
                                    break;
                            }
                        }
                    }

                    if (info.enableRightText) {
                        var rightTextCol = colIndex;
                        if(question.QuestionType == enums.QuestionType.Distribution2 && info.isNoAnsAdded){
                            rightTextCol = info.totalCols - 2;
                        }
                        info.data[rowIndex][rightTextCol] = attribute.Text2[scope.language] || attribute.Text2[scope.DefaultLanguage];
                        info.cell.push({ row: rowIndex, col: rightTextCol, className: "qGrid-cell qGrid-cell-head qGrid-attribute-cell survey-option-text font-size-75 min-width-120 text-left-important" + (isInGroup ? " qGrid-attribute-ingroup" : "") });
                    }

                    if (info.isRowTotal) {
                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-variable-cell survey-option-text" + (info.borderCols.indexOf(colIndex) > -1 ? " qGrid-cell-border" : "") })

                        cellKey = "r" + rowIndex + "c" + colIndex;

                        info.cellProperties[cellKey] = {
                            IsHeader: true,
                            CellType: enums.ObjectType.Variable,
                            OptionCode: null,
                            ID: null,
                            IsConstantSum: true
                        }
                    }
                }
            }

            function createTransposedGrid() {
                var info = {
                    data: [],
                    mergeCells: [],
                    cellProperties: {},
                    cell: [],
                    borderCols: [],
                    totalCols: 1,
                    totalRows: getTotalRows(scope.qObject, scope.qObject.MasterAttribute),
                    repeatHeader: scope.qObject.Properties.RepeatHeader == 'true',
                    repeatPositions: [],
                    enableRightText: false
                },
                    tableInfo = {
                        instance: null,
                        cellMap: null
                    },
                    colIndex = 0

                info.repeatPositions = info.repeatHeader ? repeatHeadersPositions(info.totalRows) : [];
                info.totalCols += getTotalColumns(scope.qObject);

                createAttributeCol(scope.qObject, scope.qObject.MasterAttribute, colIndex++, info, true);
                for (var sqIndex in scope.qObject.QuestionLevelSequence) {
                    var sqObject = scope.qObject.QuestionLevelSequence[sqIndex];

                    if (sqObject.ObjectType == enums.ObjectType.AttributeHeader) {
                        for (var item in scope.qObject.AttributeHeaders[sqObject.ID].AttributeSequence) {
                            var attribute = scope.qObject.Attributes[scope.qObject.AttributeHeaders[sqObject.ID].AttributeSequence[item]];

                            createAttributeCol(scope.qObject, attribute, colIndex++, info, false);
                        }
                    } else {
                        var attribute = scope.qObject.Attributes[sqObject.ID];

                        createAttributeCol(scope.qObject, attribute, colIndex++, info, false);
                    }
                }


                var tableProperties = {
                    data: info.data,
                    rowHeaders: false,
                    colHeaders: false,
                    // contextMenu: scope.showContextMenu ? scope.showContextMenu : false,
                    fillHandle: false,
                    renderAllRows: true,
                    disableVisualSelection: true,
                    readOnly: true,
                    // fixedRowsTop: 1,
                    mergeCells: info.mergeCells,
                    cell: info.cell,
                    cells: function (row, col, prop) {
                        var cellProperties = {},
                            cellKey = "r" + row + "c" + col,
                            cellInfo = scope.Table.Info.cellProperties[cellKey];

                        if (cellInfo) {
                            if (!cellInfo.IsHeader) {
                                var variable = scope.qObject.Variables[cellInfo.ID],
                                    elemKey = variable.Name + "o" + cellInfo.OptionCode;

                                switch (variable.VariableType) {
                                    case enums.VariableType.SingleChoice:
                                        cellProperties.renderer = scope.Table.Renderers.SingleChoiceRenderer;
                                        cellProperties.variable = variable;
                                        cellProperties.elemKey = elemKey;
                                        cellProperties.cellInfo = cellInfo;
                                        break;

                                    case enums.VariableType.MultipleChoice:
                                        cellProperties.renderer = scope.Table.Renderers.MultiChoiceRenderer;
                                        cellProperties.variable = variable;
                                        cellProperties.elemKey = elemKey;
                                        cellProperties.cellInfo = cellInfo;
                                        break;

                                    case enums.VariableType.Text:
                                        cellProperties.renderer = scope.Table.Renderers.TextboxRenderer;
                                        break;

                                    case enums.VariableType.Numeric:
                                        cellProperties.renderer = scope.Table.Renderers.NumericRenderer;
                                        cellProperties.variable = variable;
                                        break;

                                    case enums.VariableType.DateTime:
                                        cellProperties.renderer = scope.Table.Renderers.DateTimeRenderer;
                                        break;
                                }
                            } else {
                                cellProperties.renderer = scope.Table.Renderers.HeaderRenderer;
                                cellProperties.cellInfo = cellInfo;
                                cellProperties.cellKey = cellKey;
                            }
                        }

                        return cellProperties;
                    }
                };

                if (scope.Table.Info != undefined) {
                    scope.Table.Info["cellProperties"] = info.cellProperties;
                }

                if (scope.Table.Callbacks) {
                    for (var key in scope.Table.Callbacks)
                        tableProperties[key] = scope.Table.Callbacks[key];
                }

                tableInfo.instance = new Handsontable(element[0], tableProperties);

                scope.IsTableCompiled = false;

                function getTotalRows(question, attribute) {
                    var count = 0;
                    for (var gsq in attribute.GroupSequence) {
                        var group = question.Groups[attribute.GroupSequence[gsq]];

                        for (var vsq in group.VariableSequence) {
                            var variable = question.Variables[group.VariableSequence[vsq]];

                            switch (variable.VariableType) {
                                case enums.VariableType.SingleChoice:
                                case enums.VariableType.MultipleChoice:
                                    if (variable.Properties.ShowAs == "2") {
                                        count++;
                                    } else {
                                        for (var op in variable.VariableLevelSequence) {
                                            var optionInfo = variable.VariableLevelSequence[op];

                                            if (optionInfo.IsOption) {
                                                count++;
                                            }
                                        }
                                    }
                                    break;

                                case enums.VariableType.Text:
                                case enums.VariableType.Numeric:
                                case enums.VariableType.DateTime:
                                    count++;
                                    break;
                            }
                        }
                    }

                    return count;
                }

                function getTotalColumns(question) {
                    var count = 0;
                    for (var sqIndex in question.QuestionLevelSequence) {
                        var sqObject = question.QuestionLevelSequence[sqIndex];

                        if (sqObject.ObjectType == enums.ObjectType.AttributeHeader)
                            for (var item in question.AttributeHeaders[sqObject.ID].AttributeSequence) {
                                count++;
                            }

                        count++;
                    }

                    return count;
                }

                function createAttributeCol(question, attribute, colIndex, info, isMasterAttr) {
                    var rowIndex = 0,
                        cellKey = "";

                    if (isMasterAttr) {
                        info.data[rowIndex] = new Array(info.totalCols);
                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-border-bot" });

                        rowIndex++;
                        for (var gsq in attribute.GroupSequence) {
                            var group = question.Groups[attribute.GroupSequence[gsq]];

                            for (var vsq in group.VariableSequence) {
                                var variable = question.Variables[group.VariableSequence[vsq]];

                                switch (variable.VariableType) {
                                    case enums.VariableType.SingleChoice:
                                    case enums.VariableType.MultipleChoice:
                                        if (variable.Properties.ShowAs == "2") {
                                            info.data[rowIndex] = new Array(info.totalCols);
                                            info.data[rowIndex][colIndex] = variable.Text[scope.language];
                                            info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-cell-border qGrid-attribute-cell" });

                                            cellKey = "r" + rowIndex + "c" + colIndex;

                                            info.cellProperties[cellKey] = {
                                                IsHeader: true,
                                                CellType: enums.ObjectType.Variable,
                                                OptionCode: null,
                                                ID: variable.ID,
                                                ParentID: group.ID,
                                                ClassName: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-cell-border qGrid-attribute-cell"
                                            }
                                            rowIndex++;
                                        } else {
                                            for (var op in variable.VariableLevelSequence) {
                                                var optionInfo = variable.VariableLevelSequence[op];

                                                if (optionInfo.IsOption) {
                                                    var option = variable.Options[optionInfo.ID];

                                                    info.data[rowIndex] = new Array(info.totalCols);
                                                    info.data[rowIndex][colIndex] = option.Text[scope.language];
                                                    info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-cell-border qGrid-attribute-cell" })

                                                    cellKey = "r" + rowIndex + "c" + colIndex;

                                                    info.cellProperties[cellKey] = {
                                                        IsHeader: true,
                                                        CellType: enums.ObjectType.Option,
                                                        OptionCode: option.Code,
                                                        ID: variable.ID,
                                                        ParentID: group.ID,
                                                        ClassName: "qGrid-cell qGrid-cell-head qGrid-cell-border qGrid-attribute-cell"
                                                    }

                                                    rowIndex++;

                                                    if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                                        info.data[rowIndex] = new Array(info.totalCols);
                                                        info.cell.push({ row: rowIndex++, col: 0, className: "qGrid-cell qGrid-border-bot" });
                                                    }
                                                }
                                            }
                                        }
                                        break;

                                    case enums.VariableType.Text:
                                    case enums.VariableType.Numeric:
                                    case enums.VariableType.DateTime:
                                        info.data[rowIndex] = new Array(info.totalCols);
                                        info.data[rowIndex][colIndex] = variable.Text[scope.language];
                                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-head qGrid-border-bot qGrid-cell-border qGrid-attribute-cell" })

                                        cellKey = "r" + rowIndex + "c" + colIndex;

                                        info.cellProperties[cellKey] = {
                                            IsHeader: true,
                                            CellType: enums.ObjectType.Variable,
                                            OptionCode: null,
                                            ID: variable.ID,
                                            ParentID: group.ID,
                                            ClassName: "qGrid-cell qGrid-cell-head  qGrid-border-bot qGrid-cell-border qGrid-attribute-cell"
                                        }
                                        rowIndex++;

                                        if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                            info.data[rowIndex] = new Array(info.totalCols);
                                            info.cell.push({ row: rowIndex++, col: 0, className: "qGrid-cell qGrid-border-bot" });
                                        }
                                        break;
                                }
                            }
                        }
                    } else {
                        rowIndex = 0;

                        info.data[rowIndex][colIndex] = attribute.Text[scope.language];
                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-header qGrid-cell-head  qGrid-border-bot" });
                        cellKey = "r" + rowIndex + "c" + colIndex;

                        info.cellProperties[cellKey] = {
                            IsHeader: true,
                            CellType: enums.ObjectType.Attribute,
                            OptionCode: null,
                            ID: attribute.ID,
                            ClassName: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot"
                        }

                        rowIndex++;

                        for (var gsq in attribute.GroupSequence) {
                            var group = question.Groups[attribute.GroupSequence[gsq]];

                            for (var vsq in group.VariableSequence) {
                                var variable = question.Variables[group.VariableSequence[vsq]];

                                switch (variable.VariableType) {
                                    case enums.VariableType.SingleChoice:
                                    case enums.VariableType.MultipleChoice:
                                        if (variable.Properties.ShowAs == "2") {
                                            info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-variable-cell" })

                                            cellKey = "r" + rowIndex + "c" + colIndex;

                                            info.cellProperties[cellKey] = {
                                                IsHeader: false,
                                                CellType: enums.ObjectType.Variable,
                                                OptionCode: null,
                                                ID: variable.ID
                                            }
                                            rowIndex++;
                                        } else {
                                            for (var op in variable.VariableLevelSequence) {
                                                var optionInfo = variable.VariableLevelSequence[op];

                                                if (optionInfo.IsOption) {
                                                    var option = variable.Options[optionInfo.ID];

                                                    // info.data[rowIndex][colIndex] = option.Text[scope.language];
                                                    info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-option-cell"  + (attribute.Media[scope.language] || attribute.Media[scope.DefaultLanguage] ? " image-attribute " : "") })

                                                    cellKey = "r" + rowIndex + "c" + colIndex;

                                                    info.cellProperties[cellKey] = {
                                                        IsHeader: false,
                                                        CellType: enums.ObjectType.Option,
                                                        OptionCode: option.Code.toString(),
                                                        OptionID: option.ID,
                                                        ID: variable.ID
                                                    }
                                                    rowIndex++;

                                                    if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                                        info.data[rowIndex][colIndex] = attribute.Text[scope.language];
                                                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-header qGrid-cell-head  qGrid-border-bot" });
                                                        cellKey = "r" + rowIndex + "c" + colIndex;

                                                        info.cellProperties[cellKey] = info.cellProperties["r0" + "c" + colIndex]

                                                        rowIndex++;
                                                    }
                                                }
                                            }
                                        }
                                        break;

                                    case enums.VariableType.Text:
                                    case enums.VariableType.Numeric:
                                    case enums.VariableType.DateTime:
                                        // info.data[rowIndex][colIndex] = variable.Text[scope.language]; 
                                        info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-variable-cell" })

                                        cellKey = "r" + rowIndex + "c" + colIndex;

                                        info.cellProperties[cellKey] = {
                                            IsHeader: false,
                                            CellType: enums.ObjectType.Variable,
                                            OptionCode: null,
                                            ID: variable.ID
                                        }
                                        rowIndex++;

                                        if (info.repeatPositions.indexOf(rowIndex) != -1) {
                                            info.data[rowIndex][colIndex] = attribute.Text[scope.language];
                                            info.cell.push({ row: rowIndex, col: colIndex, className: "qGrid-cell qGrid-cell-header qGrid-cell-head  qGrid-border-bot" });
                                            cellKey = "r" + rowIndex + "c" + colIndex;

                                            info.cellProperties[cellKey] = info.cellProperties["r0" + "c" + colIndex]

                                            rowIndex++;
                                        }
                                        break;
                                }
                            }
                        }
                    }

                }

                function createRepeatedHeader(headerRow, rowIndex) {
                    var i,
                        cellKey = "",
                        refCellKey = "";

                    info.cell.push({ row: rowIndex, col: 0, className: "qGrid-cell qGrid-border-bot" });

                    for (i in headerRow) {
                        if (i == 0)
                            continue;

                        info.data[rowIndex][i] = headerRow[i];
                        info.cell.push({ row: rowIndex, col: i, className: "qGrid-cell qGrid-cell-head qGrid-cell-header qGrid-border-bot" + (info.borderCols.indexOf(i) > -1 ? " qGrid-cell-border" : "") })

                        cellKey = "r" + rowIndex + "c" + i;
                        refCellKey = "r0" + "c" + i;

                        info.cellProperties[cellKey] = info.cellProperties[refCellKey];
                    }
                }
            }

            function repeatHeadersPositions(numberOfRows) {
                //Repeat Headers
                //variable 'headersPosition' is an array which contains the positions of Headers
                var rowPosition = [];
                if (numberOfRows > 5) {
                    var headersPosition = repeatHeaders(numberOfRows, 2);
                }
                for (var position in headersPosition) {
                    if (!rowPosition[position]) {
                        rowPosition[position] = 0;
                    }
                    if (position == 0) {
                        rowPosition[position] += (headersPosition[position] + 1)
                    } else {
                        rowPosition[position] += (rowPosition[position - 1] + headersPosition[position] + 1);
                    }
                }
                return rowPosition;
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
        }
    }



})(angular);