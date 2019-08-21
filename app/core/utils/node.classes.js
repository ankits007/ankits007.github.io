(function (window) {
    window.NodePointer =  function (parent, current, child) {
        var obj = {
            ParentNodeID: parent,
            NodeID: current,
            ChildNodeID: child
        }
        return obj;
    }

    window.EndNode =  function (status) {
        var chance = new Chance(0);
        var id = chance.guid();
        var obj = {
            "ID": id,
            "Name": "Survey End",
            "SurveyStatus": status,
            "Message": {
                "ID": chance.guid(),
                "Messages": {}
            },
            "RedirectToURL" : false,
            "RedirectURL" : "",
            "AppendPanelParameters" : false
        }
        return obj;
    }

    window.TraversalNode =  function (sectionId, questions) {
        /*
         *    Flow list node object structure
         *
         *    SectionID : {
         *       QuestionID : [variableNames]
         *    }
         *
         *    e.g.
         *     "fjsd232-sdf2332-ferf":{
         *        "fd87df-fd877fd-98fd" : ['v1', 'v2', 'v3']
         *     }
         * */
        var obj = {};
        if (sectionId && Array.isArray(questions)) {
            if (questions.length === 0)
                return obj;
            var ques = questions.map(function (d) {
                var vars = [];
                for (var i in d.Variables) {
                    vars.push(d.Variables[i].Name);
                }
                var node = {};
                node[d.ID] = vars;
                return node;
            });
            obj[sectionId] = ques;
        }
        return obj;
    }

    window.PageBreak = function () {
        // Generate GUID
        var times = new Date().getMilliseconds();
        var pageBreak = {
            "SurveyObjectType": 6,
            "SurveyObjectID": "4214165b-3eeb-423d-9011-" + times,
            "SurveyObjectSubType": 0,
            "SurveyObjectName": "Page Break",
            "Children": [],
            "MetadataProperties": {},
            "Tags": [],
            "IconFlag": 0,
            "DisplayText": {}
        };
        return pageBreak;
    }

    window.QuestionGroup = function (id) {
        return {
            AnalysisText: null,
            GroupMaskingScriptID: null,
            ID: id,
            IsMasking: false,
            Properties: {NumberOfItems: "1", ShowAs: "1"},
            Text: {},
            VariableSequence: []
        }
    }

    window.QuestionAttribute = function (id) {
        return {
            AnalysisText: {},
            AttributeMaskingScriptID: "",
            GroupSequence: [],
            ID: id,
            IsMasking: false,
            Media: {},
            Sequencer: {ID: "", SequenceType: 1, PickCount: 0, MetadataProperties: {}},
            Text: {},
            Text2: {},
        }
    }

    window.QuestionVariable  = function (variableType) {
        var chance = new Chance(0);
        var id = chance.guid();
        return {
            "OptionGroups": {},
            "Options": {},
            "VariableLevelSequence": [],
            "ID": id,
            "Name": "v19",
            "VariableType": variableType,
            "ExportTag": "",
            "Category": "",
            "ShowInSurvey": true,
            "IsExclusive": false,
            "IsFixed": false,
            "IsMasking": false,
            "Properties": {
                "ShowAs": "1",
                "NumberOfItems": "3",
                "Orientation": "Horizontal",
                "OptionRowColCount": "2",
                "IncrementScaleBy": "1"
            },
            "ValidateOptions": true,
            "OptionMaskingScriptID": "",
            "VariableMaskingScriptID": "",
            "Text": {},
            "AnalysisText": {},
            "Media": {},
            "Text2": {},
            "Sequencer": {
                "ID": "",
                "SequenceType": 1,
                "PickCount": 0,
                "MetadataProperties": {}
            }
        }
    }
})(window);