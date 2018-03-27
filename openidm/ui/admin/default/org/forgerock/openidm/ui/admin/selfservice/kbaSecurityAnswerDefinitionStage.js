"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "bootstrap", "handlebars", "form2js", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/util/AdminUtils", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function ($, _, boostrap, Handlebars, form2js, AbstractView, UiUtils, AdminUtils, ValidatorsManager, ConfigDelegate) {

    var kbaSecurityAnswerDefinitionStage = AbstractView.extend({
        element: "#SelfServiceStageDialog",
        template: "templates/admin/selfservice/kbaSecurityAnswerDefinitionStage.html",
        noBaseTemplate: true,
        events: {
            "click .fa-pencil": "showEditPanel",
            "click .cancel-add-edit": "cancelAdd",
            "click .add-translation": "addTranslation",
            "click .update-add-edit": "updateQuestion",
            "click .addEditPanel .fa-times": "deleteQuestionTranslation",
            "click .preview-row .fa-times": "deleteQuestion",
            "click .add-question": "addQuestion",
            "change .translation-locale": "checkLocale"
        },
        partials: ["partials/selfservice/_kbaTranslation.html", "partials/_alert.html"],
        model: {
            selectize: {}
        },
        data: {
            "locales": ["de", "en", "en_GB", "es", "fr", "it", "ja", "ko", "pt_BR", "sv", "zh_CN", "zh_TW"]
        },
        render: function render(args) {
            var _this = this;

            _.extend(this.data, args.data, true);
            this.args = _.clone(args, true);

            this.data.locales = _.sortBy(this.data.locales);

            ConfigDelegate.readEntity("selfservice.kba").then(function (kba) {
                _this.model.kba = _.clone(kba, true);
                _this.data.questions = _this.getFormattedQuestions(kba.questions);
                _this.data.minimumAnswersToDefine = kba.minimumAnswersToDefine;
                _this.data.minimumAnswersToVerify = kba.minimumAnswersToVerify;
                _this.model.questions = _.clone(_this.data.questions, true);
                _this.renderParent();
            });
        },

        renderParent: function renderParent() {
            var _this2 = this;

            this.model.usedQuestionKeys = _.map(this.model.questions, function (translations, key) {
                var num = parseInt(key, 10);

                if (!_.isNaN(num)) {
                    return num;
                } else {
                    return key;
                }
            });

            if (this.$el.find("#input-minimumAnswersToVerify").length) {
                this.data.minimumAnswersToDefine = this.$el.find("#input-minimumAnswersToDefine").val();
                this.data.minimumAnswersToVerify = this.$el.find("#input-minimumAnswersToVerify").val();
            }

            this.parentRender(function () {
                _.each(_this2.data.questions, function (val, key) {
                    _this2.model.selectize[key] = _this2.$el.find(".editPanel[data-question-key='" + key + "'] .translation-locale").selectize({
                        "create": true,
                        "createOnBlur": true
                    });
                });

                _this2.model.addSelectize = _this2.$el.find(".addPanel .translation-locale").selectize({
                    "create": true,
                    "createOnBlur": true
                });

                ValidatorsManager.bindValidators(_this2.$el.find("#kbaSecurityAnswerDefinitionStage"));
                ValidatorsManager.validateAllFields(_this2.$el.find("#kbaSecurityAnswerDefinitionStage"));
            });
        },

        checkLocale: function checkLocale(e) {
            var addTranslationContainer = $(e.currentTarget).closest(".input-row"),
                selectedLocale = e.currentTarget.value,
                questionPanel = $(e.currentTarget).closest(".addEditPanel"),
                key = questionPanel.attr("data-question-key"),
                usedLocales = _.map(this.model.questions[key], "locale");

            if (_.indexOf(usedLocales, selectedLocale) > -1) {
                questionPanel.find(".localeAlert").show();
                addTranslationContainer.find(".add-translation").toggleClass("disabled", true);
            } else {
                questionPanel.find(".localeAlert").hide();
                addTranslationContainer.find(".add-translation").toggleClass("disabled", false);
            }
        },

        getFreshKey: function getFreshKey(usedKeys) {
            var max = _.max(usedKeys);

            if (max === -Infinity) {
                return 1;
            } else {
                return max + 1;
            }
        },

        addQuestion: function addQuestion(e) {
            e.preventDefault();
            this.$el.find(".addPanel").show();
            this.$el.find(".add-question").hide();

            this.$el.find(".preview-row").show();
            this.$el.find(".editPanel").hide();
            this.clearInputs();

            this.$el.find(".addPanel").attr("data-question-key", this.getFreshKey(this.model.usedQuestionKeys));
        },

        addTranslation: function addTranslation(e) {
            e.preventDefault();

            if ($(e.currentTarget).hasClass("disabled")) {
                return false;
            }

            var panel = $(e.currentTarget).closest(".addEditPanel"),
                key = panel.attr("data-question-key"),
                locale = panel.find(".translation-locale").val(),
                translation = {
                "locale": locale,
                "translation": panel.find(".translation-value").val()
            },
                insertedIndex,
                newRow;

            if (!_.isArray(this.model.questions[key])) {
                this.model.questions[key] = [];
            }

            this.model.questions[key].push(translation);
            this.model.questions[key] = _.sortBy(this.model.questions[key], "locale");

            insertedIndex = _.findIndex(this.model.questions[key], translation);
            newRow = Handlebars.compile("{{> selfservice/_kbaTranslation}}")(translation);

            $(newRow).insertBefore(panel.find("li")[insertedIndex]);

            this.clearInputs();
        },

        clearInputs: function clearInputs() {
            this.$el.find(".translation-value").val("");

            this.model.addSelectize[0].selectize.clear();
            _.each(this.model.selectize, function (selectize) {
                selectize[0].selectize.clear();
            });

            this.$el.find(".add-translation").toggleClass("disabled", true);
        },

        deleteQuestion: function deleteQuestion(e) {
            e.preventDefault();

            var container = $(e.currentTarget).closest(".preview-row"),
                key = container.attr("data-question-key"),
                translationContainer = container.next();

            delete this.model.questions[key];

            delete this.data.questions[key];

            container.remove();
            translationContainer.remove();
        },

        deleteQuestionTranslation: function deleteQuestionTranslation(e) {
            e.preventDefault();

            var questionPanel = $(e.currentTarget).closest(".addEditPanel"),
                key = questionPanel.attr("data-question-key"),
                translationContainer = $(e.currentTarget).closest("li"),
                deleteIndex = _.findIndex(questionPanel.find(".translation"), function (el) {
                return el === translationContainer[0];
            });

            this.model.questions[key].splice(deleteIndex, 1);
            translationContainer.remove();
        },

        updateQuestion: function updateQuestion(e) {
            e.preventDefault();
            this.data.questions = _.clone(this.model.questions, true);

            this.renderParent();
        },

        /**
         * Takes the raw questions object from selfservice.kba.json and formats the data for handlebars rendering
         * @param unformattedQuestions {object}
         * @returns {*}
         */
        getFormattedQuestions: function getFormattedQuestions(unformattedQuestions) {
            var questions = _.clone(unformattedQuestions, true);

            _.each(unformattedQuestions, function (question, key) {
                questions[key] = [];
                _.each(question, function (translation, locale) {
                    questions[key].push({
                        "locale": locale,
                        "translation": translation
                    });
                });
                questions[key] = _.sortBy(questions[key], "locale");
            });

            return questions;
        },

        saveKBA: function saveKBA() {
            var _this3 = this;

            this.model.kba.minimumAnswersToDefine = parseInt(this.$el.find("#input-minimumAnswersToDefine").val(), 10);
            this.model.kba.minimumAnswersToVerify = parseInt(this.$el.find("#input-minimumAnswersToVerify").val(), 10);

            this.model.kba.questions = {};

            _.each(this.data.questions, function (questionArray, key) {
                _this3.model.kba.questions[key] = {};
                _.each(questionArray, function (val) {
                    _this3.model.kba.questions[key][val.locale] = val.translation;
                });
            });

            ConfigDelegate.updateEntity("selfservice.kba", this.model.kba);
        },

        getData: function getData() {
            this.saveKBA();

            return this.args;
        },

        showEditPanel: function showEditPanel(e) {
            e.preventDefault();
            var key = $(e.currentTarget).closest("li").attr("data-question-key");

            // If a panel is opened while another was being worked on the previous unsaved changes
            // need to be overwritten so the ui doesn't get in an odd state
            this.model.questions = _.clone(this.data.questions, true);
            this.renderParent();

            this.$el.find(".preview-row").show();
            this.$el.find(".editPanel").hide();
            this.$el.find(".addPanel").hide();
            this.$el.find(".add-question").show();

            this.$el.find(".editPanel[data-question-key='" + key + "']").slideToggle(300);
            this.$el.find(".editPanel[data-question-key='" + key + "']").prev().hide();
        },

        cancelAdd: function cancelAdd(e) {
            e.preventDefault();
            this.renderParent();
        },

        validationSuccessful: function validationSuccessful(event) {
            AbstractView.prototype.validationSuccessful(event);
            this.$el.closest(".modal-content").find("#saveUserConfig").toggleClass("disabled", false);
        },

        validationFailed: function validationFailed(event, details) {
            AbstractView.prototype.validationFailed(event, details);
            this.$el.closest(".modal-content").find("#saveUserConfig").toggleClass("disabled", true);
        }
    });

    return new kbaSecurityAnswerDefinitionStage();
});
