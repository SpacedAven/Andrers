"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "bootstrap", "handlebars", "form2js", "org/forgerock/openidm/ui/admin/selfservice/AbstractSelfServiceView", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/util/AdminUtils", "bootstrap-dialog", "libs/codemirror/lib/codemirror", "libs/codemirror/mode/xml/xml", "libs/codemirror/addon/display/placeholder"], function ($, _, boostrap, handlebars, form2js, AbstractSelfServiceView, UiUtils, AdminUtils, BootstrapDialog, codeMirror) {

    var GenericSelfServiceStageView = AbstractSelfServiceView.extend({
        noBaseTemplate: true,
        element: "#SelfServiceStageDialog",
        partials: ["partials/selfservice/_translationMap.html", "partials/selfservice/_translationItem.html", "partials/form/_basicInput.html", "partials/form/_basicSelectize.html", "partials/form/_tagSelectize.html"],
        model: {
            codeMirrorConfig: {
                lineNumbers: true,
                autofocus: false,
                viewportMargin: Infinity,
                theme: "forgerock",
                mode: "xml",
                htmlMode: true,
                lineWrapping: true
            }
        },

        render: function render(args, dialogRef) {
            var _this = this;

            var self = this;
            this.data = _.clone(args.data, true);
            this.args = _.clone(args, true);

            this.template = "partials/selfservice/_" + args.type + ".html";

            this.parentRender(function () {

                _.each(dialogRef.$modalBody.find(".email-message-code-mirror-disabled"), function (instance) {
                    codeMirror.fromTextArea(instance, _.extend({ readOnly: true, cursorBlinkRate: -1 }, _this.model.codeMirrorConfig));
                });

                if (dialogRef.$modalBody.find(".email-message-code-mirror")[0]) {
                    _this.cmBox = codeMirror.fromTextArea(dialogRef.$modalBody.find(".email-message-code-mirror")[0], _this.model.codeMirrorConfig);
                    _this.cmBox.on("change", function () {
                        _this.checkAddTranslation();
                    });
                }

                if (_this.data.userPreferencesDisplay) {
                    _.each(_this.data.registrationPreferences, function (value) {
                        dialogRef.$modalBody.find("#checkbox-" + value).prop('checked', true);
                    });
                }

                //Setup for both selectizes for the identity provider and email field
                _this.model.identityServiceSelect = dialogRef.$modalBody.find("#select-identityServiceUrl").selectize({
                    "create": true,
                    "persist": false,
                    "allowEmptyOption": true,
                    onChange: function onChange(value) {
                        var _this2 = this;

                        self.model.identityEmailFieldSelect[0].selectize.clearOptions();
                        self.model.identityEmailFieldSelect[0].selectize.load(function (callback) {
                            AdminUtils.findPropertiesList(value.split("/")).then(_.bind(function (properties) {
                                var keyList = _.chain(properties).keys().sortBy().value(),
                                    propertiesList = [];

                                _.each(keyList, function (key) {
                                    propertiesList.push({
                                        text: key,
                                        value: key
                                    });
                                });

                                callback(propertiesList);

                                self.model.identityEmailFieldSelect[0].selectize.setValue(propertiesList[0].value);
                            }, _this2));
                        });
                    }
                });

                _this.model.identityEmailFieldSelect = dialogRef.$modalBody.find("#select-identityEmailField").selectize({
                    "create": true,
                    "persist": false,
                    "allowEmptyOption": true
                });

                dialogRef.$modalBody.on("submit", "form", function (e) {
                    e.preventDefault();
                    return false;
                });
                dialogRef.$modalBody.on("click", ".translationMapGroup button.add", { currentStageConfig: _this.args.data }, _.bind(_this.addTranslation, _this));

                dialogRef.$modalBody.on("click", ".translationMapGroup button.delete", { currentStageConfig: _this.args.data }, _.bind(_this.deleteTranslation, _this));

                dialogRef.$modalBody.on("keyup", ".translationMapGroup .newTranslationLocale, .translationMapGroup .newTranslationText", { currentStageConfig: _this.args.data }, _.bind(_this.checkAddTranslation, _this));
            }, this);
        },

        getData: function getData() {
            var formData = form2js("configDialogForm", ".", true);

            if (this.args.type === "idmUserDetails") {
                _.filter(this.args.stageConfigs, { "name": "idmUserDetails" })[0].identityEmailField = formData.identityEmailField;
                var localAutoLogin = _.filter(this.args.stageConfigs, { "name": "localAutoLogin" })[0];
                if (localAutoLogin) {
                    localAutoLogin.successUrl = formData.successUrl;
                }
                _.filter(this.args.stageConfigs, { "name": "idmUserDetails" })[0].registrationPreferences = formData.registrationPreferences;
                _.filter(this.args.stageConfigs, { "name": "selfRegistration" })[0].identityServiceUrl = formData.identityServiceUrl;
            } else {
                _.extend(this.args.data, formData);
            }

            if (formData.snapshotToken) {
                this.args.snapshotToken = formData.snapshotToken;
            }

            return this.args;
        }
    });

    return new GenericSelfServiceStageView();
});
