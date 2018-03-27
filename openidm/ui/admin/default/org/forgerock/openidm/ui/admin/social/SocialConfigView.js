"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "form2js", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/util/AdminUtils", "org/forgerock/openidm/ui/admin/delegates/RepoDelegate", "org/forgerock/openidm/ui/admin/delegates/SiteConfigurationDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/selfservice/UserRegistrationConfigView", "bootstrap-dialog", "selectize", "libs/codemirror/lib/codemirror", "libs/codemirror/mode/css/css"], function ($, _, handlebars, form2js, AdminAbstractView, ConfigDelegate, SocialDelegate, EventManager, Constants, AdminUtils, RepoDelegate, SiteConfigurationDelegate, UIUtils, UserRegistrationConfigView, BootstrapDialog, selectize, codemirror) {
    var SocialConfigView = AdminAbstractView.extend({
        template: "templates/admin/social/SocialConfigTemplate.html",
        events: {
            "change .section-check": "controlSectionSwitch",
            "click .btn-link": "editConfig"
        },
        model: {
            "buttonCustomStyle": null,
            "buttonCustomStyleHover": null
        },
        partials: ["partials/_toggleIconBlock.html", "partials/social/_oAuth2.html", "partials/social/_callback.html", "partials/social/_badgeButtonConfig.html", "partials/providers/_providerBadge.html", "partials/providers/_providerButton.html", "partials/providers/_providerCircle.html", "partials/form/_basicInput.html", "partials/form/_tagSelectize.html", "partials/_alert.html"],

        render: function render(args, callback) {
            var _this = this;

            $.when(ConfigDelegate.configQuery("_id sw \"identityProvider/\""), SocialDelegate.availableProviders(), SocialDelegate.providerList(), ConfigDelegate.readEntityAlways("selfservice/registration"), ConfigDelegate.readEntityAlways("authentication")).then(function (currentProviders, availableProviders, enabledProviders, userRegistration, authentication) {
                _this.loadProviderSettingsPartials(availableProviders).then(function () {
                    currentProviders = currentProviders[0].result;

                    availableProviders.providers = availableProviders.providers;

                    availableProviders.providers = _.map(availableProviders.providers, function (p) {
                        p.enabled = false;
                        p.redirectUri = window.location.protocol + "//" + window.location.host + "/oauthReturn/";
                        return p;
                    });
                    _this.data.providers = _.cloneDeep(availableProviders.providers);

                    _this.model.providers = _.cloneDeep(availableProviders.providers);
                    _this.model.authentication = authentication;

                    _this.model.AuthModuleEnabled = _.some(authentication.serverAuthContext.authModules, function (module) {
                        return _.indexOf(["SOCIAL_PROVIDERS", "OAUTH_CLIENT"], module.name) !== -1 && module.enabled;
                    });

                    _this.model.userRegistration = userRegistration;

                    _.each(_this.data.providers, function (provider, index) {
                        provider.name = provider.provider;
                        provider.togglable = true;
                        provider.editable = true;
                        provider.details = $.t("templates.socialProviders.configureProvider");

                        _.each(currentProviders, function (currentProvider) {
                            if (provider.provider === currentProvider.provider) {
                                _.extend(_this.model.providers[index], currentProvider);

                                provider.enabled = true;
                            }
                        });

                        var customConfig = _.findWhere(enabledProviders.providers, { "provider": provider.name });

                        if (customConfig) {
                            provider.uiConfig = customConfig.uiConfig;
                        }
                    });

                    _this.parentRender(function () {
                        var messageResult = _this.getMessageState(currentProviders.length, _this.model.userRegistration, _this.model.AuthModuleEnabled);

                        if (messageResult.login) {
                            _this.$el.find("#socialNoAuthWarningMessage").show();
                        } else {
                            _this.$el.find("#socialNoAuthWarningMessage").hide();
                        }

                        if (messageResult.registration) {
                            _this.$el.find("#socialNoRegistrationWarningMessage").show();
                        } else {
                            _this.$el.find("#socialNoRegistrationWarningMessage").hide();
                        }
                    });
                });
            });
        },

        getMessageState: function getMessageState(providerCount, userRegistration, AuthModuleEnabled) {
            var messageDisplay = {
                "login": false,
                "registration": false
            };

            if (!_.isUndefined(userRegistration)) {
                var index = _.findIndex(userRegistration.stageConfigs, function (stage) {
                    return stage.name === 'idmUserDetails';
                });

                if (index !== -1 && userRegistration.stageConfigs[index].socialRegistrationEnabled === false && providerCount > 0) {
                    messageDisplay.registration = true;
                }
            } else {
                messageDisplay.registration = true;
            }

            if (!AuthModuleEnabled && providerCount > 0) {
                messageDisplay.login = true;
            } else {
                messageDisplay.login = false;
            }

            return messageDisplay;
        },

        controlSectionSwitch: function controlSectionSwitch(event) {
            var _this2 = this;

            event.preventDefault();
            var toggle = $(event.target),
                card = toggle.parents(".wide-card"),
                index = this.$el.find(".wide-card").index(card),
                enabled,
                providerCount,
                messageResult,
                managedConfigPromise = ConfigDelegate.readEntity("managed");

            card.toggleClass("disabled");
            enabled = !card.hasClass("disabled");

            this.model.providers[index].enabled = enabled;

            providerCount = _.filter(this.model.providers, function (provider) {
                return provider.enabled;
            }).length;

            if (enabled) {
                this.createConfig(this.model.providers[index]).then(function () {
                    managedConfigPromise.then(function (managedConfig) {
                        if (providerCount === 1) {
                            return _this2.addBindUnbindBehavior(_this2.addIDPsProperty(managedConfig));
                        } else {
                            return managedConfig;
                        }
                    }).then(function (managedConfig) {
                        return _this2.addManagedObjectForIDP(_this2.model.providers[index], managedConfig);
                    }).then(function (managedConfig) {
                        return ConfigDelegate.updateEntity("managed", managedConfig);
                    }).then(function () {
                        SiteConfigurationDelegate.updateConfiguration(function () {
                            EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                        });
                    });

                    card.find(".btn-link").trigger("click");
                });
            } else {
                this.deleteConfig(this.model.providers[index]).then(function () {
                    managedConfigPromise.then(function (managedConfig) {
                        if (providerCount === 0) {
                            return _this2.removeBindUnbindBehavior(_this2.removeIDPsProperty(managedConfig));
                        } else {
                            return managedConfig;
                        }
                    }).then(function (managedConfig) {
                        return _this2.removeManagedObjectForIDP(_this2.model.providers[index], managedConfig);
                    }).then(function (managedConfig) {
                        return ConfigDelegate.updateEntity("managed", managedConfig);
                    }).then(function () {
                        SiteConfigurationDelegate.updateConfiguration(function () {
                            EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                        });
                    });
                });
            }

            if (providerCount === 0 && !_.isUndefined(this.model.userRegistration)) {
                var _index = _.findIndex(this.model.userRegistration.stageConfigs, function (stage) {
                    return stage.name === 'idmUserDetails';
                });

                if (this.model.userRegistration.stageConfigs[_index].socialRegistrationEnabled === true) {
                    this.model.userRegistration.stageConfigs[_index].socialRegistrationEnabled = false;

                    ConfigDelegate.updateEntity("selfservice/registration", this.model.userRegistration);
                    ConfigDelegate.deleteEntity("selfservice/socialUserClaim");
                }
            }

            messageResult = this.getMessageState(providerCount, this.model.userRegistration, this.model.AuthModuleEnabled);

            if (messageResult.login) {
                this.$el.find("#socialNoAuthWarningMessage").show();
            } else {
                this.$el.find("#socialNoAuthWarningMessage").hide();
            }

            if (messageResult.registration) {
                this.$el.find("#socialNoRegistrationWarningMessage").show();
            } else {
                this.$el.find("#socialNoRegistrationWarningMessage").hide();
            }
        },

        editConfig: function editConfig(event) {
            var _this3 = this;

            event.preventDefault();

            var card = $(event.target).parents(".wide-card"),
                cardDetails = this.getCardDetails(card),
                index = this.$el.find(".wide-card").index(card),
                dialogDetails,
                additionalDisplayData = {
                "action": $.t("templates.socialProviders.previewAction")
            };

            ConfigDelegate.readEntity("identityProvider/" + cardDetails.provider).then(function (providerConfig) {
                try {
                    dialogDetails = $(handlebars.compile("{{> _" + cardDetails.provider + "}}")(_.extend(additionalDisplayData, providerConfig)));
                } catch (e) {
                    additionalDisplayData.configureGeneral = $.t("templates.socialProviders.configureGeneral", { "providerType": providerConfig.provider });
                    additionalDisplayData.generalHelp = $.t("templates.socialProviders.generalHelp", { "providerType": providerConfig.provider });

                    dialogDetails = $(handlebars.compile("{{> social/_oAuth2}}")(_.extend(additionalDisplayData, providerConfig)));
                }

                _this3.dialog = BootstrapDialog.show({
                    title: AdminUtils.capitalizeName(cardDetails.provider) + " " + $.t("templates.socialProviders.provider"),
                    type: BootstrapDialog.TYPE_DEFAULT,
                    size: BootstrapDialog.SIZE_WIDE,
                    message: dialogDetails,
                    onshow: function onshow(dialogRef) {
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
                        function buttonBadgeConfigChange(e) {
                            var saveData = this.getSocialSaveData(providerConfig);
                            dialogRef.$modalBody.find(".preview-configs .badge").replaceWith($(handlebars.compile("{{> providers/_providerBadge}}")(saveData)));
                            dialogRef.$modalBody.find(".preview-configs .small-circle").replaceWith($(handlebars.compile("{{> providers/_providerCircle size='small'}}")(saveData)));
                            dialogRef.$modalBody.find(".preview-configs .large-circle").replaceWith($(handlebars.compile("{{> providers/_providerCircle size='large'}}")(saveData)));
                            dialogRef.$modalBody.find(".preview-configs .social-button").replaceWith($(handlebars.compile("{{> providers/_providerButton action='" + $.t("templates.socialProviders.previewAction") + "'}}")(saveData)));
                        }

                        function checkImagePath() {
                            var input = dialogRef.$modalBody.find(".button-image-path-input");

                            $.ajax({ url: input.val() }).done(function () {
                                $(input).next(".validation-message").text("");
                            }).error(function () {
                                $(input).next(".validation-message").text($.t("templates.socialProviders.buttonImageMissing"));
                            });
                        }
                        _this3.model.buttonCustomStyle = codemirror.fromTextArea(dialogRef.$modalBody.find(".button-html")[0], {
                            lineNumbers: true,
                            viewportMargin: Infinity,
                            theme: "forgerock",
                            mode: "css",
                            htmlMode: true,
                            lineWrapping: true
                        });
                        _this3.model.buttonCustomStyleHover = codemirror.fromTextArea(dialogRef.$modalBody.find(".button-html")[1], {
                            lineNumbers: true,
                            viewportMargin: Infinity,
                            theme: "forgerock",
                            mode: "css",
                            htmlMode: true,
                            lineWrapping: true
                        });
                        _this3.model.buttonCustomStyle.on("blur", _.bind(buttonBadgeConfigChange, _this3));
                        _this3.model.buttonCustomStyleHover.on("blur", _.bind(buttonBadgeConfigChange, _this3));

                        dialogRef.$modalBody.find(".badgeButtonConfig").on("change", _.bind(checkImagePath, _this3));

                        dialogRef.$modalBody.on("shown.bs.collapse", "#advancedOptions", function (e) {
                            _this3.model.buttonCustomStyle.refresh();
                            _this3.model.buttonCustomStyleHover.refresh();
                            checkImagePath();
                        });

                        dialogRef.$modalBody.on("click", ".btn-copy", function (e) {
                            // Select the content
                            $(e.currentTarget).closest(".input-group").find("input").select();
                            // Copy to the clipboard
                            document.execCommand('copy');
                        });

                        dialogRef.$modalBody.on("click", ".advanced-options-toggle", function (e) {
                            return _this3.advancedOptionToggle(e);
                        });
                        dialogRef.$modalBody.on("click", ".btn-social-provider", function (e) {
                            e.preventDefault();
                        });

                        dialogRef.$modalBody.on("blur", ".badgeButtonConfig", _.bind(buttonBadgeConfigChange, _this3));
                    },
                    onshown: function onshown() {
                        _this3.model.buttonCustomStyle.refresh();
                        _this3.model.buttonCustomStyleHover.refresh();
                    },
                    onclose: function onclose(dialogRef) {
                        _this3.model.buttonCustomStyle = null;
                        _this3.model.buttonCustomStyleHover = null;
                    },
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
                            var saveData = _this3.getSocialSaveData(providerConfig);
                            _this3.saveConfig(saveData);
                            _this3.model.providers[index] = saveData;
                            _this3.$el.find($(".self-service-card .fr-circle-icon")[index]).replaceWith($(handlebars.compile("{{> providers/_providerCircle size='large'}}")(saveData)));
                            dialogRef.close();
                        }
                    }]
                });
            });
        },

        getSocialSaveData: function getSocialSaveData(providerConfig) {
            var formData = form2js("socialDialogForm", ".", true),
                saveData;

            saveData = this.generateSaveData(formData, providerConfig);

            saveData.uiConfig.buttonCustomStyle = this.model.buttonCustomStyle.getValue().replace(/(\r\n|\n|\r)/gm, "");
            saveData.uiConfig.buttonCustomStyleHover = this.model.buttonCustomStyleHover.getValue().replace(/(\r\n|\n|\r)/gm, "");

            if (saveData.clientId && saveData.clientId.length) {
                saveData.clientId = saveData.clientId.trim();
            }

            if (saveData.clientSecret && saveData.clientSecret.length) {
                saveData.clientSecret = saveData.clientSecret.trim();
            }

            return saveData;
        },

        advancedOptionToggle: function advancedOptionToggle(event) {
            event.preventDefault();

            var link = $(event.target);

            if (link.hasClass("collapsed")) {
                link.text($.t("templates.socialProviders.hideAdvanced"));
            } else {
                link.text($.t("templates.socialProviders.showAdvanced"));
            }
        },

        generateSaveData: function generateSaveData(formData, currentData) {
            var secret = currentData.clientSecret;

            _.extend(currentData, formData);

            if (_.isNull(currentData.clientSecret)) {
                currentData.clientSecret = secret;
            }

            return currentData;
        },

        getCardDetails: function getCardDetails(card) {
            var cardDetails = {};

            cardDetails.type = card.attr("data-type");
            cardDetails.provider = card.attr("data-name");

            return cardDetails;
        },

        createConfig: function createConfig(config) {
            return ConfigDelegate.createEntity("identityProvider/" + config.provider, config).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "saveSocialProvider");
            });
        },

        deleteConfig: function deleteConfig(config) {
            return ConfigDelegate.deleteEntity("identityProvider/" + config.provider).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "deleteSocialProvider");
            });
        },

        saveConfig: function saveConfig(config) {
            return ConfigDelegate.updateEntity("identityProvider/" + config.provider, config).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "saveSocialProvider");
            });
        },

        /**
         * Update the managedConfig for the user object to add bind and unbind actions
         * @param {object} managedConfig the full managed config value
         */
        addBindUnbindBehavior: function addBindUnbindBehavior(managedConfig) {
            var updatedManagedConfig = _.cloneDeep(managedConfig),
                managedUser = _.find(updatedManagedConfig.objects, function (o) {
                return o.name === "user";
            });

            if (!_.has(managedUser, "actions")) {
                managedUser.actions = {};
            }
            if (!_.has(managedUser.actions, "unbind")) {
                managedUser.actions.unbind = {
                    "type": "text/javascript",
                    "file": "ui/unBindBehavior.js",
                    "apiDescriptor": {
                        "parameters": [{
                            "name": "provider",
                            "type": "string",
                            "required": true
                        }]
                    }
                };
            }
            if (!_.has(managedUser.actions, "bind")) {
                managedUser.actions.bind = {
                    "type": "text/javascript",
                    "file": "ui/bindBehavior.js",
                    "apiDescriptor": {
                        "parameters": [{
                            "name": "provider",
                            "type": "string",
                            "required": true
                        }]
                    }
                };
            }
            return updatedManagedConfig;
        },

        /**
         * Update the managedConfig for the user object to remove bind and unbind actions
         * @param {object} managedConfig the full managed config value
         */
        removeBindUnbindBehavior: function removeBindUnbindBehavior(managedConfig) {
            var updatedManagedConfig = _.cloneDeep(managedConfig),
                managedUser = _.find(updatedManagedConfig.objects, function (o) {
                return o.name === "user";
            });

            if (_.has(managedUser, "actions.unbind")) {
                delete managedUser.actions.unbind;
            }
            if (_.has(managedUser, "actions.bind")) {
                delete managedUser.actions.bind;
            }
            return updatedManagedConfig;
        },

        /**
         * Add a new managed object for the given provider, including user relationship references
         * @param {object} provider the full config of the provider
         * @param {string} provider.provider the name of the provider
         * @param {object} provider.schema the JSON schema describing the userInfo response
         * @param {object} managedConfig the full managed config value
         */
        addManagedObjectForIDP: function addManagedObjectForIDP(provider, managedConfig) {
            var updatedManagedConfig = _.cloneDeep(managedConfig),
                managedUser = _.find(updatedManagedConfig.objects, function (o) {
                return o.name === "user";
            }),

            // take the top three properties from the schema config as the default
            // representative values for the resourceCollection; if no schema available, use _id
            fields = provider.schema && provider.schema.order ? provider.schema.order.slice(0, 3) : ["_id"];

            managedUser.schema.properties.idps.items.resourceCollection.push({
                "path": "managed/" + provider.provider,
                "label": provider.provider + " Info",
                "query": {
                    "queryFilter": "true",
                    "fields": fields,
                    "sortKeys": fields
                }
            });

            if (!_.find(updatedManagedConfig.objects, function (o) {
                return o.name === provider.provider;
            })) {
                var newObjectSchema = _.merge({
                    "title": provider.provider,
                    "type": "object",
                    "viewable": true,
                    "properties": {
                        "user": {
                            "viewable": true,
                            "searchable": false,
                            "type": "relationship",
                            "title": "User",
                            "reverseRelationship": true,
                            "reversePropertyName": "idps",
                            "validate": true,
                            "properties": {
                                "_ref": {
                                    "description": "References a relationship from a managed object",
                                    "type": "string"
                                },
                                "_refProperties": {
                                    "description": "Supports metadata within the relationship",
                                    "type": "object",
                                    "title": provider.provider + "user _refProperties",
                                    "properties": {}
                                }
                            },
                            "resourceCollection": [{
                                "path": "managed/user",
                                "label": "User",
                                "query": {
                                    "queryFilter": "true",
                                    "fields": ["userName"],
                                    "sortKeys": ["userName"]
                                }
                            }]
                        }
                    },
                    "order": []
                },
                // use the provider schema if it is available, otherwise have an _id-only schema
                provider.schema || {
                    "properties": {
                        "_id": {
                            "title": "ID",
                            "viewable": true,
                            "searchable": true,
                            "type": "string"
                        }
                    },
                    "order": ["_id"]
                });
                newObjectSchema.order.push("user");
                updatedManagedConfig.objects.push({
                    "name": provider.provider,
                    "title": provider.provider + " User Info",
                    "schema": newObjectSchema
                });
            }
            return updatedManagedConfig;
        },
        /**
         * Remove a provider from the managed config, and from the user's idps collection
         * @param {object} provider the full config of the provider
         * @param {string} provider.provider the name of the provider
         * @param {object} managedConfig the full managed config value
         */
        removeManagedObjectForIDP: function removeManagedObjectForIDP(provider, managedConfig) {
            var updatedManagedConfig = _.cloneDeep(managedConfig),
                managedUser = _.find(updatedManagedConfig.objects, function (o) {
                return o.name === "user";
            }),
                idps = managedUser.schema.properties.idps;

            // idps may be undefined if all of them have been removed
            if (idps) {
                idps.items.resourceCollection = _.filter(idps.items.resourceCollection, function (r) {
                    return r.path !== 'managed/' + provider.provider;
                });
            }

            updatedManagedConfig.objects = _.filter(updatedManagedConfig.objects, function (o) {
                return o.name !== provider.provider;
            });
            return updatedManagedConfig;
        },
        /**
         * Update the managedConfig for the user object to add a new "idps" relationship property
         * @param {object} managedConfig the full managed config value
         */
        addIDPsProperty: function addIDPsProperty(managedConfig) {
            var updatedManagedConfig = _.cloneDeep(managedConfig),
                managedUser = _.find(updatedManagedConfig.objects, function (o) {
                return o.name === "user";
            });

            managedUser.schema.properties.idps = {
                "title": "Identity Providers",
                "viewable": true,
                "searchable": false,
                "userEditable": false,
                "returnByDefault": false,
                "type": "array",
                "items": {
                    "type": "relationship",
                    "reverseRelationship": true,
                    "reversePropertyName": "user",
                    "validate": true,
                    "properties": {
                        "_ref": {
                            "description": "References a relationship from a managed object",
                            "type": "string"
                        },
                        "_refProperties": {
                            "description": "Supports metadata within the relationship",
                            "type": "object",
                            "title": "Identity Providers _refProperties",
                            "properties": {}
                        }
                    },
                    "resourceCollection": []
                }
            };

            if (_.indexOf(managedUser.schema.order, "idps") === -1) {
                managedUser.schema.order.push("idps");
            }

            return updatedManagedConfig;
        },
        /**
         * Update the managedConfig for the user object to remove "idps" relationship property
         * @param {object} managedConfig the full managed config value
         */
        removeIDPsProperty: function removeIDPsProperty(managedConfig) {
            var updatedManagedConfig = _.cloneDeep(managedConfig),
                managedUser = _.find(updatedManagedConfig.objects, function (o) {
                return o.name === "user";
            });

            managedUser.schema.order = _.filter(managedUser.schema.order, function (o) {
                return o !== "idps";
            });

            delete managedUser.schema.properties.idps;

            return updatedManagedConfig;
        },
        /**
         * This function loops over all availableProviders and tries to load a settings partial
         * for each of them. If the partial does not exist the process fails gracefully. This
         * allows us to just drop a partial for any new providers into the "partials/social/"
         * directory and avoid any future js changes.
         */
        loadProviderSettingsPartials: function loadProviderSettingsPartials(availableProviders) {
            var partialPromises = [];

            _.each(availableProviders.providers, function (provider) {
                partialPromises.push(AdminUtils.loadExtensionPartial("social", "_" + provider.provider));
            });

            return $.when.apply($, partialPromises);
        }

    });

    return new SocialConfigView();
});
