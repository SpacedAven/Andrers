"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap", "handlebars", "form2js", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/admin/delegates/SiteConfigurationDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/util/AdminUtils", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/selfservice/kbaSecurityAnswerDefinitionStage", "bootstrap-dialog", "selectize", "org/forgerock/commons/ui/common/util/AutoScroll", "dragula", "libs/codemirror/lib/codemirror", "libs/codemirror/mode/xml/xml", "libs/codemirror/addon/display/placeholder"], function ($, _, bootstrap, handlebars, form2js, AdminAbstractView, ConfigDelegate, SiteConfigurationDelegate, UiUtils, AdminUtils, EventManager, Constants, kbaSecurityAnswerDefinitionStage, BootstrapDialog, selectize, AutoScroll, dragula, codeMirror) {

    var AbstractSelfServiceView = AdminAbstractView.extend({
        events: {
            "click .all-check": "controlAllSwitch",
            "change .section-check": "controlSectionSwitch",
            "change #identityServiceUrl": "updateIdentityServiceURL",
            "click .save-config": "saveConfig",
            "click .wide-card.active": "showDetailDialog",
            "click li.disabled a": "preventTab",
            "click #configureCaptcha": "configureCaptcha"
        },
        partials: ["partials/selfservice/_identityServiceUrl.html", "partials/selfservice/_translationMap.html", "partials/selfservice/_translationItem.html", "partials/selfservice/_steps.html", "partials/selfservice/_advancedoptions.html", "partials/selfservice/_selfserviceblock.html", "partials/form/_basicInput.html", "partials/form/_basicSelectize.html", "partials/form/_tagSelectize.html"],
        data: {
            hideAdvanced: true,
            config: {},
            configList: [],
            resources: null,
            emailRequired: false,
            emailConfigured: false,
            EMAIL_STEPS: ["emailUsername", "emailValidation"],
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

        checkAddTranslation: function checkAddTranslation(e) {
            var container,
                locale,
                translation,
                btn,
                usesCodeMirror = false;

            if (_.has(e, "currentTarget")) {
                container = $(e.currentTarget).closest(".translationMapGroup");
                if (container.attr("data-uses-codemirror")) {
                    usesCodeMirror = true;
                }
                // This function was triggered from the codeMirror onchange
            } else {
                container = $(this.cmBox.getTextArea()).closest(".translationMapGroup");
                usesCodeMirror = true;
            }

            btn = container.find(".add");

            if (usesCodeMirror) {
                translation = this.cmBox.getValue();
            } else {
                translation = container.find(".newTranslationText").val();
            }

            locale = container.find(".newTranslationLocale").val();

            if (translation.length > 0 && locale.length > 0) {
                btn.prop("disabled", false);
            } else {
                btn.prop("disabled", true);
            }
        },

        addTranslation: function addTranslation(e) {
            e.preventDefault();

            var translationMapGroup = $(e.target).closest(".translationMapGroup"),
                useCodeMirror = translationMapGroup.attr("data-uses-codemirror") || false,
                addBtn = translationMapGroup.find(".add"),
                currentStageConfig = e.data.currentStageConfig,
                field = translationMapGroup.attr("field"),
                locale = translationMapGroup.find(".newTranslationLocale"),
                text = "";

            if (useCodeMirror) {
                text = this.cmBox.getValue();
            } else {
                text = translationMapGroup.find(".newTranslationText").val();
            }

            if (!_.has(currentStageConfig[field][locale.val()])) {
                currentStageConfig[field][locale.val()] = text;
                translationMapGroup.find("ul").append(handlebars.compile("{{> selfservice/_translationItem useCodeMirror=" + useCodeMirror + "}}")({
                    locale: locale.val(),
                    text: text
                }));

                if (useCodeMirror) {
                    codeMirror.fromTextArea(translationMapGroup.find(".email-message-code-mirror-disabled:last")[0], _.extend({ readOnly: true, cursorBlinkRate: -1 }, this.data.codeMirrorConfig));

                    this.cmBox.setValue("");
                } else {
                    translationMapGroup.find(".newTranslationText").val("");
                }
                locale.val("").focus();
                addBtn.attr("disabled", true);
            }
        },
        deleteTranslation: function deleteTranslation(e) {
            e.preventDefault();

            var translationMapGroup = $(e.target).closest(".translationMapGroup"),
                currentStageConfig = e.data.currentStageConfig,
                field = translationMapGroup.attr("field"),
                localeField = translationMapGroup.find(".newTranslationLocale"),
                textField = translationMapGroup.find(".newTranslationText"),
                localeValue = $(e.target).closest("li").attr("locale"),
                textValue = $(e.target).closest("li").find(".localizedText").text();

            delete currentStageConfig[field][localeValue];
            translationMapGroup.find("li[locale='" + localeValue + "']").remove();

            localeField.val(localeValue);
            textField.val(textValue).focus();
        },
        createConfig: function createConfig() {
            this.setKBAEnabled();
            return $.when(ConfigDelegate.createEntity(this.model.configUrl, this.orderCheck()), ConfigDelegate.updateEntity("ui/configuration", this.model.uiConfig)).then(function () {
                SiteConfigurationDelegate.updateConfiguration(function () {
                    EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                });
            });
        },
        deleteConfig: function deleteConfig() {
            this.setKBAEnabled();
            return $.when(ConfigDelegate.deleteEntity(this.model.configUrl), ConfigDelegate.updateEntity("ui/configuration", this.model.uiConfig)).then(function () {
                SiteConfigurationDelegate.updateConfiguration(function () {
                    EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                });
            });
        },
        controlAllSwitch: function controlAllSwitch(event) {
            var check = $(event.target),
                tempConfig;

            this.data.enableSelfService = check.is(":checked");

            if (check.is(":checked")) {
                this.enableForm();

                this.model.surpressSave = true;

                _.each(this.$el.find(".wide-card"), function (card) {
                    tempConfig = _.find(this.data.configList, function (config) {
                        return $(card).attr("data-type") === config.type;
                    }, this);

                    if (tempConfig.enabledByDefault) {
                        if ($(card).find(".section-check").length > 0) {
                            if (tempConfig.emailStep && !this.data.emailConfigured) {
                                $(card).find(".section-check").prop("checked", false).trigger("change", true);
                                $(card).find(".section-check").prop("disabled", true);
                                $(card).find(".email-step-error-container").show();
                            } else {
                                $(card).find(".section-check").prop("checked", true).trigger("change");
                                $(card).find(".section-check").prop("disabled", false);
                            }
                        } else {
                            $(card).toggleClass("disabled", false);
                        }
                    } else {
                        this.model.saveConfig.stageConfigs = _.reject(this.model.saveConfig.stageConfigs, function (stage) {
                            return stage.name === $(card).attr("data-type");
                        });
                    }
                }, this);

                this.model.surpressSave = false;

                this.model.uiConfig.configuration[this.model.uiConfigurationParameter] = true;

                this.createConfig().then(_.bind(function () {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, this.model.msgType + "Save");
                }, this));
            } else {
                this.disableForm();

                this.model.surpressSave = true;
                this.$el.find(".section-check:checked").prop("checked", false).trigger("change");
                this.$el.find(".email-step-error-container").hide();
                this.model.surpressSave = false;
                this.model.uiConfig.configuration[this.model.uiConfigurationParameter] = false;

                this.deleteConfig().then(_.bind(function () {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, this.model.msgType + "Delete");
                }, this));
            }

            tempConfig = this.showHideEmailWarning(this.model.saveConfig.stageConfigs, this.data.EMAIL_STEPS, this.data.emailConfigured);
            this.data.emailRequired = tempConfig.emailRequired;
        },
        disableForm: function disableForm() {
            this.$el.find(".section-check").prop("disabled", true);
            this.$el.find(".save-config").prop("disabled", true);
            this.$el.find("#identityServiceUrl").prop("disabled", true);
            this.$el.find(".self-service-card").toggleClass("disabled", true);

            this.$el.find("#advancedTab").toggleClass("disabled", true);
            this.$el.find("#advancedTab a").removeAttr("data-toggle");

            this.$el.find("#optionTab a").trigger("click");

            this.$el.find("#optionTab").toggleClass("disabled", true);
            this.$el.find("#optionTab a").removeAttr("data-toggle");

            this.$el.find(".all-check").val(false);
            this.$el.find(".all-check").prop("checked", false);
        },
        enableForm: function enableForm() {
            this.$el.find(".section-check").prop("disabled", false);
            this.$el.find(".save-config").prop("disabled", false);
            this.$el.find("#identityServiceUrl").prop("disabled", false);

            this.$el.find(".notTogglable").toggleClass("disabled", false);

            this.$el.find("#advancedTab a").attr("data-toggle", "tab");
            this.$el.find("#advancedTab").toggleClass("disabled", false);

            this.$el.find("#optionTab a").attr("data-toggle", "tab");
            this.$el.find("#optionTab").toggleClass("disabled", false);

            this.$el.find(".all-check").val(true);
            this.$el.find(".all-check").prop("checked", true);

            this.updateIdentityServiceURL();
        },
        controlSectionSwitch: function controlSectionSwitch(event, fromControlAll) {
            var check = $(event.target),
                card = check.parents(".wide-card"),
                type = card.attr("data-type"),
                removeConfig = false,
                orderPosition,
                tempConfig,
                configPosition = _.findIndex(this.model.configDefault.stageConfigs, function (defaultStage) {
                return defaultStage.name === type;
            });

            if (check.is(":checked")) {
                card.toggleClass("disabled", false);
                card.toggleClass("active", true);

                orderPosition = this.$el.find(".selfservice-holder .wide-card:not(.disabled)").index(card);

                if (_.filter(this.model.saveConfig.stageConfigs, { "name": type }).length === 0) {
                    this.model.saveConfig.stageConfigs.splice(orderPosition, 0, _.clone(this.model.configDefault.stageConfigs[configPosition]));
                }
            } else {
                card.toggleClass("active", false);
                card.toggleClass("disabled", true);

                if (this.$el.find(".section-check:checked").length === 0 && this.$el.find(".all-check:checked").length !== 0 && !fromControlAll) {
                    this.$el.find(".all-check").trigger("click");
                    removeConfig = true;
                }

                this.model.saveConfig.stageConfigs = _.reject(this.model.saveConfig.stageConfigs, function (stage) {
                    return stage.name === type;
                });
            }

            if (_.indexOf(this.data.EMAIL_STEPS, type) > -1) {
                tempConfig = this.showHideEmailWarning(this.model.saveConfig.stageConfigs, this.data.EMAIL_STEPS, this.data.emailConfigured);
                this.data.emailRequired = tempConfig.emailRequired;
            }

            this.showCaptchaWarning(this.model.saveConfig.stageConfigs);

            if (!this.model.surpressSave && !removeConfig) {
                this.saveConfig();
            }
        },

        showDetailDialog: function showDetailDialog(event) {
            var el,
                type = $(event.target).parents(".wide-card").attr("data-type"),
                editable = $(event.target).parents(".wide-card").attr("data-editable"),
                currentData = _.filter(this.model.saveConfig.stageConfigs, { "name": type })[0],
                defaultConfig = _.filter(this.data.configList, { "type": type })[0],
                orderPosition = $(event.target).closest(".self-service-card.active").index(),
                self = this,
                resetList = [];

            if ($(event.target).hasClass("self-service-card")) {
                el = $(event.target);
            } else {
                el = $(event.target).closest(".self-service-card");
            }

            if (el.hasClass("disabled")) {
                return false;
            }

            // If there is no data for the selected step and icon property is present, icon property indicates the step is mandatory
            if (!currentData && defaultConfig.icon.length > 0) {
                defaultConfig = _.clone(_.filter(this.model.configDefault.stageConfigs, { "name": type })[0]);

                if (_.filter(this.model.saveConfig.stageConfigs, { "name": type }).length === 0) {
                    this.model.saveConfig.stageConfigs.splice(orderPosition, 0, defaultConfig);
                }

                currentData = _.filter(this.model.saveConfig.stageConfigs, { "name": type })[0];
            }

            currentData.identityServiceProperties = this.data.identityServiceProperties;

            if (this.filterPropertiesList) {
                currentData.identityServiceProperties = this.filterPropertiesList(currentData.identityServiceProperties, type, this.data.identityServicePropertiesDetails);
            }

            if (type === "kbaSecurityAnswerVerificationStage" && $(event.target).parents(".checkbox").length === 0 && editable === "true") {
                this.dialog = BootstrapDialog.show({
                    title: $.t("templates.selfservice.kbaStage.kbaDialogTitle"),
                    type: BootstrapDialog.TYPE_DEFAULT,
                    size: BootstrapDialog.SIZE_WIDE,
                    message: '<div id="SelfServiceStageDialog"></div>',
                    onshown: _.bind(function (dialogRef) {
                        kbaSecurityAnswerDefinitionStage.render({ "data": currentData });
                    }),
                    buttons: [{
                        label: $.t("common.form.close"),
                        action: function action(dialogRef) {
                            dialogRef.close();
                        }
                    }, {
                        label: $.t("common.form.save"),
                        cssClass: "btn-primary",
                        id: "saveUserConfig",
                        action: function action(dialogRef) {
                            kbaSecurityAnswerDefinitionStage.saveKBA();
                            EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, self.model.msgType + "Save");
                            dialogRef.close();
                        }
                    }]
                });
            } else if ($(event.target).parents(".checkbox").length === 0 && editable === "true") {
                this.dialog = BootstrapDialog.show({
                    title: $.t("templates.selfservice." + this.model.serviceType + "." + type + "Title"),
                    type: BootstrapDialog.TYPE_DEFAULT,
                    size: BootstrapDialog.SIZE_WIDE,
                    message: $(handlebars.compile("{{> selfservice/_" + type + "}}")(currentData)),
                    onshown: _.bind(function (dialogRef) {
                        var _this = this;

                        _.each(dialogRef.$modalBody.find(".email-message-code-mirror-disabled"), function (instance) {
                            codeMirror.fromTextArea(instance, _.extend({ readOnly: true, cursorBlinkRate: -1 }, _this.data.codeMirrorConfig));
                        });

                        if (dialogRef.$modalBody.find(".email-message-code-mirror")[0]) {
                            this.cmBox = codeMirror.fromTextArea(dialogRef.$modalBody.find(".email-message-code-mirror")[0], this.data.codeMirrorConfig);
                            this.cmBox.on("change", function () {
                                _this.checkAddTranslation();
                            });
                        }

                        dialogRef.$modalBody.find(".basic-selectize-field").selectize({
                            "create": true,
                            "persist": false,
                            "allowEmptyOption": true
                        });

                        dialogRef.$modalBody.find(".array-selection").selectize({
                            delimiter: ",",
                            persist: false,
                            create: function create(input) {
                                return {
                                    value: input,
                                    text: input
                                };
                            }
                        });

                        dialogRef.$modalBody.on("submit", "form", function (e) {
                            e.preventDefault();
                            return false;
                        });
                        dialogRef.$modalBody.on("click", ".translationMapGroup button.add", { currentStageConfig: currentData }, _.bind(this.addTranslation, this));

                        dialogRef.$modalBody.on("click", ".translationMapGroup button.delete", { currentStageConfig: currentData }, _.bind(this.deleteTranslation, this));

                        dialogRef.$modalBody.on("keyup", ".translationMapGroup .newTranslationLocale, .translationMapGroup .newTranslationText", { currentStageConfig: currentData }, _.bind(this.checkAddTranslation, this));
                    }, this),
                    buttons: [{
                        label: $.t("common.form.close"),
                        action: function action(dialogRef) {
                            dialogRef.close();
                        }
                    }, {
                        label: $.t("common.form.save"),
                        cssClass: "btn-primary",
                        id: "saveUserConfig",
                        action: function action(dialogRef) {
                            var formData = form2js("configDialogForm", ".", true),
                                tempName;

                            _.extend(currentData, formData);

                            //Check for array items and set the values
                            _.each(dialogRef.$modalBody.find("input.array-selection"), function (arraySelection) {
                                tempName = $(arraySelection).prop("name");
                                currentData[tempName] = $(arraySelection)[0].selectize.getValue().split(",");
                            }, this);

                            self.saveConfig();

                            dialogRef.close();
                        }
                    }]
                });
            }
        },

        getResources: function getResources() {
            var resourcePromise = $.Deferred();

            if (!this.data.resources) {
                AdminUtils.getAvailableResourceEndpoints().then(_.bind(function (resources) {
                    resourcePromise.resolve(resources);
                }, this));
            } else {
                resourcePromise.resolve(this.data.resources);
            }

            return resourcePromise.promise();
        },

        getSelfServiceConfig: function getSelfServiceConfig() {
            var promise = $.Deferred();

            ConfigDelegate.readEntity(this.model.configUrl).always(function (result) {
                promise.resolve(result);
            });

            return promise.promise();
        },

        /**
         * @param stageConfigs {Array.<Object>}
         * @param EMAIL_STEPS {Array.<String>}
         * @param emailConfigured {boolean}
         *
         * @returns {{emailRequired: boolean, showWarning: boolean}}
         */
        showHideEmailWarning: function showHideEmailWarning(stageConfigs, EMAIL_STEPS, emailConfigured) {
            var emailRequired = false,
                show = false;

            _.each(stageConfigs, function (stage) {
                if (_.indexOf(EMAIL_STEPS, stage.name) > -1) {
                    emailRequired = true;
                }
            });

            if (emailRequired && !emailConfigured) {
                show = true;
            }

            return {
                "emailRequired": emailRequired,
                "showWarning": show
            };
        },

        showCaptchaWarning: function showCaptchaWarning(stageConfigs) {
            if (typeof stageConfigs === "boolean") {
                this.$el.find("#captchaNotConfiguredWarning").toggle(stageConfigs);
            } else {
                this.$el.find("#captchaNotConfiguredWarning").toggle(this.checkCaptchaConfigs(stageConfigs));
            }
        },

        checkCaptchaConfigs: function checkCaptchaConfigs(stageConfigs) {
            var captchaStage = stageConfigs.filter(function (value) {
                return value.name === "captcha";
            })[0];
            if (captchaStage && (!captchaStage.recaptchaSiteKey || !captchaStage.recaptchaSecretKey)) {
                return true;
            } else {
                return false;
            }
        },

        configureCaptcha: function configureCaptcha(event) {
            event.preventDefault();
            this.$el.find("[data-type='captcha'] i.fa.fa-pencil").trigger("click");
        },

        selfServiceRender: function selfServiceRender(args, callback) {
            var disabledList,
                configList = [];

            this.data.defaultIdentityServiceURL = "";

            $.when(this.getResources(), ConfigDelegate.readEntity("ui/configuration"), this.getSelfServiceConfig()).then(_.bind(function (resources, uiConfig, selfServiceConfig) {
                var _this2 = this;

                ConfigDelegate.readEntity("external.email").always(function (config) {
                    _this2.data.emailConfigured = !_.isUndefined(config) && _.has(config, "host");
                    _this2.data.resources = resources;
                    _this2.model.uiConfig = uiConfig;

                    if (selfServiceConfig) {

                        $.extend(true, _this2.model.saveConfig, selfServiceConfig);
                        $.extend(true, _this2.data.config, selfServiceConfig);

                        _this2.data.hideAdvanced = false;

                        _.each(_this2.data.configList, function (config, pos) {
                            config.index = pos;
                        });

                        disabledList = _.filter(_this2.data.configList, function (config) {
                            var filterCheck = true;

                            _.each(selfServiceConfig.stageConfigs, function (stage) {
                                if (stage.name === config.type) {
                                    filterCheck = false;

                                    // If a step is enabled and it is an email step, require the email config
                                    if (_.indexOf(this.data.EMAIL_STEPS, config.type) > -1) {
                                        this.data.emailRequired = true;
                                    }
                                }
                            }, _this2);

                            return filterCheck;
                        });

                        _.each(selfServiceConfig.stageConfigs, function (stage) {
                            _.each(this.data.configList, function (config) {
                                if (stage.name === config.type) {
                                    configList.push(config);
                                }
                            }, this);
                        }, _this2);

                        _.each(disabledList, function (config) {
                            configList.splice(config.index, 0, config);
                        }, _this2);

                        _this2.data.configList = configList;
                        _this2.data.enableSelfService = true;

                        // The value of the first identity service url save location
                        _this2.data.defaultIdentityServiceURL = _.filter(selfServiceConfig.stageConfigs, {
                            "name": _this2.model.identityServiceURLSaveLocations[0].stepName
                        })[0][_this2.model.identityServiceURLSaveLocations[0].stepProperty];

                        _.each(_this2.data.configList, function (config) {
                            if (config.emailStep) {
                                config.editable = _this2.data.emailConfigured;
                                config.showEmailError = !_this2.data.emailConfigured;
                            }
                        });

                        _this2.parentRender(_.bind(function () {
                            var _this3 = this;

                            this.$el.find(".all-check").prop("checked", true);
                            this.$el.find(".all-check").val(true);
                            this.$el.find(".section-check").prop("disabled", false);
                            this.$el.find(".has-email-error").prop("disabled", true);

                            this.updateIdentityServiceURL();

                            this.model.surpressSave = true;
                            this.setSortable();

                            _.each(selfServiceConfig.stageConfigs, function (stage) {
                                _this3.$el.find(".wide-card[data-type='" + stage.name + "']").toggleClass("disabled", false);
                                _this3.$el.find(".wide-card[data-type='" + stage.name + "'] .section-check").prop("checked", true).trigger("change");
                            });
                            this.showCaptchaWarning(this.model.saveConfig.stageConfigs);

                            this.model.surpressSave = false;

                            if (callback) {
                                callback();
                            }
                        }, _this2));
                    } else {

                        $.extend(true, _this2.model.saveConfig, _this2.model.configDefault);
                        $.extend(true, _this2.data.config, _this2.model.configDefault);

                        _this2.data.enableSelfService = false;

                        _this2.parentRender(_.bind(function () {
                            this.disableForm();
                            this.setSortable();
                            this.showCaptchaWarning(false);
                            if (callback) {
                                callback();
                            }
                        }, _this2));
                    }
                });
            }, this));
        },

        setSortable: function setSortable() {
            var start,
                dragDropInstance = dragula([$(".selfservice-holder")[0]]);

            dragDropInstance.on("drag", _.bind(function (el, container) {
                start = this.$el.find(".selfservice-holder .card").not(".disabled").index($(el));

                AutoScroll.startDrag();
            }, this));

            dragDropInstance.on("dragend", _.bind(function (el) {
                var stop = this.$el.find(".selfservice-holder .card").not(".disabled").index($(el));

                AutoScroll.endDrag();

                this.setOrder(start, stop);
            }, this));
        },

        setOrder: function setOrder(start, end) {
            var movedElement = this.model.saveConfig.stageConfigs[start];

            if (start !== end) {
                this.model.saveConfig.stageConfigs.splice(start, 1);
                this.model.saveConfig.stageConfigs.splice(end, 0, movedElement);
            }

            if (!_.isUndefined(movedElement)) {
                this.saveConfig();
            }
        },

        orderCheck: function orderCheck() {
            var tempConfig = {},
                stageOrder = [];

            $.extend(true, tempConfig, this.model.saveConfig);

            _.each(this.$el.find(".selfservice-holder .wide-card"), function (config) {
                _.each(tempConfig.stageConfigs, function (stage) {
                    if (stage.name === $(config).attr("data-type")) {
                        stageOrder.push(_.clone(stage));
                    }
                }, this);
            }, this);

            tempConfig.stageConfigs = stageOrder;

            return tempConfig;
        },

        updateIdentityServiceURL: function updateIdentityServiceURL(e) {
            this.data.defaultIdentityServiceURL = this.$el.find("#identityServiceUrl").val();

            AdminUtils.findPropertiesList(this.data.defaultIdentityServiceURL.split("/")).then(_.bind(function (properties) {
                this.data.identityServiceProperties = _.chain(properties).keys().sortBy().value();
                this.data.identityServicePropertiesDetails = properties;
            }, this));

            if (e) {
                this.saveConfig();
            }
        },

        saveConfig: function saveConfig() {
            var formData = form2js("advancedOptions", ".", true),
                saveData = {},
                tempStepConfig;

            // For each key/property location that the identity service URL should be saved
            // find the corresponding location and set it.
            _.each(this.model.identityServiceURLSaveLocations, function (data) {
                tempStepConfig = _.filter(this.model.saveConfig.stageConfigs, { "name": data.stepName })[0];
                if (tempStepConfig) {
                    tempStepConfig[data.stepProperty] = this.data.defaultIdentityServiceURL;
                }
            }, this);

            $.extend(true, saveData, this.model.saveConfig, formData);

            _.each(saveData.stageConfigs, function (step) {
                if (_.has(step, "identityServiceProperties")) {
                    delete step.identityServiceProperties;
                    delete step.identityServicePropertiesDetails;
                }
            });

            this.setKBAEnabled();
            return $.when(ConfigDelegate.updateEntity(this.model.configUrl, saveData), ConfigDelegate.updateEntity("ui/configuration", this.model.uiConfig)).then(_.bind(function () {
                SiteConfigurationDelegate.updateConfiguration(function () {
                    EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                });
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, this.model.msgType + "Save");
                this.showCaptchaWarning(this.model.saveConfig.stageConfigs);
            }, this));
        },
        setKBAEnabled: function setKBAEnabled() {
            this.model.uiConfig.configuration.kbaEnabled = !!this.model.uiConfig.configuration.kbaDefinitionEnabled || !!this.model.uiConfig.configuration.kbaVerificationEnabled;
        },
        preventTab: function preventTab(event) {
            event.preventDefault();
        }
    });

    return AbstractSelfServiceView;
});
