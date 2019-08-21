/**
 * Created by AnkitS on 10/19/2016.
 */
(function (angular) {

    "use strict";

    angular.module("SurveyEngineCore")
        .service("EngineCore.TestGenerator", ['SurveyEngine.RespondentService', 'SurveyEngine.Enums', 'EngineCore.SurveyTreeService', testGenerator]);

    function testGenerator(RespondentService, Enums, SurveyTreeService) {
        var vm = this;

        vm.isTestEnabled = false;
        vm.MaxTestCount = 0;
        vm.AllowSync = true;
        vm.TestResponses = [];

        var frequency = {};
        var loopVariables = {};

        vm.InitTest = function (buffer) {
            require(['randexp'], function () {
                top : for (var i = 0; i < buffer.length; i++) {
                    var variables = [],
                        variable;
                    if (isGridQuestion(buffer[i].QuestionType)) {
                        var groups = buffer[i].Groups;
                        for (var j in groups) {
                            var vars = groups[j].VariableSequence;
                            for (var x = 0; x < vars.length; x++) {
                                variable = buffer[i].Variables[vars[x]];
                                variable.QID = buffer[i].ID;
                                variables.push(variable);
                            }
                        }
                    } else {
                        var seq = buffer[i].QuestionLevelSequence;
                        var heatMapVars = [], rankNumeric = [], rankCategory = [], groupColumns = [], variableColumns =[];
                        for (var j = 0; j < seq.length; j++) {
                            if (seq[j].ObjectType == Enums.ObjectType.Variable) {
                                variable = buffer[i].Variables[seq[j].ID];
                                if (variable) {
                                    variable.QID = buffer[i].ID;
                                    if (buffer[i].QuestionType === Enums.QuestionType.HeatMap) {
                                        if (variable.VariableType == Enums.VariableType.Numeric) {
                                            for (var lang in variable.AnalysisText) {
                                                if (variable.AnalysisText[lang].indexOf("._1") > -1) {
                                                    heatMapVars.push(variable);
                                                }
                                            }
                                        } else {
                                            heatMapVars.push(variable);
                                        }
                                    } else {
                                        variables.push(variable);
                                    }
                                }
                            } else if (seq[j].ObjectType == Enums.ObjectType.Attribute) {
                                var attr = buffer[i].Attributes[seq[j].ID];
                                if (buffer[i].QuestionType == Enums.QuestionType.Rank || buffer[i].QuestionType == Enums.QuestionType.RankAndSort) {
                                    attr.GroupSequence.map(function (g, index) {
                                        if(index > 0){
                                            return;
                                        }
                                        buffer[i].Groups[g].VariableSequence.map(function (v) {
                                            var rank = buffer[i].Variables[v];
                                            rank.QID = buffer[i].ID;
                                            rankNumeric.push(rank);
                                        });
                                    });
                                } else if (buffer[i].QuestionType == Enums.QuestionType.NumericGrid && buffer[i].Properties.ShowAs == Enums.ShowAsProperty.ConstantSum) {
                                    if (buffer[i].Properties.Total == "RowTotal") {
                                        setConstantSumValues(buffer[i], attr.GroupSequence);
                                    }else if (buffer[i].Properties.Total == "ColumnTotal") {
                                        groupColumns.push(attr.GroupSequence);
                                        attr.GroupSequence.map(function (x) {
                                            variableColumns.push(buffer[i].Groups[x].VariableSequence);
                                        });
                                    }
                                }
                            }
                        }
                        if(groupColumns.length > 0 && variableColumns.length > 0){
                            var transposed = transpose(groupColumns);
                            var transVariables = transpose(variableColumns);
                            transposed.map(function (d) {
                                d.map(function (x, ind) {
                                    if(ind == 0){
                                        transVariables.map(function (v) {
                                            var q = angular.copy(buffer[i]);
                                            q.Groups[x].VariableSequence = v;
                                            setConstantSumValues(q, [x]);
                                        });
                                    }
                                });
                            });

                        }
                        for (var gid in buffer[i].Groups) {
                            if (typeof buffer[i].Groups[gid] == "object" && buffer[i].Groups[gid].Text["en-us"].indexOf("rank_holder") > -1) {
                                buffer[i].Groups[gid].VariableSequence.map(function (d) {
                                    var rank = buffer[i].Variables[d];
                                    rank.QID = buffer[i].ID;
                                    rankCategory.push(rank);
                                })
                            }
                        }
                        if (heatMapVars.length > 0) {
                            vm.GenerateTest(heatMapVars);
                        }
                        if (rankCategory.length > 0 && rankNumeric.length > 0) {
                            var excluded = [];
                            rankCategory.map(function (d, i) {
                                vm.GenerateTest([d], excluded);
                                var code = RespondentService.GetVariableAnswers(d.Name)[0];
                                excluded.push(code);
                                var numeric = rankNumeric[code - 1];
                                var answerObj = RespondentService.GetAnswerObject();
                                answerObj.VariableName = numeric.Name;
                                answerObj.QuestionID = numeric.QID;
                                answerObj.Values = [i + 1];
                                answerObj.VariableType = numeric.VariableType;
                                RespondentService.SaveAnswer(answerObj);
                            })
                        }
                    }
                    vm.GenerateTest(variables);
                }
                console.log(RespondentService.GetAnswers());
            });
        }

        vm.GenerateTest = function (variables, exclude) {
            var answeredValues = [];
            var answeredVariables = [];
            for (var i in variables) {
                var otherVariables = [];
                var question = SurveyTreeService.getQuesObject(variables[i].QID.split('|')[0]);
                var inputs = getInputs(variables[i], exclude);
                if (question.QuestionType == Enums.QuestionType.HeatMap) {
                    if (i == 0) {
                        inputs = [inputs[0]];
                    } else {
                        var xVar = variables[i];
                        var catVar = variables[0];
                        var catAns = RespondentService.GetVariableAnswers(catVar.Name);
                        var minRange = [], maxRange = [];
                        var catOpt = catVar.Options[catAns[0]];
                        if (typeof catOpt.heatMapConfig == "object") {
                            minRange[0] = catOpt.heatMapConfig.left + 1;
                            minRange[1] = catOpt.heatMapConfig.top + 1;
                            maxRange[0] = catOpt.heatMapConfig.left + catOpt.heatMapConfig.width - 1;
                            maxRange[1] = catOpt.heatMapConfig.top + catOpt.heatMapConfig.height - 1;
                        }
                        if (i == 1) {
                            xVar.Properties.Min = minRange[0];
                            xVar.Properties.Max = maxRange[0];
                            inputs = getInputs(xVar);
                        } else if (i == 2) {
                            xVar.Properties.Min = minRange[1];
                            xVar.Properties.Max = maxRange[1];
                            inputs = getInputs(xVar);
                        }
                    }
                }
                if (question.QuestionType == Enums.QuestionType.MaxDiff) {
                    // check for answered option so that it will not answered again
                    if (answeredValues.length < 2 && !answeredVariables.hasItem(variables[i].Name)) {
                        inputs = inputs.map(function (d) {
                            if (answeredValues.hasItem(1)) {
                                return 2;
                            }
                            else if (answeredValues.hasItem(2)) {
                                return 1;
                            }
                            return d;
                        });
                    } else {
                        continue;
                    }
                }
                // check if other or exculsive is answered
                for (var opt in variables[i].Options) {
                    if (inputs.hasItem(opt) && variables[i].Options[opt].IsOther) {
                        otherVariables.push(variables[i].Options[opt].OtherVariableID);
                    } else if (inputs.hasItem(opt) && variables[i].Options[opt].IsExclusive) {
                        inputs = [opt];
                        otherVariables = [];
                        if (variables[i].Options[opt].IsOther) {
                            otherVariables.push(variables[i].Options[opt].OtherVariableID);
                        }
                        break;
                    }
                }
                for (var x = 0; x < otherVariables.length; x++) {
                    try {
                        question.Variables[otherVariables[x]].QID = variables[i].QID;
                    } catch (e) {
                        console.log(e);
                    }
                    vm.GenerateTest([question.Variables[otherVariables[x]]]);
                }
                var splits = variables[i].Name.split('.');
                if (splits.length > 1) {
                    if (!loopVariables.hasOwnProperty(splits[0])) {
                        loopVariables[splits[0]] = [];
                    }
                    if (!loopVariables[splits[0]].hasItem(splits[1])) {
                        loopVariables[splits[0]].push(splits[1]);
                    }
                }
                var answerObj = RespondentService.GetAnswerObject();
                answerObj.VariableName = variables[i].Name;
                answerObj.QuestionID = variables[i].QID;
                answerObj.Values = inputs;
                answerObj.VariableType = variables[i].VariableType;
                answerObj.DisplayedValues = Object.keys(variables[i].Options);
                RespondentService.SaveAnswer(answerObj);
                answeredValues = answeredValues.concat(inputs);
                answeredVariables.push(variables[i].Name);
            }
        }

        vm.GenerateReport = function () {
            calculateVariableFreq();
            var questionGUIDs = SurveyTreeService.getSurveyTreeQuestionIds();
            var html = "";
            for (var i = 0; i < questionGUIDs.length; i++) {
                var question = SurveyTreeService.getQuesObject(questionGUIDs[i]);
                if (question.hasOwnProperty("Name") && question.hasOwnProperty("Text")) {
                    html += "<div style='padding:20px;font-family: sans-serif;border: 1px solid whitesmoke; box-shadow: 1px 1px 1px #eae9e9;" +
                        "border-radius: 4px;margin-bottom: 20px;'><span style='font-weight: bold;'>" + question.Name + " : " + question.Text["en-us"] + "</span>";
                    for (var id in question.Variables) {
                        if (frequency.hasOwnProperty(question.Variables[id].Name)) {
                            html += getVariableFreq(question.Variables[id]);
                        } else if (loopVariables.hasOwnProperty(question.Variables[id].Name)) {
                            for (var itr = 0; itr < loopVariables[question.Variables[id].Name].length; itr++) {
                                var loopVar = angular.copy(question.Variables[id]);
                                loopVar.Name += "." + loopVariables[question.Variables[id].Name][itr];
                                html += getVariableFreq(loopVar);
                            }
                        }
                    }
                    html += "</div>";
                }
            }
            return html;
        }

        function getInputs(variable, exclude) {
            var chance = new Chance();
            switch (variable.VariableType) {
                case Enums.VariableType.SingleChoice :
                    var options = [];
                    for (var i in variable.Options) {
                        options.push(i);
                    }
                    if (Array.isArray(exclude)) {
                        options = options.filter(function (d) {
                            return !exclude.hasItem(d);
                        });
                    }
                    if (options.length == 0) {
                        return [];
                    }
                    return chance.pickset(options, 1);
                case Enums.VariableType.MultipleChoice :
                    var options = [];
                    for (var i in variable.Options) {
                        options.push(i);
                    }
                    if (options.length == 0) {
                        return [];
                    }
                    return chance.pickset(options, 2);
                case Enums.VariableType.Text :
                    var min = variable.Properties.Min || 0;
                    var max = variable.Properties.Max || 100;
                    var regex = variable.Properties.RegexValue1;
                    var text;
                    if(regex){
                        var randexp = new RandExp(regex);
                        text = randexp.gen();
                    }else{
                        var randLength = chance.integer({min: min, max: max});
                        text = chance.word({length: randLength});
                    }
                    return [text];
                case Enums.VariableType.Numeric :
                    var min = variable.Properties.Min || 0;
                    var max = variable.Properties.Max || 1000;
                    var isDecimal = variable.Properties.Decimal == "Decimal";
                    var number;
                    if (isDecimal) {
                        number = chance.floating({min: min, max: max, fixed: variable.Properties.DecimalPlacesCount});
                    } else {
                        number = chance.integer({min: min, max: max});
                    }
                    return [number];
                case Enums.VariableType.DateTime :
                    var start = variable.Properties.StartDate;
                    var end = variable.Properties.EndDate;
                    var btwTimestamp;
                    if (start && end) {
                        var startDate = new Date(start).getTime();
                        var endDate = new Date(end).getTime();
                        btwTimestamp = chance.integer({min: startDate + 1, max: endDate - 1});
                    }
                    if (typeof btwTimestamp == "number") {
                        return [new Date(btwTimestamp)];
                    } else {
                        return [chance.date()];
                    }
            }
        }

        function calculateVariableFreq() {
            for (var i = 0; i < vm.TestResponses.length; i++) {
                for (var name in vm.TestResponses[i]) {
                    if (name in frequency) {
                        if (vm.TestResponses[i][name].VariableType == Enums.VariableType.SingleChoice || vm.TestResponses[i][name].VariableType == Enums.VariableType.MultipleChoice) {
                            for (var j = 0; j < vm.TestResponses[i][name].Values.length; j++) {
                                if (frequency[name][vm.TestResponses[i][name].Values[j]]) {
                                    frequency[name][vm.TestResponses[i][name].Values[j]]++;
                                } else {
                                    frequency[name][vm.TestResponses[i][name].Values[j]] = 1;
                                }
                            }
                        } else {
                            frequency[name]++;
                        }
                    } else {
                        if (vm.TestResponses[i][name].VariableType == Enums.VariableType.SingleChoice || vm.TestResponses[i][name].VariableType == Enums.VariableType.MultipleChoice) {
                            frequency[name] = {};
                            for (var j = 0; j < vm.TestResponses[i][name].Values.length; j++) {
                                frequency[name][vm.TestResponses[i][name].Values[j]] = 1;
                            }
                        } else {
                            frequency[name] = 1;
                        }
                    }
                }
            }
            console.log(frequency);
        }

        function getVariableFreq(variable) {
            var html = "<div style='padding: 20px 40px;'><span style='font-weight: bold;'>" + variable.Name + " : </span>" + variable.Text["en-us"] + "</div>";
            switch (variable.VariableType) {
                case Enums.VariableType.SingleChoice:
                case  Enums.VariableType.MultipleChoice:
                    for (var opt in variable.Options) {
                        var count = frequency[variable.Name][opt] || 0;
                        var width = "", color = "";
                        if (getWidth(count) > 0) {
                            width = "width: " + getWidth(count) + "%;";
                            color = "background: " + getRandomColor() + ";";
                        }
                        html += "<div style='padding: 5px 80px;'><span style='width: 5%;display: inline-block;'>" + opt + ". </span>" +
                            "<span style='width: 30%;display: inline-block;'>" + variable.Options[opt].Text["en-us"] +
                            "</span><span style='width: 60%;display: inline-block;border: 1px solid whitesmoke;'>" +
                            "<span style='display: inline-block;padding: 5px;" + color + width + "'>" + count + "</span></span></div>";
                    }
                    break;

                case Enums.VariableType.Text:
                case Enums.VariableType.Numeric:
                case Enums.VariableType.DateTime:
                    var count = frequency[variable.Name] || 0;
                    var width = "", color = "";
                    if (getWidth(count) > 0) {
                        width = "width: " + getWidth(count) + "%;";
                        color = "background: " + getRandomColor() + ";";
                    }
                    html += "<div style='padding: 5px 80px;'>" +
                        "<span style='width: 5%;display: inline-block;'></span>" +
                        "<span style='width: 30%;display: inline-block;'></span>" +
                        "<span style='width: 60%;display: inline-block;border: 1px solid whitesmoke;'>" +
                        "<span style='display: inline-block;padding: 5px;overflow: hidden;" + color + width + "'>" + count + "</span></span></div>";
                    break;
            }
            return html;
        }

        function getRandomColor() {
            var letters = 'BCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * letters.length)];
            }
            return color;
        }

        function getWidth(count) {
            return (count / vm.TestResponses.length) * 100;
        }

        function isGridQuestion(type) {
            return type == Enums.QuestionType.SimpleGrid ||
                type == Enums.QuestionType.ComplexGrid ||
                type == Enums.QuestionType.Distribution ||
                type == Enums.QuestionType.Distribution2 ||
                type == Enums.QuestionType.Slider ||
                type == Enums.QuestionType.MaxDiff ||
                type == Enums.QuestionType.TextGrid;
        }

        function setConstantSumValues(question, groups) {
            groups.map(function (g) {
                var totalVars = question.Groups[g].VariableSequence.length;
                var totalCount = question.Properties.TotalCount;
                var value = totalCount / totalVars;
                var variable = question.Variables[question.Groups[g].VariableSequence[0]];
                var answerObj = RespondentService.GetAnswerObject();
                answerObj.VariableName = variable.Name;
                answerObj.QuestionID = question.ID;
                var decimalPart = value % 1;
                answerObj.Values = [Math.floor(value)];
                answerObj.VariableType = variable.VariableType;
                RespondentService.SaveAnswer(answerObj);
                question.Groups[g].VariableSequence.slice(1).map(function (v, index) {
                    var variable = question.Variables[v];
                    var answerObj = RespondentService.GetAnswerObject();
                    answerObj.VariableName = variable.Name;
                    answerObj.QuestionID = question.ID;
                    if (index == (question.Groups[g].VariableSequence.length - 2)) {
                        var sum = Math.floor(value) + Math.ceil(decimalPart * (index+1));
                        if (question.Properties.TotalOperator == ">" || question.Properties.TotalOperator == ">=") {
                            sum+=10;
                        } else if (question.Properties.TotalOperator == "<" || question.Properties.TotalOperator == "<=") {
                            sum-=10;
                        }
                        answerObj.Values = [sum];
                    } else {
                        answerObj.Values = [Math.floor(value)];
                    }
                    answerObj.VariableType = variable.VariableType;
                    RespondentService.SaveAnswer(answerObj);
                });
            });
        }

        function transpose(array) {
            return array[0].map(function(col, i) {
                return array.map(function(row) {
                    return row[i]
                });
            });
        }
    }
})(angular);
