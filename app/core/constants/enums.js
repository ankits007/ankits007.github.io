(function (angular) {
    angular
        .module("SurveyEngine")
        .constant("SurveyEngine.Enums", {
            SurveyClosed: {
                Open: 1,
                Closed: 2
            },
            SurveyType: {
                Live: 1,
                Test: 2
            },
            SurveyMode: {
                New: 1,
                Resume: 2,
                Review: 3,
                Preview: 4,
                View: 5
            },
            SurveyStatus: {
                Partial: 1,
                Completed: 2,
                Terminated: 3
            },
            BackCheckStatus: {
                NotDone: 1,
                Accepted: 2,
                Rejected: 3
            },
            Channel: {
                AnonymousLink: 1,
                AnonymousEmailCampaignLink: 2,
                PersonalizedEmailCampaignLink: 3,
                PersonalizedLink: 4,
                OfflineAnonymous: 5,
                OfflinePersonalized: 6,
                AutoPersonalizedEmails: 7,
                DataUpload: 8,
                AnonymousSMSCampaignLink: 9,
                PersonalizedSMSCampaignLink: 10,
                FacebookLink: 11,
                TwitterLink: 12,
                LinkedinLink: 13,
                GooglePlusLink: 14,
                PanelLink: 15

            },
            VariableType: {
                SingleChoice: 1,
                MultipleChoice: 2,
                Text: 3,
                Numeric: 4,
                DateTime: 5
            },
            SequenceType: {
                InOrder: 1,
                InRandomOrder: 2,
                PickNInRandomOrder: 3
            },
            QuestionType: {
                SingleChoice: 1,
                MultipleChoice: 2,
                Text: 3,
                Numeric: 4,
                DateTime: 5,
                Rank: 6,
                RankAndSort: 7,
                Slider: 8,
                NPS: 9,
                Display: 10,
                SimpleGrid: 11,
                ComplexGrid: 12,
                TextGrid: 13,
                NumericGrid: 14,
                BipolarGrid: 15,
                MaxDiff: 16,
                Smiley: 17,
                Stars: 18,
                MultimediaCapture: 19,
                ConstantSumGrid: 20,
                Distribution: 21,
                LikeDislike: 22,
                HeatMap: 23,
                HeatZone: 24,
                AutocodeText: 25,
                OTP: 26,
                Distribution2 : 27
            },
            QuestionCategory: {
                System: 1,
                Survey: 2,
                Sample: 3,
                Calculated: 4,
                External: 5
            },
            LoopIterationType: {
                AllAnswered: 1,
                TopNAnswered: 2,
                PickRandomN: 3,
                Numeric: 4,
                DateTime: 5
            },
            LoopChoice: {
                QuestionBased: 3,
                Fixed: 4
            },
            LoopChoiceSelection: {
                InOrder: 1,
                Randomly: 2
            },
            SurveyObjectType: {
                Question: 1,
                Section: 2,
                List: 4,
                Script: 5,
                PageBreak: 6,
                Sequencer: 7,
                Jump: 8,
                SetValue: 9,
                SurveyEnd: 13,
                Quota : 23
            },
            MetadataProperty: {
                ETag: 1,
                CreatedOn: 2,
                CreatedBy: 3,
                ModifiedOn: 4,
                ModifiedBy: 5,
                IsDeleted: 6,
                DeletedOn: 7,
                DeletedBy: 8
            },
            ShowAsProperty: {
                Radio: 1,
                DropBox: 2,
                CheckBox: 3,
                SelectBox: 4,
                MultiSelectBox: 5,
                NumberBox: 6,
                DragAndDrop: 7,
                PickAndSort: 8,
                RankIntoGroups: 9,
                Rank: 10,
                ConstantSum: 11,
                SingleLine: 12,
                MultiLine: 13,
                SingleSelectImage: 14,
                MultipleSelectImage: 15,
                SingleSelectLonglist:17,
                MultiSelectLonglist:18
            },
            ObjectType: {
                Question: 1,
                Section: 2,
                SurveyTree: 3,
                List: 4,
                Script: 5,
                PageBreak: 6,
                Sequencer: 7,
                Jump: 8,
                SetValue: 9,
                Variable: 10,
                AttributeHeader: 11,
                Attribute: 12,
                SurveyEnd: 13,
                CarryForward: 18,
                Group: 20,
                Quota : 23
            },

            SectionObjectType: {
                Question: "Question",
                Section: "Section",
                Logic: 'Logic',
                Jump: "Jump"
            },

            DisplayFlag: {
                Hidden: 1,
                Mandatory: 2,
                QuestionMasking: 4,
                OptionMasking: 8,
                ValidationScript: 16,
                IsLoop: 32,
                Deleted: 64
            },

            ScriptType: {
                QuestionMasking: 1,
                OptionMasking: 2,
                Jump: 3,
                Validation: 4,
                SetValue: 5,
                GroupMasking: 6,
                AttributeMasking: 7,
                VariableMasking: 8,
                OptionCarryForwardScript: 9,
                AttributeCarryForwardScript: 10,
                OptionShow: 11
            },

            ValidationType: {
                NoValidation: -1,
                Valid: 1,
                InValid: 0,
                AutoCodeConflict : 2,
                AutoCodeSimilarity : 3,
                SkipValidation: 99
            },
            Mandatory: {
                NotMandatory: 1,
                WarnAndContinue: 2,
                Mandatory: 3
            },
            MediaType: {
                Picture: 1,
                Audio: 2,
                Video: 3,
                Text: 4
            },
            ProgressBar: {
                None: 1,
                WithText: 2,
                WithoutText: 3
            },
            ShowProgressAs :{
                Percentage : 'percentage',
                Text : 'text'
            },
            CarryForwardFromToReferenceType: {
                OptionToOption: 1,
                OptionToAttribute: 2,
                AttributeToOption: 3,
                AttributeToAttribute: 4

            },
            CarryForwardReferenceType: {
                Option: 1,
                Attribute: 2
            },

            HeatmapProperties: {
                HiddenUntilHover: 1,
                AlwaysVisible: 2,
                AlwaysHidden: 3
            },

            QuotaMetAction :{
                EndSurvey : 1,
                EndSurveyAndPanelRedirect : 2,
                JumpTo : 3
            },
            TimeoutAction : {
                AutoMove : 1,
                ShowText : 2
            },
            NPS :{
                Detractor : 1,
                Passive : 2,
                Promoter : 3
            }

        });
})(angular);